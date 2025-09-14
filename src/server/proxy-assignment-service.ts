import { db } from './db/index';
import { proxyAssignments, expertPersonas } from '../shared/schema';
import { ProxyCheapClient, createProxyCheapClient, ProxyDetails, ProxyTestResult } from './proxy-cheap-client';
import { getEncryptionService, EncryptedData, DecryptedCredentials } from './encryption-service';
import { eq, and, desc } from 'drizzle-orm';
import { count, sum } from 'drizzle-orm/sql';

// Types for proxy assignment workflow
export interface ProxyAssignmentRequest {
  expertId: string;
  preferredLocation: {
    country: string;
    city?: string;
    region?: string;
  };
  budget?: {
    maxMonthlyCost: number;
    maxDailyCost: number;
  };
  assignmentReason?: string;
}

export interface ProxyAssignmentResult {
  success: boolean;
  assignmentId?: string;
  proxyDetails?: ProxyDetails;
  error?: string;
  warnings?: string[];
  costProjection?: {
    dailyCost: number;
    monthlyCost: number;
  };
}

export interface ExpertProxyStatus {
  expertId: string;
  hasActiveProxy: boolean;
  proxyDetails?: {
    id: string;
    status: string;
    location: string;
    healthStatus: string;
    costToDate: number;
    assignedAt: string;
  };
  budgetStatus: {
    currentMonthlyCost: number;
    budgetLimit: number;
    percentUsed: number;
    canAssignMore: boolean;
  };
}

// Assignment workflow status types
export type AssignmentStatus = 
  | 'unassigned' 
  | 'requesting' 
  | 'testing' 
  | 'active' 
  | 'failed' 
  | 'maintenance';

// Custom errors
export class ProxyAssignmentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ProxyAssignmentError';
  }
}

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
export class ProxyAssignmentService {
  private proxyCheapClient: ProxyCheapClient;
  private encryptionService: ReturnType<typeof getEncryptionService>;

  constructor() {
    this.proxyCheapClient = createProxyCheapClient();
    this.encryptionService = getEncryptionService();
  }

  /**
   * Complete proxy assignment workflow for expert
   */
  async assignProxyToExpert(request: ProxyAssignmentRequest): Promise<ProxyAssignmentResult> {
    const { expertId } = request;
    console.log(`🔄 Starting proxy assignment for expert: ${expertId}`);

    try {
      // Step 1: Validate expert exists and budget constraints
      await this.validateExpertAndBudget(expertId, request.budget);

      // Step 2: Check if expert already has active proxy
      const existingProxy = await this.getExpertActiveProxy(expertId);
      if (existingProxy) {
        throw new ProxyAssignmentError(
          'Expert already has an active proxy assigned',
          'PROXY_ALREADY_EXISTS',
          { existingProxyId: existingProxy.id }
        );
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
        throw new ProxyAssignmentError(
          'Proxy failed connection or location validation',
          'PROXY_VALIDATION_FAILED',
          testResult
        );
      }

      // Step 7: Encrypt and store proxy credentials
      const encryptedCredentials = await this.encryptAndStoreCredentials(
        proxyDetails, 
        expertId,
        assignmentId
      );

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

    } catch (error) {
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
        error: `Assignment failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Release proxy assignment for expert
   */
  async releaseProxyFromExpert(expertId: string, reason?: string): Promise<boolean> {
    console.log(`🔄 Releasing proxy for expert: ${expertId}`);

    try {
      // Get current proxy assignment
      const assignment = await db
        .select()
        .from(proxyAssignments)
        .where(eq(proxyAssignments.personaId, expertId))
        .limit(1);

      if (assignment.length === 0) {
        throw new ProxyAssignmentError(
          'No active proxy assignment found for expert',
          'NO_PROXY_ASSIGNED'
        );
      }

      const proxyData = assignment[0];
      
      // Delete proxy from Proxy-Cheap API if we have the external ID
      if (proxyData.proxyCheapId) {
        try {
          await this.proxyCheapClient.deleteProxy(proxyData.proxyCheapId);
        } catch (error) {
          console.warn(`⚠️ Failed to delete proxy from Proxy-Cheap API: ${(error as Error).message}`);
        }
      }

      // Remove assignment from database
      await db
        .delete(proxyAssignments)
        .where(eq(proxyAssignments.personaId, expertId));

      console.log(`✅ Proxy released for expert: ${expertId}`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to release proxy for expert ${expertId}:`, error);
      return false;
    }
  }

  /**
   * Get expert proxy status and budget information
   */
  async getExpertProxyStatus(expertId: string): Promise<ExpertProxyStatus> {
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
  async performProxyHealthCheck(expertId: string): Promise<{
    success: boolean;
    healthStatus: string;
    responseTime?: number;
    location?: any;
    error?: string;
  }> {
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
        protocol: credentials.protocol as 'http' | 'https' | 'socks5'
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

    } catch (error) {
      return {
        success: false,
        healthStatus: 'error',
        error: (error as Error).message
      };
    }
  }

  /**
   * Get all proxy assignments with status summary
   */
  async getProxyAssignmentsSummary(): Promise<{
    totalAssignments: number;
    activeProxies: number;
    failedProxies: number;
    totalMonthlyCost: number;
    averageResponseTime: number;
  }> {
    const assignments = await db.select().from(proxyAssignments);
    
    const summary = {
      totalAssignments: assignments.length,
      activeProxies: assignments.filter((a: any) => a.assignmentStatus === 'active').length,
      failedProxies: assignments.filter((a: any) => a.assignmentStatus === 'failed').length,
      totalMonthlyCost: assignments.reduce((total: number, a: any) => 
        total + parseFloat(a.monthlyCostUsd?.toString() || '0'), 0
      ),
      averageResponseTime: assignments.length > 0 ? 
        assignments.reduce((total: number, a: any) => total + (a.averageResponseTime || 0), 0) / assignments.length : 0
    };

    return summary;
  }

  // Private helper methods

  private async validateExpertAndBudget(
    expertId: string, 
    budget?: { maxMonthlyCost: number; maxDailyCost: number }
  ): Promise<void> {
    // Check if expert exists
    const expert = await db
      .select()
      .from(expertPersonas)
      .where(eq(expertPersonas.id, expertId))
      .limit(1);

    if (expert.length === 0) {
      throw new ProxyAssignmentError(
        'Expert not found',
        'EXPERT_NOT_FOUND'
      );
    }

    // Calculate current budget usage
    const budgetStatus = await this.calculateExpertBudgetStatus(expertId);
    
    // Check budget limits
    if (budgetStatus.currentMonthlyCost >= BUDGET_LIMITS.MAX_MONTHLY_COST) {
      throw new ProxyAssignmentError(
        `Monthly budget limit of $${BUDGET_LIMITS.MAX_MONTHLY_COST} exceeded`,
        'BUDGET_EXCEEDED',
        budgetStatus
      );
    }

    // Check proxy count limit
    const currentProxyCount = await db
      .select({ count: count() })
      .from(proxyAssignments)
      .where(and(
        eq(proxyAssignments.personaId, expertId),
        eq(proxyAssignments.assignmentStatus, 'active')
      ));

    if (currentProxyCount[0].count >= BUDGET_LIMITS.MAX_PROXIES_PER_EXPERT) {
      throw new ProxyAssignmentError(
        `Maximum of ${BUDGET_LIMITS.MAX_PROXIES_PER_EXPERT} proxies per expert exceeded`,
        'PROXY_LIMIT_EXCEEDED'
      );
    }
  }

  private async getExpertActiveProxy(expertId: string) {
    const assignments = await db
      .select()
      .from(proxyAssignments)
      .where(and(
        eq(proxyAssignments.personaId, expertId),
        eq(proxyAssignments.assignmentStatus, 'active')
      ))
      .limit(1);

    return assignments.length > 0 ? assignments[0] : null;
  }

  private async createProxyAssignment(
    expertId: string, 
    status: AssignmentStatus,
    request: ProxyAssignmentRequest
  ): Promise<string> {
    const assignmentData = {
      personaId: expertId,
      assignmentStatus: status,
      proxyLocation: `${request.preferredLocation.country}${
        request.preferredLocation.city ? `, ${request.preferredLocation.city}` : ''
      }`,
      assignmentReason: request.assignmentReason || 'Expert proxy assignment',
      lastStatusChange: new Date(),
      statusChangeReason: `Assignment ${status}`
    };

    const result = await db
      .insert(proxyAssignments)
      .values(assignmentData)
      .returning({ id: proxyAssignments.id });

    return result[0].id;
  }

  private async requestProxyFromAPI(location: { country: string; city?: string; region?: string }): Promise<ProxyDetails> {
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

  private async testAndValidateProxy(proxyDetails: ProxyDetails): Promise<ProxyTestResult> {
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

  private async encryptAndStoreCredentials(
    proxyDetails: ProxyDetails,
    expertId: string,
    assignmentId: string
  ): Promise<EncryptedData> {
    const credentials: DecryptedCredentials = {
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

  private async activateProxyAssignment(
    assignmentId: string,
    proxyDetails: ProxyDetails,
    encryptedCredentials: EncryptedData
  ): Promise<void> {
    await db
      .update(proxyAssignments)
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
      .where(eq(proxyAssignments.id, assignmentId));
  }

  private async updateAssignmentStatus(
    assignmentId: string,
    status: AssignmentStatus,
    reason?: string
  ): Promise<void> {
    await db
      .update(proxyAssignments)
      .set({
        assignmentStatus: status,
        lastStatusChange: new Date(),
        statusChangeReason: reason || `Status changed to ${status}`
      })
      .where(eq(proxyAssignments.id, assignmentId));
  }

  private async calculateExpertBudgetStatus(expertId: string): Promise<{
    currentMonthlyCost: number;
    budgetLimit: number;
    percentUsed: number;
    canAssignMore: boolean;
  }> {
    const result = await db
      .select({
        total: sum(proxyAssignments.monthlyCostUsd)
      })
      .from(proxyAssignments)
      .where(and(
        eq(proxyAssignments.personaId, expertId),
        eq(proxyAssignments.assignmentStatus, 'active')
      ));

    const currentMonthlyCost = parseFloat(result[0].total?.toString() || '0');
    const percentUsed = (currentMonthlyCost / BUDGET_LIMITS.MAX_MONTHLY_COST) * 100;

    return {
      currentMonthlyCost,
      budgetLimit: BUDGET_LIMITS.MAX_MONTHLY_COST,
      percentUsed,
      canAssignMore: currentMonthlyCost < BUDGET_LIMITS.MAX_MONTHLY_COST
    };
  }

  private async decryptProxyCredentials(assignment: any): Promise<DecryptedCredentials> {
    if (!assignment.proxyCredentialsEncrypted) {
      throw new Error('No encrypted credentials found');
    }

    const encryptedData = JSON.parse(assignment.proxyCredentialsEncrypted) as EncryptedData;
    return await this.encryptionService.decryptProxyCredentials(encryptedData);
  }

  private async updateProxyHealthStatus(
    assignmentId: string,
    testResult: ProxyTestResult
  ): Promise<void> {
    await db
      .update(proxyAssignments)
      .set({
        lastHealthCheck: new Date(),
        healthCheckStatus: testResult.success ? 'healthy' : 'failed',
        averageResponseTime: testResult.responseTime,
        consecutiveFailures: testResult.success ? 0 : undefined // Reset on success
      })
      .where(eq(proxyAssignments.id, assignmentId));
  }
}

// Singleton service instance
let proxyAssignmentServiceInstance: ProxyAssignmentService | null = null;

/**
 * Get singleton proxy assignment service instance
 */
export function getProxyAssignmentService(): ProxyAssignmentService {
  if (!proxyAssignmentServiceInstance) {
    proxyAssignmentServiceInstance = new ProxyAssignmentService();
  }
  return proxyAssignmentServiceInstance;
}

/**
 * Utility function to assign proxy to expert
 */
export async function assignProxyToExpert(request: ProxyAssignmentRequest): Promise<ProxyAssignmentResult> {
  const service = getProxyAssignmentService();
  return service.assignProxyToExpert(request);
}

/**
 * Utility function to release proxy from expert
 */
export async function releaseProxyFromExpert(expertId: string, reason?: string): Promise<boolean> {
  const service = getProxyAssignmentService();
  return service.releaseProxyFromExpert(expertId, reason);
}