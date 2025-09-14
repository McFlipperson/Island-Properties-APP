"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyAssignmentService = exports.ProxyAssignmentError = void 0;
exports.getProxyAssignmentService = getProxyAssignmentService;
exports.assignProxyToExpert = assignProxyToExpert;
exports.releaseProxyFromExpert = releaseProxyFromExpert;
const index_1 = require("./db/index");
const schema_1 = require("../shared/schema");
const proxy_cheap_client_1 = require("./proxy-cheap-client");
const encryption_service_1 = require("./encryption-service");
const drizzle_orm_1 = require("drizzle-orm");
// Custom errors
class ProxyAssignmentError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'ProxyAssignmentError';
    }
}
exports.ProxyAssignmentError = ProxyAssignmentError;
// Budget constants
const BUDGET_LIMITS = {
    MAX_MONTHLY_COST: 6.35, // USD
    MAX_PROXIES_PER_EXPERT: 5,
    BUDGET_WARNING_THRESHOLD: 0.8, // 80%
    BUDGET_CRITICAL_THRESHOLD: 1.0 // 100%
};
// Philippines locations for proxy validation
const PHILIPPINES_LOCATIONS = [
    { country: 'PH', city: 'Manila', region: 'Metro Manila' },
    { country: 'PH', city: 'Cebu', region: 'Central Visayas' },
    { country: 'PH', city: 'Davao', region: 'Davao Region' },
    { country: 'PH', city: 'Quezon City', region: 'Metro Manila' },
    { country: 'PH', city: 'Makati', region: 'Metro Manila' }
];
// Main Proxy Assignment Service
class ProxyAssignmentService {
    constructor() {
        this.proxyCheapClient = (0, proxy_cheap_client_1.createProxyCheapClient)();
        this.encryptionService = (0, encryption_service_1.getEncryptionService)();
    }
    /**
     * Complete proxy assignment workflow for expert
     */
    async assignProxyToExpert(request) {
        const { expertId } = request;
        console.log(`🔄 Starting proxy assignment for expert: ${expertId}`);
        try {
            // Step 1: Validate expert exists and budget constraints
            await this.validateExpertAndBudget(expertId, request.budget);
            // Step 2: Check if expert already has active proxy
            const existingProxy = await this.getExpertActiveProxy(expertId);
            if (existingProxy) {
                throw new ProxyAssignmentError('Expert already has an active proxy assigned', 'PROXY_ALREADY_EXISTS', { existingProxyId: existingProxy.id });
            }
            // Step 3: Update assignment status to 'requesting'
            const assignmentId = await this.createProxyAssignment(expertId, 'requesting', request);
            // Step 4: Request proxy from Proxy-Cheap API
            const proxyDetails = await this.requestProxyFromAPI(request.preferredLocation);
            // Step 5: Update assignment status to 'testing'
            await this.updateAssignmentStatus(assignmentId, 'testing');
            // Step 6: Test proxy connection and validate Philippines location
            const testResult = await this.testAndValidateProxy(proxyDetails);
            if (!testResult.success) {
                await this.updateAssignmentStatus(assignmentId, 'failed');
                throw new ProxyAssignmentError('Proxy failed connection or location validation', 'PROXY_VALIDATION_FAILED', testResult);
            }
            // Step 7: Encrypt and store proxy credentials
            const encryptedCredentials = await this.encryptAndStoreCredentials(proxyDetails, expertId, assignmentId);
            // Step 8: Activate proxy assignment
            await this.activateProxyAssignment(assignmentId, proxyDetails, encryptedCredentials);
            console.log(`✅ Proxy successfully assigned to expert: ${expertId}`);
            return {
                success: true,
                assignmentId,
                proxyDetails,
                costProjection: {
                    dailyCost: proxyDetails.cost.daily,
                    monthlyCost: proxyDetails.cost.monthly
                }
            };
        }
        catch (error) {
            console.error(`❌ Proxy assignment failed for expert ${expertId}:`, error);
            if (error instanceof ProxyAssignmentError) {
                return {
                    success: false,
                    error: error.message,
                    warnings: error.details ? [JSON.stringify(error.details)] : undefined
                };
            }
            return {
                success: false,
                error: `Assignment failed: ${error.message}`
            };
        }
    }
    /**
     * Release proxy assignment for expert
     */
    async releaseProxyFromExpert(expertId, reason) {
        console.log(`🔄 Releasing proxy for expert: ${expertId}`);
        try {
            // Get current proxy assignment
            const assignment = await index_1.db
                .select()
                .from(schema_1.proxyAssignments)
                .where((0, drizzle_orm_1.eq)(schema_1.proxyAssignments.personaId, expertId))
                .limit(1);
            if (assignment.length === 0) {
                throw new ProxyAssignmentError('No active proxy assignment found for expert', 'NO_PROXY_ASSIGNED');
            }
            const proxyData = assignment[0];
            // Delete proxy from Proxy-Cheap API if we have the external ID
            if (proxyData.proxyCheapId) {
                try {
                    await this.proxyCheapClient.deleteProxy(proxyData.proxyCheapId);
                }
                catch (error) {
                    console.warn(`⚠️ Failed to delete proxy from Proxy-Cheap API: ${error.message}`);
                }
            }
            // Remove assignment from database
            await index_1.db
                .delete(schema_1.proxyAssignments)
                .where((0, drizzle_orm_1.eq)(schema_1.proxyAssignments.personaId, expertId));
            console.log(`✅ Proxy released for expert: ${expertId}`);
            return true;
        }
        catch (error) {
            console.error(`❌ Failed to release proxy for expert ${expertId}:`, error);
            return false;
        }
    }
    /**
     * Get expert proxy status and budget information
     */
    async getExpertProxyStatus(expertId) {
        // Get current proxy assignment
        const assignment = await this.getExpertActiveProxy(expertId);
        // Calculate budget status
        const budgetStatus = await this.calculateExpertBudgetStatus(expertId);
        return {
            expertId,
            hasActiveProxy: !!assignment,
            proxyDetails: assignment ? {
                id: assignment.id,
                status: assignment.assignmentStatus || 'unknown',
                location: assignment.proxyLocation,
                healthStatus: assignment.healthCheckStatus || 'unknown',
                costToDate: parseFloat(assignment.monthlyCostUsd?.toString() || '0'),
                assignedAt: assignment.assignedAt?.toISOString() || ''
            } : undefined,
            budgetStatus
        };
    }
    /**
     * Perform health check on assigned proxy
     */
    async performProxyHealthCheck(expertId) {
        try {
            const assignment = await this.getExpertActiveProxy(expertId);
            if (!assignment) {
                return {
                    success: false,
                    healthStatus: 'no_proxy',
                    error: 'No active proxy assignment found'
                };
            }
            // Decrypt credentials
            const credentials = await this.decryptProxyCredentials(assignment);
            // Test connection
            const testResult = await this.proxyCheapClient.testProxyConnection({
                host: credentials.host,
                port: credentials.port,
                username: credentials.username,
                password: credentials.password,
                protocol: credentials.protocol
            });
            // Update health check data
            await this.updateProxyHealthStatus(assignment.id, testResult);
            return {
                success: testResult.success,
                healthStatus: testResult.success ? 'healthy' : 'failed',
                responseTime: testResult.responseTime,
                location: testResult.location,
                error: testResult.error
            };
        }
        catch (error) {
            return {
                success: false,
                healthStatus: 'error',
                error: error.message
            };
        }
    }
    /**
     * Get all proxy assignments with status summary
     */
    async getProxyAssignmentsSummary() {
        const assignments = await index_1.db.select().from(schema_1.proxyAssignments);
        const summary = {
            totalAssignments: assignments.length,
            activeProxies: assignments.filter((a) => a.assignmentStatus === 'active').length,
            failedProxies: assignments.filter((a) => a.assignmentStatus === 'failed').length,
            totalMonthlyCost: assignments.reduce((total, a) => total + parseFloat(a.monthlyCostUsd?.toString() || '0'), 0),
            averageResponseTime: assignments.length > 0 ?
                assignments.reduce((total, a) => total + (a.averageResponseTime || 0), 0) / assignments.length : 0
        };
        return summary;
    }
    // Private helper methods
    async validateExpertAndBudget(expertId, budget) {
        // Check if expert exists
        const expert = await index_1.db
            .select()
            .from(schema_1.expertPersonas)
            .where((0, drizzle_orm_1.eq)(schema_1.expertPersonas.id, expertId))
            .limit(1);
        if (expert.length === 0) {
            throw new ProxyAssignmentError('Expert not found', 'EXPERT_NOT_FOUND');
        }
        // Calculate current budget usage
        const budgetStatus = await this.calculateExpertBudgetStatus(expertId);
        // Check budget limits
        if (budgetStatus.currentMonthlyCost >= BUDGET_LIMITS.MAX_MONTHLY_COST) {
            throw new ProxyAssignmentError(`Monthly budget limit of $${BUDGET_LIMITS.MAX_MONTHLY_COST} exceeded`, 'BUDGET_EXCEEDED', budgetStatus);
        }
        // Check proxy count limit  
        const activeProxies = await index_1.db
            .select()
            .from(schema_1.proxyAssignments)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.proxyAssignments.personaId, expertId), (0, drizzle_orm_1.eq)(schema_1.proxyAssignments.assignmentStatus, 'active')));
        if (activeProxies.length >= BUDGET_LIMITS.MAX_PROXIES_PER_EXPERT) {
            throw new ProxyAssignmentError(`Maximum of ${BUDGET_LIMITS.MAX_PROXIES_PER_EXPERT} proxies per expert exceeded`, 'PROXY_LIMIT_EXCEEDED');
        }
    }
    async getExpertActiveProxy(expertId) {
        const assignments = await index_1.db
            .select()
            .from(schema_1.proxyAssignments)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.proxyAssignments.personaId, expertId), (0, drizzle_orm_1.eq)(schema_1.proxyAssignments.assignmentStatus, 'active')))
            .limit(1);
        return assignments.length > 0 ? assignments[0] : null;
    }
    async createProxyAssignment(expertId, status, request) {
        const assignmentData = {
            personaId: expertId,
            assignmentStatus: status,
            proxyLocation: `${request.preferredLocation.country}${request.preferredLocation.city ? `, ${request.preferredLocation.city}` : ''}`,
            assignmentReason: request.assignmentReason || 'Expert proxy assignment',
            lastStatusChange: new Date(),
            statusChangeReason: `Assignment ${status}`
        };
        const result = await index_1.db
            .insert(schema_1.proxyAssignments)
            .values(assignmentData)
            .returning({ id: schema_1.proxyAssignments.id });
        return result[0].id;
    }
    async requestProxyFromAPI(location) {
        // Use Philippines locations if not specified or ensure Philippines focus
        const targetLocation = location.country === 'PH' ?
            location :
            PHILIPPINES_LOCATIONS[Math.floor(Math.random() * PHILIPPINES_LOCATIONS.length)];
        return await this.proxyCheapClient.createProxy(targetLocation, {
            type: 'residential',
            duration: 30, // 30 days
            bandwidth: 10 // 10GB
        });
    }
    async testAndValidateProxy(proxyDetails) {
        // Test connection
        const testResult = await this.proxyCheapClient.testProxyConnection(proxyDetails.credentials);
        if (!testResult.success) {
            return testResult;
        }
        // Validate Philippines location
        const validation = await this.proxyCheapClient.validatePhilippinesLocation(proxyDetails.credentials);
        if (!validation.isValid) {
            return {
                success: false,
                responseTime: testResult.responseTime,
                ip: testResult.ip,
                location: testResult.location,
                error: validation.reason || 'Failed Philippines location validation',
                timestamp: testResult.timestamp
            };
        }
        return testResult;
    }
    async encryptAndStoreCredentials(proxyDetails, expertId, assignmentId) {
        const credentials = {
            host: proxyDetails.credentials.host,
            port: proxyDetails.credentials.port,
            username: proxyDetails.credentials.username,
            password: proxyDetails.credentials.password,
            protocol: proxyDetails.credentials.protocol,
            metadata: {
                providerId: proxyDetails.id,
                location: proxyDetails.location,
                expiresAt: proxyDetails.expiresAt
            }
        };
        return await this.encryptionService.encryptProxyCredentials(credentials, expertId);
    }
    async activateProxyAssignment(assignmentId, proxyDetails, encryptedCredentials) {
        await index_1.db
            .update(schema_1.proxyAssignments)
            .set({
            assignmentStatus: 'active',
            proxyCheapId: proxyDetails.id,
            proxyStatus: 'active',
            proxyCredentialsEncrypted: JSON.stringify(encryptedCredentials),
            encryptionKeyId: encryptedCredentials.keyId,
            isPhilippinesVerified: true,
            isResidentialVerified: true,
            monthlyCostUsd: proxyDetails.cost.monthly.toString(),
            dailyCostUsd: proxyDetails.cost.daily.toString(),
            costTrackingStartDate: new Date(),
            activatedAt: new Date(),
            lastStatusChange: new Date(),
            statusChangeReason: 'Proxy successfully activated'
        })
            .where((0, drizzle_orm_1.eq)(schema_1.proxyAssignments.id, assignmentId));
    }
    async updateAssignmentStatus(assignmentId, status, reason) {
        await index_1.db
            .update(schema_1.proxyAssignments)
            .set({
            assignmentStatus: status,
            lastStatusChange: new Date(),
            statusChangeReason: reason || `Status changed to ${status}`
        })
            .where((0, drizzle_orm_1.eq)(schema_1.proxyAssignments.id, assignmentId));
    }
    async calculateExpertBudgetStatus(expertId) {
        const activeAssignments = await index_1.db
            .select()
            .from(schema_1.proxyAssignments)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.proxyAssignments.personaId, expertId), (0, drizzle_orm_1.eq)(schema_1.proxyAssignments.assignmentStatus, 'active')));
        const currentMonthlyCost = activeAssignments.reduce((total, assignment) => {
            return total + parseFloat(assignment.monthlyCostUsd?.toString() || '0');
        }, 0);
        const percentUsed = (currentMonthlyCost / BUDGET_LIMITS.MAX_MONTHLY_COST) * 100;
        return {
            currentMonthlyCost,
            budgetLimit: BUDGET_LIMITS.MAX_MONTHLY_COST,
            percentUsed,
            canAssignMore: currentMonthlyCost < BUDGET_LIMITS.MAX_MONTHLY_COST
        };
    }
    async decryptProxyCredentials(assignment) {
        if (!assignment.proxyCredentialsEncrypted) {
            throw new Error('No encrypted credentials found');
        }
        const encryptedData = JSON.parse(assignment.proxyCredentialsEncrypted);
        return await this.encryptionService.decryptProxyCredentials(encryptedData);
    }
    async updateProxyHealthStatus(assignmentId, testResult) {
        await index_1.db
            .update(schema_1.proxyAssignments)
            .set({
            lastHealthCheck: new Date(),
            healthCheckStatus: testResult.success ? 'healthy' : 'failed',
            averageResponseTime: testResult.responseTime,
            consecutiveFailures: testResult.success ? 0 : undefined // Reset on success
        })
            .where((0, drizzle_orm_1.eq)(schema_1.proxyAssignments.id, assignmentId));
    }
}
exports.ProxyAssignmentService = ProxyAssignmentService;
// Singleton service instance
let proxyAssignmentServiceInstance = null;
/**
 * Get singleton proxy assignment service instance
 */
function getProxyAssignmentService() {
    if (!proxyAssignmentServiceInstance) {
        proxyAssignmentServiceInstance = new ProxyAssignmentService();
    }
    return proxyAssignmentServiceInstance;
}
/**
 * Utility function to assign proxy to expert
 */
async function assignProxyToExpert(request) {
    const service = getProxyAssignmentService();
    return service.assignProxyToExpert(request);
}
/**
 * Utility function to release proxy from expert
 */
async function releaseProxyFromExpert(expertId, reason) {
    const service = getProxyAssignmentService();
    return service.releaseProxyFromExpert(expertId, reason);
}
//# sourceMappingURL=proxy-assignment-service.js.map