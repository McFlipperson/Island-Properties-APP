"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyMonitoringService = void 0;
exports.getProxyMonitoringService = getProxyMonitoringService;
exports.startProxyMonitoring = startProxyMonitoring;
const index_1 = require("./db/index");
const schema_1 = require("../shared/schema");
const proxy_cheap_client_1 = require("./proxy-cheap-client");
const encryption_service_1 = require("./encryption-service");
const drizzle_orm_1 = require("drizzle-orm");
// Monitoring Configuration
const MONITORING_CONFIG = {
    HEALTH_CHECK_INTERVAL: 20 * 60 * 1000, // 20 minutes in milliseconds
    REPUTATION_CHECK_INTERVAL: 60 * 60 * 1000, // 1 hour
    GEO_VALIDATION_INTERVAL: 4 * 60 * 60 * 1000, // 4 hours
    MAX_CONSECUTIVE_FAILURES: 3,
    RESPONSE_TIME_THRESHOLD: 10000, // 10 seconds
    SUCCESS_RATE_THRESHOLD: 0.85, // 85%
    ALERT_COOLDOWN: 30 * 60 * 1000, // 30 minutes
};
// IP Reputation and Geolocation Services
class IPReputationService {
    /**
     * Check IP reputation using multiple sources
     */
    async checkIPReputation(ip) {
        try {
            // In a real implementation, integrate with services like:
            // - AbuseIPDB
            // - VirusTotal
            // - IPQualityScore
            // For now, simulate reputation check
            const isPrivateIP = this.isPrivateIP(ip);
            const simulatedScore = Math.random() * 100;
            return {
                score: simulatedScore,
                isResidential: simulatedScore > 70 && !isPrivateIP,
                blacklistStatus: simulatedScore > 80 ? 'clean' : simulatedScore > 50 ? 'unknown' : 'flagged',
                sources: ['simulated-reputation-service']
            };
        }
        catch (error) {
            console.error(`Failed to check IP reputation for ${ip}:`, error);
            return {
                score: 0,
                isResidential: false,
                blacklistStatus: 'unknown',
                sources: []
            };
        }
    }
    /**
     * Validate geographic location accuracy
     */
    async validateGeographicLocation(ip) {
        try {
            // In real implementation, use geolocation services like:
            // - MaxMind GeoIP2
            // - IP2Location
            // - IPGeolocation.io
            // Simulate geolocation check
            const philippinesLocations = [
                { country: 'PH', city: 'Manila', region: 'Metro Manila' },
                { country: 'PH', city: 'Cebu', region: 'Central Visayas' },
                { country: 'PH', city: 'Davao', region: 'Davao Region' }
            ];
            const randomLocation = philippinesLocations[Math.floor(Math.random() * philippinesLocations.length)];
            const isActuallyPhilippines = Math.random() > 0.1; // 90% chance it's actually Philippines
            if (isActuallyPhilippines) {
                return {
                    isPhilippines: true,
                    detectedCountry: 'PH',
                    detectedCity: randomLocation.city,
                    detectedRegion: randomLocation.region,
                    confidence: 0.95
                };
            }
            else {
                return {
                    isPhilippines: false,
                    detectedCountry: 'US',
                    detectedCity: 'New York',
                    detectedRegion: 'New York',
                    confidence: 0.87
                };
            }
        }
        catch (error) {
            console.error(`Failed to validate geolocation for ${ip}:`, error);
            return {
                isPhilippines: false,
                detectedCountry: 'unknown',
                detectedCity: 'unknown',
                detectedRegion: 'unknown',
                confidence: 0
            };
        }
    }
    isPrivateIP(ip) {
        const privateRanges = [
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
            /^192\.168\./,
            /^127\./,
            /^169\.254\./
        ];
        return privateRanges.some(range => range.test(ip));
    }
}
// Alert Management System
class AlertManager {
    constructor() {
        this.alerts = new Map();
        this.lastAlertTime = new Map();
    }
    /**
     * Create new alert with cooldown protection
     */
    createAlert(type, severity, message, proxyId, expertId) {
        const alertKey = `${proxyId}_${type}`;
        const now = Date.now();
        const lastAlert = this.lastAlertTime.get(alertKey) || 0;
        // Check cooldown period
        if (now - lastAlert < MONITORING_CONFIG.ALERT_COOLDOWN) {
            return null; // Skip alert due to cooldown
        }
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            severity,
            message,
            proxyId,
            expertId,
            timestamp: new Date(),
            resolved: false
        };
        this.alerts.set(alert.id, alert);
        this.lastAlertTime.set(alertKey, now);
        console.log(`🚨 Alert created: ${severity.toUpperCase()} - ${message} (Proxy: ${proxyId})`);
        return alert;
    }
    /**
     * Resolve alert by ID
     */
    resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert && !alert.resolved) {
            alert.resolved = true;
            alert.resolvedAt = new Date();
            console.log(`✅ Alert resolved: ${alert.message} (${alertId})`);
            return true;
        }
        return false;
    }
    /**
     * Get active alerts for proxy
     */
    getActiveAlertsForProxy(proxyId) {
        return Array.from(this.alerts.values())
            .filter(alert => alert.proxyId === proxyId && !alert.resolved);
    }
    /**
     * Get all active alerts
     */
    getAllActiveAlerts() {
        return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
    }
    /**
     * Clean up old resolved alerts
     */
    cleanupOldAlerts(maxAge = 24 * 60 * 60 * 1000) {
        const cutoff = Date.now() - maxAge;
        let cleanedCount = 0;
        for (const [id, alert] of this.alerts.entries()) {
            if (alert.resolved && alert.timestamp.getTime() < cutoff) {
                this.alerts.delete(id);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} old alerts`);
        }
    }
}
// Main Proxy Monitoring Service
class ProxyMonitoringService {
    constructor() {
        this.proxyCheapClient = (0, proxy_cheap_client_1.createProxyCheapClient)();
        this.encryptionService = (0, encryption_service_1.getEncryptionService)();
        this.ipReputationService = new IPReputationService();
        this.alertManager = new AlertManager();
        this.isMonitoring = false;
        this.monitoringInterval = null;
    }
    /**
     * Start continuous monitoring of all proxy assignments
     */
    startMonitoring() {
        if (this.isMonitoring) {
            console.log('🔍 Proxy monitoring is already running');
            return;
        }
        this.isMonitoring = true;
        console.log('🚀 Starting proxy monitoring service...');
        // Run initial monitoring
        this.runMonitoringCycle();
        // Schedule regular monitoring cycles
        this.monitoringInterval = setInterval(() => {
            this.runMonitoringCycle();
        }, MONITORING_CONFIG.HEALTH_CHECK_INTERVAL);
    }
    /**
     * Stop monitoring service
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        console.log('⏹️ Proxy monitoring service stopped');
    }
    /**
     * Run a complete monitoring cycle for all active proxies
     */
    async runMonitoringCycle() {
        try {
            console.log('🔍 Starting proxy monitoring cycle...');
            // Get all active proxy assignments
            const activeProxies = await index_1.db
                .select()
                .from(schema_1.proxyAssignments)
                .where((0, drizzle_orm_1.eq)(schema_1.proxyAssignments.assignmentStatus, 'active'));
            if (activeProxies.length === 0) {
                console.log('📭 No active proxies to monitor');
                return;
            }
            console.log(`🔍 Monitoring ${activeProxies.length} active proxies...`);
            // Monitor each proxy
            const monitoringPromises = activeProxies.map(proxy => this.monitorSingleProxy(proxy));
            await Promise.allSettled(monitoringPromises);
            // Clean up old alerts
            this.alertManager.cleanupOldAlerts();
            console.log('✅ Proxy monitoring cycle completed');
        }
        catch (error) {
            console.error('❌ Error during monitoring cycle:', error);
        }
    }
    /**
     * Monitor a single proxy assignment
     */
    async monitorSingleProxy(assignment) {
        const proxyId = assignment.id;
        const expertId = assignment.personaId;
        try {
            // Decrypt proxy credentials
            const credentials = await this.decryptProxyCredentials(assignment);
            // Perform health check
            const healthResult = await this.performHealthCheck(credentials);
            // Check IP reputation (less frequently)
            let reputationResult = null;
            const lastReputationCheck = assignment.lastReputationCheck;
            const needsReputationCheck = !lastReputationCheck ||
                (Date.now() - lastReputationCheck.getTime()) > MONITORING_CONFIG.REPUTATION_CHECK_INTERVAL;
            if (needsReputationCheck) {
                reputationResult = await this.ipReputationService.checkIPReputation(healthResult.ip);
            }
            // Validate geographic location (less frequently)
            let geoResult = null;
            const lastGeoCheck = assignment.geoValidationLastCheck;
            const needsGeoCheck = !lastGeoCheck ||
                (Date.now() - lastGeoCheck.getTime()) > MONITORING_CONFIG.GEO_VALIDATION_INTERVAL;
            if (needsGeoCheck) {
                geoResult = await this.ipReputationService.validateGeographicLocation(healthResult.ip);
            }
            // Update database with monitoring results
            await this.updateMonitoringResults(assignment, healthResult, reputationResult, geoResult);
            // Generate alerts if needed
            await this.checkAndGenerateAlerts(assignment, healthResult, reputationResult, geoResult);
            // Return health metrics
            return this.buildHealthMetrics(assignment, healthResult, reputationResult, geoResult);
        }
        catch (error) {
            console.error(`❌ Failed to monitor proxy ${proxyId}:`, error);
            // Create critical alert for monitoring failure
            this.alertManager.createAlert('health', 'critical', `Monitoring failed: ${error.message}`, proxyId, expertId);
            // Return failed status
            return {
                proxyId,
                expertId,
                status: 'failed',
                lastCheck: new Date(),
                responseTime: 0,
                successRate: 0,
                consecutiveFailures: (assignment.consecutiveFailures || 0) + 1,
                location: {
                    country: assignment.detectedCountry || 'unknown',
                    city: assignment.detectedCity || 'unknown',
                    isPhilippinesVerified: false
                },
                reputation: {
                    score: 0,
                    isResidential: false,
                    blacklistStatus: 'unknown'
                },
                alerts: this.alertManager.getActiveAlertsForProxy(proxyId)
            };
        }
    }
    /**
     * Get monitoring summary for all proxies
     */
    async getMonitoringSummary() {
        const assignments = await index_1.db.select().from(schema_1.proxyAssignments);
        const activeProxies = assignments.filter(a => a.assignmentStatus === 'active');
        const healthyProxies = activeProxies.filter(a => a.healthCheckStatus === 'healthy');
        const degradedProxies = activeProxies.filter(a => a.healthCheckStatus === 'degraded');
        const failedProxies = activeProxies.filter(a => a.healthCheckStatus === 'failed');
        const averageResponseTime = activeProxies.length > 0 ?
            activeProxies.reduce((sum, a) => sum + (a.averageResponseTime || 0), 0) / activeProxies.length : 0;
        const activeAlerts = this.alertManager.getAllActiveAlerts().length;
        let systemHealth = 'healthy';
        if (failedProxies.length > activeProxies.length * 0.5) {
            systemHealth = 'critical';
        }
        else if (degradedProxies.length + failedProxies.length > activeProxies.length * 0.3) {
            systemHealth = 'degraded';
        }
        return {
            totalProxies: assignments.length,
            healthyProxies: healthyProxies.length,
            degradedProxies: degradedProxies.length,
            failedProxies: failedProxies.length,
            activeAlerts,
            averageResponseTime,
            systemHealth,
            lastMonitoringRun: new Date()
        };
    }
    /**
     * Get detailed health metrics for specific proxy
     */
    async getProxyHealthMetrics(proxyId) {
        const assignment = await index_1.db
            .select()
            .from(schema_1.proxyAssignments)
            .where((0, drizzle_orm_1.eq)(schema_1.proxyAssignments.id, proxyId))
            .limit(1);
        if (assignment.length === 0) {
            return null;
        }
        return this.monitorSingleProxy(assignment[0]);
    }
    // Private helper methods
    async performHealthCheck(credentials) {
        try {
            const testResult = await this.proxyCheapClient.testProxyConnection({
                host: credentials.host,
                port: credentials.port,
                username: credentials.username,
                password: credentials.password,
                protocol: credentials.protocol
            });
            return {
                success: testResult.success,
                responseTime: testResult.responseTime,
                ip: testResult.ip,
                error: testResult.error
            };
        }
        catch (error) {
            return {
                success: false,
                responseTime: 0,
                ip: '',
                error: error.message
            };
        }
    }
    async decryptProxyCredentials(assignment) {
        if (!assignment.proxyCredentialsEncrypted) {
            throw new Error('No encrypted credentials found');
        }
        const encryptedData = JSON.parse(assignment.proxyCredentialsEncrypted);
        return await this.encryptionService.decryptProxyCredentials(encryptedData);
    }
    async updateMonitoringResults(assignment, healthResult, reputationResult, geoResult) {
        const updateData = {
            lastHealthCheck: new Date(),
            healthCheckStatus: healthResult.success ? 'healthy' : 'failed',
            averageResponseTime: healthResult.responseTime,
            consecutiveFailures: healthResult.success ? 0 : (assignment.consecutiveFailures || 0) + 1,
        };
        // Update reputation data if checked
        if (reputationResult) {
            updateData.ipReputationScore = reputationResult.score.toString();
            updateData.isResidentialVerified = reputationResult.isResidential;
            updateData.blacklistCheckStatus = reputationResult.blacklistStatus;
            updateData.lastReputationCheck = new Date();
        }
        // Update geolocation data if checked
        if (geoResult) {
            updateData.detectedCountry = geoResult.detectedCountry;
            updateData.detectedCity = geoResult.detectedCity;
            updateData.detectedRegion = geoResult.detectedRegion;
            updateData.isPhilippinesVerified = geoResult.isPhilippines;
            updateData.geoValidationLastCheck = new Date();
        }
        await index_1.db
            .update(schema_1.proxyAssignments)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.proxyAssignments.id, assignment.id));
    }
    async checkAndGenerateAlerts(assignment, healthResult, reputationResult, geoResult) {
        const proxyId = assignment.id;
        const expertId = assignment.personaId;
        // Health alerts
        if (!healthResult.success) {
            const consecutiveFailures = (assignment.consecutiveFailures || 0) + 1;
            if (consecutiveFailures >= MONITORING_CONFIG.MAX_CONSECUTIVE_FAILURES) {
                this.alertManager.createAlert('health', 'critical', `Proxy has failed ${consecutiveFailures} consecutive health checks`, proxyId, expertId);
            }
        }
        // Performance alerts
        if (healthResult.responseTime > MONITORING_CONFIG.RESPONSE_TIME_THRESHOLD) {
            this.alertManager.createAlert('performance', 'medium', `High response time: ${healthResult.responseTime}ms`, proxyId, expertId);
        }
        // Location alerts
        if (geoResult && !geoResult.isPhilippines) {
            this.alertManager.createAlert('location', 'high', `Proxy not located in Philippines: ${geoResult.detectedCountry}`, proxyId, expertId);
        }
        // Reputation alerts
        if (reputationResult) {
            if (reputationResult.blacklistStatus === 'flagged') {
                this.alertManager.createAlert('reputation', 'high', 'Proxy IP flagged in reputation databases', proxyId, expertId);
            }
            if (!reputationResult.isResidential) {
                this.alertManager.createAlert('reputation', 'medium', 'Proxy IP detected as non-residential', proxyId, expertId);
            }
        }
    }
    buildHealthMetrics(assignment, healthResult, reputationResult, geoResult) {
        let status = 'unknown';
        if (healthResult.success) {
            if (healthResult.responseTime < MONITORING_CONFIG.RESPONSE_TIME_THRESHOLD) {
                status = 'healthy';
            }
            else {
                status = 'degraded';
            }
        }
        else {
            status = 'failed';
        }
        return {
            proxyId: assignment.id,
            expertId: assignment.personaId,
            status,
            lastCheck: new Date(),
            responseTime: healthResult.responseTime,
            successRate: assignment.connectionSuccessRate || 0,
            consecutiveFailures: assignment.consecutiveFailures || 0,
            location: {
                country: assignment.detectedCountry || 'unknown',
                city: assignment.detectedCity || 'unknown',
                isPhilippinesVerified: assignment.isPhilippinesVerified || false
            },
            reputation: {
                score: reputationResult?.score || parseFloat(assignment.ipReputationScore || '0'),
                isResidential: reputationResult?.isResidential || assignment.isResidentialVerified || false,
                blacklistStatus: reputationResult?.blacklistStatus || assignment.blacklistCheckStatus || 'unknown'
            },
            alerts: this.alertManager.getActiveAlertsForProxy(assignment.id)
        };
    }
    /**
     * Health check for monitoring service itself
     */
    async healthCheck() {
        try {
            const summary = await this.getMonitoringSummary();
            return {
                status: summary.systemHealth === 'critical' ? 'unhealthy' :
                    summary.systemHealth === 'degraded' ? 'degraded' : 'healthy',
                details: {
                    isMonitoring: this.isMonitoring,
                    totalProxies: summary.totalProxies,
                    activeAlerts: summary.activeAlerts,
                    systemHealth: summary.systemHealth,
                    lastRun: summary.lastMonitoringRun,
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    error: error.message,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }
}
exports.ProxyMonitoringService = ProxyMonitoringService;
// Singleton service instance
let monitoringServiceInstance = null;
/**
 * Get singleton monitoring service instance
 */
function getProxyMonitoringService() {
    if (!monitoringServiceInstance) {
        monitoringServiceInstance = new ProxyMonitoringService();
    }
    return monitoringServiceInstance;
}
/**
 * Auto-start monitoring service
 */
function startProxyMonitoring() {
    const service = getProxyMonitoringService();
    service.startMonitoring();
}
//# sourceMappingURL=proxy-monitoring-service.js.map