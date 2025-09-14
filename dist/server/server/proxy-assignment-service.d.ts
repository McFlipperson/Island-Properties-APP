import { ProxyDetails } from './proxy-cheap-client';
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
export type AssignmentStatus = 'unassigned' | 'requesting' | 'testing' | 'active' | 'failed' | 'maintenance';
export declare class ProxyAssignmentError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
export declare class ProxyAssignmentService {
    private proxyCheapClient;
    private encryptionService;
    constructor();
    /**
     * Complete proxy assignment workflow for expert
     */
    assignProxyToExpert(request: ProxyAssignmentRequest): Promise<ProxyAssignmentResult>;
    /**
     * Release proxy assignment for expert
     */
    releaseProxyFromExpert(expertId: string, reason?: string): Promise<boolean>;
    /**
     * Get expert proxy status and budget information
     */
    getExpertProxyStatus(expertId: string): Promise<ExpertProxyStatus>;
    /**
     * Perform health check on assigned proxy
     */
    performProxyHealthCheck(expertId: string): Promise<{
        success: boolean;
        healthStatus: string;
        responseTime?: number;
        location?: any;
        error?: string;
    }>;
    /**
     * Get all proxy assignments with status summary
     */
    getProxyAssignmentsSummary(): Promise<{
        totalAssignments: number;
        activeProxies: number;
        failedProxies: number;
        totalMonthlyCost: number;
        averageResponseTime: number;
    }>;
    private validateExpertAndBudget;
    private getExpertActiveProxy;
    private createProxyAssignment;
    private requestProxyFromAPI;
    private testAndValidateProxy;
    private encryptAndStoreCredentials;
    private activateProxyAssignment;
    private updateAssignmentStatus;
    private calculateExpertBudgetStatus;
    private decryptProxyCredentials;
    private updateProxyHealthStatus;
}
/**
 * Get singleton proxy assignment service instance
 */
export declare function getProxyAssignmentService(): ProxyAssignmentService;
/**
 * Utility function to assign proxy to expert
 */
export declare function assignProxyToExpert(request: ProxyAssignmentRequest): Promise<ProxyAssignmentResult>;
/**
 * Utility function to release proxy from expert
 */
export declare function releaseProxyFromExpert(expertId: string, reason?: string): Promise<boolean>;
//# sourceMappingURL=proxy-assignment-service.d.ts.map