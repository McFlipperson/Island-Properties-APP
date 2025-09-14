import { db } from './db/index';
import { proxyAssignments } from '../shared/schema';
import { getProxyAssignmentService } from './proxy-assignment-service';
import { createProxyCheapClient } from './proxy-cheap-client';
import { getEncryptionService } from './encryption-service';
import { eq, and, lt, gte, desc } from 'drizzle-orm';

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

// Types for monitoring
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

// IP Reputation and Geolocation Services
class IPReputationService {
  /**
   * Check IP reputation using multiple sources
   */
  async checkIPReputation(ip: string): Promise<{
    score: number;
    isResidential: boolean;
    blacklistStatus: 'clean' | 'flagged' | 'unknown';
    sources: string[];
  }> {
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
    } catch (error) {
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
  async validateGeographicLocation(ip: string): Promise<{
    isPhilippines: boolean;
    detectedCountry: string;
    detectedCity: string;
    detectedRegion: string;
    confidence: number;
  }> {
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
      } else {
        return {
          isPhilippines: false,
          detectedCountry: 'US',
          detectedCity: 'New York',
          detectedRegion: 'New York',
          confidence: 0.87
        };
      }
    } catch (error) {
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

  private isPrivateIP(ip: string): boolean {
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
  private alerts: Map<string, ProxyAlert> = new Map();
  private lastAlertTime: Map<string, number> = new Map();

  /**
   * Create new alert with cooldown protection
   */
  createAlert(
    type: ProxyAlert['type'],
    severity: ProxyAlert['severity'],
    message: string,
    proxyId: string,
    expertId: string
  ): ProxyAlert | null {
    const alertKey = `${proxyId}_${type}`;
    const now = Date.now();
    const lastAlert = this.lastAlertTime.get(alertKey) || 0;
    
    // Check cooldown period
    if (now - lastAlert < MONITORING_CONFIG.ALERT_COOLDOWN) {
      return null; // Skip alert due to cooldown
    }
    
    const alert: ProxyAlert = {
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
  resolveAlert(alertId: string): boolean {
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
  getActiveAlertsForProxy(proxyId: string): ProxyAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.proxyId === proxyId && !alert.resolved);
  }

  /**
   * Get all active alerts
   */
  getAllActiveAlerts(): ProxyAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Clean up old resolved alerts
   */
  cleanupOldAlerts(maxAge: number = 24 * 60 * 60 * 1000): void {
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
export class ProxyMonitoringService {
  private proxyCheapClient = createProxyCheapClient();
  private encryptionService = getEncryptionService();
  private ipReputationService = new IPReputationService();
  private alertManager = new AlertManager();
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Start continuous monitoring of all proxy assignments
   */
  startMonitoring(): void {
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
  stopMonitoring(): void {
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
  async runMonitoringCycle(): Promise<void> {
    try {
      console.log('🔍 Starting proxy monitoring cycle...');
      
      // Get all active proxy assignments
      const activeProxies = await db
        .select()
        .from(proxyAssignments)
        .where(eq(proxyAssignments.assignmentStatus, 'active'));

      if (activeProxies.length === 0) {
        console.log('📭 No active proxies to monitor');
        return;
      }

      console.log(`🔍 Monitoring ${activeProxies.length} active proxies...`);

      // Monitor each proxy
      const monitoringPromises = activeProxies.map(proxy => 
        this.monitorSingleProxy(proxy)
      );

      await Promise.allSettled(monitoringPromises);

      // Clean up old alerts
      this.alertManager.cleanupOldAlerts();

      console.log('✅ Proxy monitoring cycle completed');

    } catch (error) {
      console.error('❌ Error during monitoring cycle:', error);
    }
  }

  /**
   * Monitor a single proxy assignment
   */
  async monitorSingleProxy(assignment: any): Promise<ProxyHealthMetrics> {
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

    } catch (error) {
      console.error(`❌ Failed to monitor proxy ${proxyId}:`, error);
      
      // Create critical alert for monitoring failure
      this.alertManager.createAlert(
        'health',
        'critical',
        `Monitoring failed: ${(error as Error).message}`,
        proxyId,
        expertId
      );

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
  async getMonitoringSummary(): Promise<MonitoringSummary> {
    const assignments = await db.select().from(proxyAssignments);
    
    const activeProxies = assignments.filter(a => a.assignmentStatus === 'active');
    const healthyProxies = activeProxies.filter(a => a.healthCheckStatus === 'healthy');
    const degradedProxies = activeProxies.filter(a => a.healthCheckStatus === 'degraded');
    const failedProxies = activeProxies.filter(a => a.healthCheckStatus === 'failed');
    
    const averageResponseTime = activeProxies.length > 0 ?
      activeProxies.reduce((sum, a) => sum + (a.averageResponseTime || 0), 0) / activeProxies.length : 0;
    
    const activeAlerts = this.alertManager.getAllActiveAlerts().length;
    
    let systemHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (failedProxies.length > activeProxies.length * 0.5) {
      systemHealth = 'critical';
    } else if (degradedProxies.length + failedProxies.length > activeProxies.length * 0.3) {
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
  async getProxyHealthMetrics(proxyId: string): Promise<ProxyHealthMetrics | null> {
    const assignment = await db
      .select()
      .from(proxyAssignments)
      .where(eq(proxyAssignments.id, proxyId))
      .limit(1);

    if (assignment.length === 0) {
      return null;
    }

    return this.monitorSingleProxy(assignment[0]);
  }

  // Private helper methods

  private async performHealthCheck(credentials: any): Promise<{
    success: boolean;
    responseTime: number;
    ip: string;
    error?: string;
  }> {
    try {
      const testResult = await this.proxyCheapClient.testProxyConnection({
        host: credentials.host,
        port: credentials.port,
        username: credentials.username,
        password: credentials.password,
        protocol: credentials.protocol as 'http' | 'https' | 'socks5'
      });

      return {
        success: testResult.success,
        responseTime: testResult.responseTime,
        ip: testResult.ip,
        error: testResult.error
      };
    } catch (error) {
      return {
        success: false,
        responseTime: 0,
        ip: '',
        error: (error as Error).message
      };
    }
  }

  private async decryptProxyCredentials(assignment: any): Promise<any> {
    if (!assignment.proxyCredentialsEncrypted) {
      throw new Error('No encrypted credentials found');
    }

    const encryptedData = JSON.parse(assignment.proxyCredentialsEncrypted);
    return await this.encryptionService.decryptProxyCredentials(encryptedData);
  }

  private async updateMonitoringResults(
    assignment: any,
    healthResult: any,
    reputationResult: any,
    geoResult: any
  ): Promise<void> {
    const updateData: any = {
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

    await db
      .update(proxyAssignments)
      .set(updateData)
      .where(eq(proxyAssignments.id, assignment.id));
  }

  private async checkAndGenerateAlerts(
    assignment: any,
    healthResult: any,
    reputationResult: any,
    geoResult: any
  ): Promise<void> {
    const proxyId = assignment.id;
    const expertId = assignment.personaId;

    // Health alerts
    if (!healthResult.success) {
      const consecutiveFailures = (assignment.consecutiveFailures || 0) + 1;
      if (consecutiveFailures >= MONITORING_CONFIG.MAX_CONSECUTIVE_FAILURES) {
        this.alertManager.createAlert(
          'health',
          'critical',
          `Proxy has failed ${consecutiveFailures} consecutive health checks`,
          proxyId,
          expertId
        );
      }
    }

    // Performance alerts
    if (healthResult.responseTime > MONITORING_CONFIG.RESPONSE_TIME_THRESHOLD) {
      this.alertManager.createAlert(
        'performance',
        'medium',
        `High response time: ${healthResult.responseTime}ms`,
        proxyId,
        expertId
      );
    }

    // Location alerts
    if (geoResult && !geoResult.isPhilippines) {
      this.alertManager.createAlert(
        'location',
        'high',
        `Proxy not located in Philippines: ${geoResult.detectedCountry}`,
        proxyId,
        expertId
      );
    }

    // Reputation alerts
    if (reputationResult) {
      if (reputationResult.blacklistStatus === 'flagged') {
        this.alertManager.createAlert(
          'reputation',
          'high',
          'Proxy IP flagged in reputation databases',
          proxyId,
          expertId
        );
      }

      if (!reputationResult.isResidential) {
        this.alertManager.createAlert(
          'reputation',
          'medium',
          'Proxy IP detected as non-residential',
          proxyId,
          expertId
        );
      }
    }
  }

  private buildHealthMetrics(
    assignment: any,
    healthResult: any,
    reputationResult: any,
    geoResult: any
  ): ProxyHealthMetrics {
    let status: 'healthy' | 'degraded' | 'failed' | 'unknown' = 'unknown';
    
    if (healthResult.success) {
      if (healthResult.responseTime < MONITORING_CONFIG.RESPONSE_TIME_THRESHOLD) {
        status = 'healthy';
      } else {
        status = 'degraded';
      }
    } else {
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
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
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
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

// Singleton service instance
let monitoringServiceInstance: ProxyMonitoringService | null = null;

/**
 * Get singleton monitoring service instance
 */
export function getProxyMonitoringService(): ProxyMonitoringService {
  if (!monitoringServiceInstance) {
    monitoringServiceInstance = new ProxyMonitoringService();
  }
  return monitoringServiceInstance;
}

/**
 * Auto-start monitoring service
 */
export function startProxyMonitoring(): void {
  const service = getProxyMonitoringService();
  service.startMonitoring();
}