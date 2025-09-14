export interface CostSummary {
    expertId: string;
    currentPeriod: {
        startDate: Date;
        endDate: Date;
        totalCost: number;
        dailyAverage: number;
        projectedMonthlyCost: number;
    };
    budgetStatus: {
        monthlyLimit: number;
        remainingBudget: number;
        percentUsed: number;
        daysRemaining: number;
        projectedOverage: number;
    };
    costBreakdown: {
        proxyCount: number;
        averageCostPerProxy: number;
        highestCostProxy: number;
        lowestCostProxy: number;
    };
    alerts: CostAlert[];
}
export interface CostAlert {
    id: string;
    type: 'warning' | 'critical' | 'overage' | 'projection';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    expertId: string;
    currentSpend: number;
    threshold: number;
    recommendedAction: string;
    timestamp: Date;
}
export interface ExpertCostHistory {
    expertId: string;
    dailyCosts: DailyCostEntry[];
    monthlyTotals: MonthlyCostEntry[];
    trends: {
        averageDailyCost: number;
        costTrend: 'increasing' | 'decreasing' | 'stable';
        projectedMonthlySpend: number;
        efficiencyScore: number;
    };
}
export interface DailyCostEntry {
    date: Date;
    totalCost: number;
    proxyCount: number;
    averageCostPerProxy: number;
}
export interface MonthlyCostEntry {
    month: string;
    totalCost: number;
    proxyCount: number;
    budgetUtilization: number;
}
export interface SystemCostOverview {
    totalExperts: number;
    totalMonthlyCost: number;
    budgetUtilization: number;
    expertsOverBudget: number;
    expertsBelowWarningThreshold: number;
    averageCostPerExpert: number;
    projectedSystemCost: number;
    costEfficiencyMetrics: {
        averageResponseTime: number;
        costPerSuccessfulConnection: number;
        totalConnections: number;
    };
}
export declare class CostManagementService {
    /**
     * Get comprehensive cost summary for expert
     */
    getExpertCostSummary(expertId: string): Promise<CostSummary>;
    /**
     * Get expert cost history and trends
     */
    getExpertCostHistory(expertId: string, months?: number): Promise<ExpertCostHistory>;
    /**
     * Get system-wide cost overview
     */
    getSystemCostOverview(): Promise<SystemCostOverview>;
    /**
     * Check if expert can afford new proxy assignment
     */
    canExpertAffordNewProxy(expertId: string, estimatedMonthlyCost: number): Promise<{
        canAfford: boolean;
        reason?: string;
        currentSpend: number;
        availableBudget: number;
        wouldExceedBy?: number;
    }>;
    /**
     * Generate monthly cost report for expert
     */
    generateMonthlyCostReport(expertId: string, month?: string): Promise<{
        reportPeriod: string;
        totalCost: number;
        budgetUtilization: number;
        dailyBreakdown: DailyCostEntry[];
        recommendations: string[];
        comparison: {
            previousMonth: number;
            changePercent: number;
            trend: 'increasing' | 'decreasing' | 'stable';
        };
    }>;
    private buildDailyCostEntries;
    private buildMonthlyCostEntries;
    private generateCostRecommendations;
    /**
     * Health check for cost management service
     */
    healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        details: Record<string, any>;
    }>;
}
/**
 * Get singleton cost management service instance
 */
export declare function getCostManagementService(): CostManagementService;
/**
 * Utility function to check expert budget before proxy assignment
 */
export declare function validateExpertBudget(expertId: string, estimatedCost: number): Promise<boolean>;
//# sourceMappingURL=cost-management-service.d.ts.map