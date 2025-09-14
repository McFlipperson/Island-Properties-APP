import crypto from 'crypto';
// Simple logger implementation
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args)
};

// Proxy-Cheap API Types
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

// Rate Limiting Helper
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      if (waitTime > 0) {
        logger.info(`Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.requests.push(now);
  }
}

// Custom Error Classes
export class ProxyCheapAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ProxyCheapAPIError';
  }
}

export class ProxyCheapConnectionError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'ProxyCheapConnectionError';
  }
}

// Main Proxy-Cheap API Client
export class ProxyCheapClient {
  private config: Required<ProxyCheapConfig>;
  private rateLimiter: RateLimiter;

  constructor(config: ProxyCheapConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl.replace(/\/$/, ''), // Remove trailing slash
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      rateLimitDelay: config.rateLimitDelay || 1000
    };
    
    this.rateLimiter = new RateLimiter(100, 60000); // 100 requests per minute
    
    if (!this.config.apiKey) {
      throw new Error('Proxy-Cheap API key is required');
    }
  }

  // Private API Request Helper
  private async makeRequest(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'DELETE' | 'PUT';
      body?: any;
      headers?: Record<string, string>;
      retryCount?: number;
    } = {}
  ): Promise<any> {
    const {
      method = 'GET',
      body,
      headers = {},
      retryCount = 0
    } = options;

    await this.rateLimiter.waitIfNeeded();

    const url = `${this.config.baseUrl}${endpoint}`;
    const requestId = crypto.randomBytes(4).toString('hex');
    
    logger.info(`[${requestId}] Making ${method} request to ${endpoint}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'GEO-Expert-Authority-App/1.0',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new ProxyCheapAPIError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();
      logger.info(`[${requestId}] Request successful`);
      return data;

    } catch (error) {
      logger.error(`[${requestId}] Request failed:`, error as any);

      if (error instanceof ProxyCheapAPIError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new ProxyCheapConnectionError('Request timeout');
      }

      // Retry logic for connection errors
      if (retryCount < this.config.retryAttempts) {
        logger.info(`[${requestId}] Retrying request (${retryCount + 1}/${this.config.retryAttempts})`);
        await new Promise(resolve => setTimeout(resolve, this.config.rateLimitDelay * (retryCount + 1)));
        return this.makeRequest(endpoint, { ...options, retryCount: retryCount + 1 });
      }

      throw new ProxyCheapConnectionError('Failed to connect to Proxy-Cheap API', error as Error);
    }
  }

  // Core API Functions

  /**
   * Create a new proxy with Philippines location preference
   */
  async createProxy(location: ProxyLocation, options: {
    duration?: number; // days
    bandwidth?: number; // GB
    type?: 'residential' | 'datacenter';
  } = {}): Promise<ProxyDetails> {
    const payload = {
      location: {
        country: location.country,
        city: location.city,
        region: location.region
      },
      type: options.type || 'residential',
      duration: options.duration || 30,
      bandwidth: options.bandwidth || 10
    };

    logger.info('Creating new proxy with location:', location);
    const response = await this.makeRequest('/api/v1/proxies', {
      method: 'POST',
      body: payload
    });

    return this.formatProxyDetails(response.data);
  }

  /**
   * Delete/release a proxy
   */
  async deleteProxy(proxyId: string): Promise<boolean> {
    logger.info(`Deleting proxy: ${proxyId}`);
    await this.makeRequest(`/api/v1/proxies/${proxyId}`, {
      method: 'DELETE'
    });
    return true;
  }

  /**
   * Get proxy status and details
   */
  async getProxyStatus(proxyId: string): Promise<ProxyDetails> {
    logger.info(`Getting status for proxy: ${proxyId}`);
    const response = await this.makeRequest(`/api/v1/proxies/${proxyId}`);
    return this.formatProxyDetails(response.data);
  }

  /**
   * Test proxy connection and get geolocation
   */
  async testProxyConnection(credentials: ProxyCredentials): Promise<ProxyTestResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Testing proxy connection: ${credentials.host}:${credentials.port}`);
      
      // Test connection through the proxy
      const testResponse = await this.makeRequest('/api/v1/proxy/test', {
        method: 'POST',
        body: {
          host: credentials.host,
          port: credentials.port,
          username: credentials.username,
          password: credentials.password,
          protocol: credentials.protocol
        }
      });

      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        responseTime,
        ip: testResponse.ip,
        location: testResponse.location,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        responseTime,
        ip: '',
        location: {} as GeoLocation,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get proxy usage statistics
   */
  async getProxyUsageStats(proxyId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<ProxyUsageStats> {
    logger.info(`Getting usage stats for proxy ${proxyId} (${period})`);
    const response = await this.makeRequest(`/api/v1/proxies/${proxyId}/stats?period=${period}`);
    
    return {
      proxyId,
      period,
      requests: response.data.requests || 0,
      bandwidth: response.data.bandwidth || 0,
      uptime: response.data.uptime || 0,
      averageResponseTime: response.data.averageResponseTime || 0,
      successRate: response.data.successRate || 0
    };
  }

  /**
   * Get IP geolocation information
   */
  async getIpGeolocation(ip: string): Promise<GeoLocation> {
    logger.info(`Getting geolocation for IP: ${ip}`);
    const response = await this.makeRequest(`/api/v1/geolocation/${ip}`);
    
    return {
      ip,
      country: response.data.country,
      countryCode: response.data.countryCode,
      city: response.data.city,
      region: response.data.region,
      latitude: response.data.latitude,
      longitude: response.data.longitude,
      timezone: response.data.timezone,
      isp: response.data.isp,
      type: response.data.type || 'residential'
    };
  }

  /**
   * Validate Philippines location for proxy
   */
  async validatePhilippinesLocation(credentials: ProxyCredentials): Promise<{
    isValid: boolean;
    location: GeoLocation | null;
    reason?: string;
  }> {
    try {
      const testResult = await this.testProxyConnection(credentials);
      
      if (!testResult.success) {
        return {
          isValid: false,
          location: null,
          reason: 'Proxy connection failed'
        };
      }

      const location = testResult.location;
      const isPhilippines = location.countryCode === 'PH' || 
                           location.country.toLowerCase().includes('philippines');

      return {
        isValid: isPhilippines,
        location,
        reason: isPhilippines ? undefined : `Proxy located in ${location.country}, not Philippines`
      };

    } catch (error) {
      return {
        isValid: false,
        location: null,
        reason: `Validation failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get account usage and billing information
   */
  async getAccountUsage(): Promise<{
    currentUsage: number;
    monthlyLimit: number;
    billingPeriod: string;
    activeProxies: number;
    totalCost: number;
  }> {
    logger.info('Getting account usage information');
    const response = await this.makeRequest('/api/v1/account/usage');
    
    return {
      currentUsage: response.data.currentUsage || 0,
      monthlyLimit: response.data.monthlyLimit || 0,
      billingPeriod: response.data.billingPeriod,
      activeProxies: response.data.activeProxies || 0,
      totalCost: response.data.totalCost || 0
    };
  }

  // Helper Methods
  private formatProxyDetails(rawData: any): ProxyDetails {
    return {
      id: rawData.id,
      status: rawData.status || 'inactive',
      credentials: {
        host: rawData.host,
        port: rawData.port,
        username: rawData.username,
        password: rawData.password,
        protocol: rawData.protocol || 'http'
      },
      location: {
        country: rawData.location?.country || '',
        city: rawData.location?.city,
        region: rawData.location?.region,
        provider: rawData.location?.provider
      },
      createdAt: rawData.createdAt,
      expiresAt: rawData.expiresAt,
      trafficUsage: {
        used: rawData.usage?.used || 0,
        limit: rawData.usage?.limit || 0,
        unit: rawData.usage?.unit || 'GB'
      },
      cost: {
        daily: rawData.cost?.daily || 0,
        monthly: rawData.cost?.monthly || 0,
        currency: 'USD'
      }
    };
  }

  /**
   * Health check for the Proxy-Cheap API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest('/api/v1/health');
      return true;
    } catch (error) {
      logger.error('Proxy-Cheap API health check failed:', error as any);
      return false;
    }
  }
}

// Factory function to create client instance
export function createProxyCheapClient(): ProxyCheapClient {
  const apiKey = process.env.PROXY_CHEAP_API_KEY;
  const baseUrl = process.env.PROXY_CHEAP_BASE_URL || 'https://api.proxy-cheap.com';

  if (!apiKey) {
    throw new Error('PROXY_CHEAP_API_KEY environment variable is required');
  }

  return new ProxyCheapClient({
    apiKey,
    baseUrl,
    timeout: 30000,
    retryAttempts: 3,
    rateLimitDelay: 1000
  });
}