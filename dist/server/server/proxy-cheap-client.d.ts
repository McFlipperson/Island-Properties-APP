export interface ProxyCheapConfig {
    apiKey: string;
    baseUrl: string;
    timeout?: number;
    retryAttempts?: number;
    rateLimitDelay?: number;
}
export interface ProxyLocation {
    country: string;
    city?: string;
    region?: string;
    provider?: string;
}
export interface ProxyCredentials {
    host: string;
    port: number;
    username: string;
    password: string;
    protocol: 'http' | 'https' | 'socks5';
}
export interface ProxyDetails {
    id: string;
    status: 'active' | 'inactive' | 'suspended' | 'expired';
    credentials: ProxyCredentials;
    location: ProxyLocation;
    createdAt: string;
    expiresAt: string;
    trafficUsage: {
        used: number;
        limit: number;
        unit: 'MB' | 'GB';
    };
    cost: {
        daily: number;
        monthly: number;
        currency: 'USD';
    };
}
export interface ProxyUsageStats {
    proxyId: string;
    period: 'daily' | 'weekly' | 'monthly';
    requests: number;
    bandwidth: number;
    uptime: number;
    averageResponseTime: number;
    successRate: number;
}
export interface GeoLocation {
    ip: string;
    country: string;
    countryCode: string;
    city: string;
    region: string;
    latitude: number;
    longitude: number;
    timezone: string;
    isp: string;
    type: 'residential' | 'datacenter' | 'mobile';
}
export interface ProxyTestResult {
    success: boolean;
    responseTime: number;
    ip: string;
    location: GeoLocation;
    error?: string;
    timestamp: string;
}
export declare class ProxyCheapAPIError extends Error {
    statusCode?: number | undefined;
    response?: any | undefined;
    constructor(message: string, statusCode?: number | undefined, response?: any | undefined);
}
export declare class ProxyCheapConnectionError extends Error {
    originalError?: Error | undefined;
    constructor(message: string, originalError?: Error | undefined);
}
export declare class ProxyCheapClient {
    private config;
    private rateLimiter;
    constructor(config: ProxyCheapConfig);
    private makeRequest;
    /**
     * Create a new proxy with Philippines location preference
     */
    createProxy(location: ProxyLocation, options?: {
        duration?: number;
        bandwidth?: number;
        type?: 'residential' | 'datacenter';
    }): Promise<ProxyDetails>;
    /**
     * Delete/release a proxy
     */
    deleteProxy(proxyId: string): Promise<boolean>;
    /**
     * Get proxy status and details
     */
    getProxyStatus(proxyId: string): Promise<ProxyDetails>;
    /**
     * Test proxy connection and get geolocation
     */
    testProxyConnection(credentials: ProxyCredentials): Promise<ProxyTestResult>;
    /**
     * Get proxy usage statistics
     */
    getProxyUsageStats(proxyId: string, period?: 'daily' | 'weekly' | 'monthly'): Promise<ProxyUsageStats>;
    /**
     * Get IP geolocation information
     */
    getIpGeolocation(ip: string): Promise<GeoLocation>;
    /**
     * Validate Philippines location for proxy
     */
    validatePhilippinesLocation(credentials: ProxyCredentials): Promise<{
        isValid: boolean;
        location: GeoLocation | null;
        reason?: string;
    }>;
    /**
     * Get account usage and billing information
     */
    getAccountUsage(): Promise<{
        currentUsage: number;
        monthlyLimit: number;
        billingPeriod: string;
        activeProxies: number;
        totalCost: number;
    }>;
    private formatProxyDetails;
    /**
     * Health check for the Proxy-Cheap API
     */
    healthCheck(): Promise<boolean>;
}
export declare function createProxyCheapClient(): ProxyCheapClient;
//# sourceMappingURL=proxy-cheap-client.d.ts.map