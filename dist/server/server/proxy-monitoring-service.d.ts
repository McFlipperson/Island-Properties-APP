export interface ProxyHealthMetrics {
    proxyId: string;
    expertId: string;
    status: 'healthy' | 'degraded' | 'failed' | 'unknown';
    lastCheck: Date;
    responseTime: number;
    successRate: number;
    consecutiveFailures: number;
    location: {
        country: string;
        city: string;
        isPhilippinesVerified: boolean;
    };
    reputation: {
        score: number;
        isResidential: boolean;
        blacklistStatus: string;
    };
    alerts: ProxyAlert[];
}
export interface ProxyAlert {
    id: string;
    type: 'health' | 'location' | 'reputation' | 'cost' | 'performance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    proxyId: string;
    expertId: string;
    timestamp: Date;
    resolved: boolean;
    resolvedAt?: Date;
}
export interface MonitoringSummary {
    totalProxies: number;
    healthyProxies: number;
    degradedProxies: number;
    failedProxies: number;
    activeAlerts: number;
    averageResponseTime: number;
    systemHealth: 'healthy' | 'degraded' | 'critical';
    lastMonitoringRun: Date;
}
export declare class ProxyMonitoringService {
    private proxyCheapClient;
    private encryptionService;
    private ipReputationService;
    private alertManager;
    private isMonitoring;
    private monitoringInterval;
    /**
     * Start continuous monitoring of all proxy assignments
     */
    startMonitoring(): void;
    /**
     * Stop monitoring service
     */
    stopMonitoring(): void;
    /**
     * Run a complete monitoring cycle for all active proxies
     */
    runMonitoringCycle(): Promise<void>;
    /**
     * Monitor a single proxy assignment
     */
    monitorSingleProxy(assignment: any): Promise<ProxyHealthMetrics>;
    /**
     * Get monitoring summary for all proxies
     */
    getMonitoringSummary(): Promise<MonitoringSummary>;
    /**
     * Get detailed health metrics for specific proxy
     */
    getProxyHealthMetrics(proxyId: string): Promise<ProxyHealthMetrics | null>;
    private performHealthCheck;
    private decryptProxyCredentials;
    private updateMonitoringResults;
    private checkAndGenerateAlerts;
    private buildHealthMetrics;
    /**
     * Health check for monitoring service itself
     */
    healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        details: Record<string, any>;
    }>;
}
/**
 * Get singleton monitoring service instance
 */
export declare function getProxyMonitoringService(): ProxyMonitoringService;
/**
 * Auto-start monitoring service
 */
export declare function startProxyMonitoring(): void;
//# sourceMappingURL=proxy-monitoring-service.d.ts.map