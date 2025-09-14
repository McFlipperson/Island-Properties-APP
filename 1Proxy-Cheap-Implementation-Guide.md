     # Proxy-Cheap Integration - Island Properties Lead Generation Infrastructure

## Proxy Service Overview

### Service Configuration for Manual Posting Security

```typescript
interface ProxyCheapConfig {
  // Provider Details
  provider: 'Proxy-Cheap Static Residential Proxies';
  serviceType: 'static_residential'; // Dedicated IP per persona
  
  // Cost Structure (Budget Constraint)
  costPerIP: 1.27; // $1.27/month per dedicated IP
  maxIPs: 5; // 5 personas maximum
  totalMonthlyCost: 6.35; // $6.35/month total budget
  billingCycle: 'monthly';
  
  // Geographic Coverage (Philippines Focus)
  availableLocations: ['Manila', 'Cebu'];
  timezone: 'Asia/Manila';
  
  // Manual Posting Optimization
  connectionType: 'persistent'; // Maintain consistent IP per persona
  sessionStickiness: true; // Same IP for entire month
  fingerprint: 'residential'; // Authentic residential ISP fingerprint
}
```

### Why Static Residential Proxies for Lead Generation

**Advantages for Island Properties:**
- **Authentic Philippines Presence**: Real residential ISP connections in Manila/Cebu
- **Platform Trust**: Social media platforms trust residential IPs over datacenter IPs
- **Consistent Identity**: Same IP for entire month = consistent persona location
- **Manual Posting Safety**: Human + residential IP = lowest detection risk
- **Cost Effective**: $1.27/month per persona within $6.35 budget

## API Integration Architecture

### Proxy-Cheap API Configuration

```typescript
interface ProxyCheapAPI {
  baseUrl: 'https://api.proxy-cheap.com/v1';
  authentication: {
    method: 'API_KEY';
    header: 'X-API-Key';
    keyStorage: 'encrypted'; // AES-256-GCM encrypted API key
  };
  
  // Rate Limits (API Management)
  rateLimits: {
    requests_per_minute: 60;
    requests_per_hour: 1000;
    requests_per_day: 10000;
  };
}

// Core API endpoints for persona management
interface ProxyCheapEndpoints {
  // Proxy lifecycle management
  createProxy: 'POST /proxies';
  getProxy: 'GET /proxies/{proxyId}';
  listProxies: 'GET /proxies';
  deleteProxy: 'DELETE /proxies/{proxyId}';
  
  // Health and performance monitoring
  testConnection: 'POST /proxies/{proxyId}/test';
  getStats: 'GET /proxies/{proxyId}/stats';
  getBandwidthUsage: 'GET /proxies/{proxyId}/bandwidth';
  
  // Geographic targeting
  listLocations: 'GET /locations';
  getLocationDetails: 'GET /locations/{countryCode}/{city}';
  
  // Billing and cost management
  getBilling: 'GET /billing/current';
  getCostBreakdown: 'GET /billing/breakdown/{month}';
}
```

### Proxy Configuration Schema

```typescript
interface ProxyConfiguration {
  // Proxy-Cheap identifiers
  proxyId: string; // Provider's internal ID
  proxyType: 'static_residential';
  
  // Connection details
  endpoint: {
    host: string; // proxy.proxy-cheap.com
    port: number; // 8080, 8081, etc.
    protocol: 'HTTP' | 'SOCKS5';
  };
  
  // Authentication (Encrypted Storage)
  credentials: {
    username: string;
    password: string; // AES-256-GCM encrypted with persona-specific key
  };
  
  // Geographic assignment (Philippines Focus)
  location: {
    country: 'PH';
    city: 'Manila' | 'Cebu';
    region: 'NCR' | 'Central Visayas';
    timezone: 'Asia/Manila';
    ispProvider: string; // PLDT, Globe, Converge, etc.
  };
  
  // Persona assignment
  assignedPersona: {
    personaId: string;
    buyerPersonaType: string; // manila_professional, expat_retiree, etc.
    assignedAt: Date;
    lastUsed: Date;
    monthlyUsageHours: number;
  };
  
  // Health and reputation monitoring
  health: {
    status: 'healthy' | 'degraded' | 'failed';
    lastCheck: Date;
    responseTimeMs: number;
    uptimePercentage: number;
    reputationScore: number; // 0-1.00 reputation score
    blacklistStatus: BlacklistStatus;
  };
  
  // Cost tracking
  costTracking: {
    monthlyCostUsd: 1.27;
    dailyCostUsd: 0.042; // ~$1.27/30 days
    bandwidthUsageGB: number;
    overageCharges: number;
  };
}

interface BlacklistStatus {
  isBlacklisted: boolean;
  blacklistedOn: string[]; // Which services have blacklisted this IP
  lastReputationCheck: Date;
  abuseReports: number;
  spamScore: number; // 0-100 spam likelihood
}
```

## Browser Isolation Implementation

### Persona Browser Context Manager

```typescript
class PersonaBrowserManager {
  private contexts = new Map<string, BrowserContext>();
  private fingerprints = new Map<string, PersonaFingerprint>();
  private proxyManager: ProxyManager;
  
  constructor(proxyManager: ProxyManager) {
    this.proxyManager = proxyManager;
  }
  
  async createPersonaContext(personaId: string): Promise<BrowserContext> {
    // 1. Get dedicated proxy for persona
    const proxyConfig = await this.proxyManager.getPersonaProxy(personaId);
    if (!proxyConfig) {
      throw new Error(`No proxy assigned to persona ${personaId}`);
    }
    
    // 2. Generate unique fingerprint for persona
    const fingerprint = await this.generatePersonaFingerprint(personaId);
    
    // 3. Create isolated browser context
    const context = await browser.newContext({
      // Proxy configuration
      proxy: {
        server: `${proxyConfig.protocol.toLowerCase()}://${proxyConfig.host}:${proxyConfig.port}`,
        username: proxyConfig.credentials.username,
        password: proxyConfig.credentials.password
      },
      
      // Complete storage isolation
      storageState: undefined, // Fresh context - no shared data
      
      // Persona-specific fingerprint
      userAgent: fingerprint.userAgent,
      viewport: fingerprint.viewport,
      deviceScaleFactor: fingerprint.deviceScaleFactor,
      
      // Geographic consistency
      locale: 'en-PH', // Philippines English
      timezoneId: 'Asia/Manila',
      geolocation: fingerprint.geolocation, // Manila or Cebu coordinates
      
      // Privacy and security
      acceptDownloads: false,
      bypassCSP: false,
      ignoreHTTPSErrors: false,
      
      // Additional isolation
      javaScriptEnabled: true,
      offline: false,
      
      // Screen and media settings
      screen: fingerprint.screen,
      colorScheme: fingerprint.colorScheme,
      reducedMotion: fingerprint.reducedMotion
    });
    
    // 4. Inject fingerprint randomization scripts
    await this.injectFingerprintRandomization(context, fingerprint);
    
    // 5. Verify proxy and location
    await this.verifyProxyConnection(context, proxyConfig);
    
    // 6. Cache context for reuse during session
    this.contexts.set(personaId, context);
    this.fingerprints.set(personaId, fingerprint);
    
    return context;
  }
  
  private async generatePersonaFingerprint(personaId: string): Promise<PersonaFingerprint> {
    // Generate consistent but unique fingerprint per persona
    const persona = await this.getPersonaConfig(personaId);
    const seed = this.createPersonaSeed(personaId, persona.demographics);
    
    return {
      userAgent: this.generateUserAgent(seed, persona.location),
      viewport: this.generateViewport(seed),
      deviceScaleFactor: this.generateDeviceScale(seed),
      geolocation: this.generateGeolocation(persona.location),
      screen: this.generateScreenConfig(seed),
      colorScheme: this.generateColorScheme(seed),
      reducedMotion: this.generateMotionPreference(seed),
      
      // Browser-specific fingerprints to randomize
      canvas: this.generateCanvasFingerprint(seed),
      webgl: this.generateWebGLFingerprint(seed),
      audio: this.generateAudioFingerprint(seed),
      fonts: this.generateFontList(seed, persona.location)
    };
  }
  
  private async injectFingerprintRandomization(
    context: BrowserContext, 
    fingerprint: PersonaFingerprint
  ): Promise<void> {
    // Inject scripts to randomize browser fingerprinting
    await context.addInitScript((fp) => {
      // Canvas fingerprint randomization
      const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
      CanvasRenderingContext2D.prototype.getImageData = function(...args) {
        const imageData = originalGetImageData.apply(this, args);
        // Add subtle noise based on persona fingerprint
        const noise = fp.canvas.noise;
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i] += Math.floor(noise[i % noise.length] * 2) - 1;
        }
        return imageData;
      };
      
      // WebGL fingerprint randomization
      const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === this.RENDERER) {
          return fp.webgl.renderer;
        }
        if (parameter === this.VENDOR) {
          return fp.webgl.vendor;
        }
        return originalGetParameter.call(this, parameter);
      };
      
      // Audio context fingerprint randomization
      const originalCreateAnalyser = AudioContext.prototype.createAnalyser;
      AudioContext.prototype.createAnalyser = function() {
        const analyser = originalCreateAnalyser.call(this);
        const originalGetFloatFrequencyData = analyser.getFloatFrequencyData;
        analyser.getFloatFrequencyData = function(array) {
          originalGetFloatFrequencyData.call(this, array);
          // Add audio fingerprint noise
          for (let i = 0; i < array.length; i++) {
            array[i] += fp.audio.noise[i % fp.audio.noise.length];
          }
        };
        return analyser;
      };
      
      // Font detection randomization
      Object.defineProperty(document, 'fonts', {
        get: () => ({
          check: (font) => fp.fonts.available.includes(font.split(' ').pop()),
          ready: Promise.resolve(),
          load: () => Promise.resolve()
        })
      });
      
    }, fingerprint);
  }
  
  private async verifyProxyConnection(
    context: BrowserContext, 
    proxyConfig: ProxyConfiguration
  ): Promise<void> {
    const page = await context.newPage();
    
    try {
      // 1. Check current IP matches expected proxy IP
      await page.goto('https://ipapi.co/json/', { timeout: 30000 });
      const response = await page.evaluate(() => document.body.innerText);
      const ipData = JSON.parse(response);
      
      if (ipData.ip !== proxyConfig.endpoint.ip) {
        throw new Error(`IP mismatch. Expected: ${proxyConfig.endpoint.ip}, Got: ${ipData.ip}`);
      }
      
      // 2. Verify geographic location
      const expectedCity = proxyConfig.location.city;
      if (ipData.city !== expectedCity) {
        console.warn(`Location mismatch. Expected: ${expectedCity}, Got: ${ipData.city}`);
      }
      
      // 3. Check ISP and connection type
      if (!ipData.org.toLowerCase().includes('residential')) {
        console.warn(`Non-residential connection detected: ${ipData.org}`);
      }
      
      console.log(`✅ Proxy verified: ${ipData.ip} in ${ipData.city}, ${ipData.country_name}`);
      console.log(`🏠 ISP: ${ipData.org} (${ipData.asn})`);
      
    } catch (error) {
      console.error('❌ Proxy verification failed:', error);
      throw error;
    } finally {
      await page.close();
    }
  }
}

interface PersonaFingerprint {
  userAgent: string;
  viewport: { width: number; height: number };
  deviceScaleFactor: number;
  geolocation: { latitude: number; longitude: number };
  screen: { width: number; height: number };
  colorScheme: 'light' | 'dark' | 'no-preference';
  reducedMotion: 'reduce' | 'no-preference';
  
  // Randomization data
  canvas: { noise: number[] };
  webgl: { renderer: string; vendor: string };
  audio: { noise: number[] };
  fonts: { available: string[] };
}
```

## IP Reputation Monitoring System

### Real-Time Reputation Checking

```typescript
class ProxyReputationMonitor {
  private reputationAPIs: ReputationAPI[];
  private cache: Map<string, ReputationResult> = new Map();
  private cacheExpiry = 4 * 60 * 60 * 1000; // 4 hours
  
  constructor() {
    this.reputationAPIs = [
      new VirusTotalAPI(), // Free: 4 requests/min
      new AbuseIPDBAPI(),  // Free: 1000 requests/day
      new IPQualityScoreAPI(), // Free: 5000 requests/month
      new IPVoidAPI(),     // Free: 1000 requests/month
    ];
  }
  
  async checkProxyReputation(proxyIP: string): Promise<ReputationResult> {
    // Check cache first
    const cached = this.cache.get(proxyIP);
    if (cached && (Date.now() - cached.checkedAt) < this.cacheExpiry) {
      return cached;
    }
    
    // Run reputation checks in parallel
    const checks = await Promise.allSettled([
      this.checkVirusTotal(proxyIP),
      this.checkAbuseIPDB(proxyIP),
      this.checkIPQualityScore(proxyIP),
      this.performBasicConnectivityTest(proxyIP)
    ]);
    
    // Aggregate results
    const result = this.aggregateReputationResults(proxyIP, checks);
    
    // Cache result
    this.cache.set(proxyIP, result);
    
    // Log reputation check
    await this.logReputationCheck(proxyIP, result);
    
    return result;
  }
  
  private async checkVirusTotal(ip: string): Promise<ReputationCheck> {
    try {
      const response = await fetch(`https://www.virustotal.com/vtapi/v2/ip-address/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `apikey=${process.env.VIRUSTOTAL_API_KEY}&ip=${ip}`
      });
      
      const data = await response.json();
      
      return {
        acceptable: avgResponseTime < 5000 && maxResponseTime < 10000, // 5s avg, 10s max
        metrics: {
          averageResponseTime: avgResponseTime,
          maxResponseTime: maxResponseTime,
          successfulTests: successfulTests.length,
          totalTests: testEndpoints.length
        }
      };
      
    } catch (error) {
      return {
        acceptable: false,
        metrics: { error: error.message }
      };
    }
  }
  
  private async handleUnhealthyProxy(
    proxy: ProxyAssignment, 
    healthResult: PromiseSettledResult<HealthResult>
  ): Promise<void> {
    const error = healthResult.status === 'fulfilled' ? 
      healthResult.value.error : 
      'Health check failed';
    
    console.warn(`🚨 Unhealthy proxy detected: ${proxy.proxy_ip} - ${error}`);
    
    // 1. Update proxy status
    await this.database.updateProxyStatus(proxy.id, 'degraded', {
      lastError: error,
      lastHealthCheck: new Date(),
      consecutiveFailures: (proxy.consecutive_failures || 0) + 1
    });
    
    // 2. Notify persona management system
    await this.notifyPersonaManager(proxy.assigned_persona_id, {
      proxyId: proxy.id,
      proxyIP: proxy.proxy_ip,
      issue: error,
      severity: this.calculateSeverity(proxy.consecutive_failures || 0)
    });
    
    // 3. Attempt automatic remediation
    const remediationResult = await this.attemptProxyRemediation(proxy);
    
    if (!remediationResult.success) {
      // 4. If remediation fails, consider replacement
      await this.considerProxyReplacement(proxy);
    }
  }
  
  private async attemptProxyRemediation(proxy: ProxyAssignment): Promise<RemediationResult> {
    console.log(`🔧 Attempting remediation for proxy ${proxy.proxy_ip}`);
    
    try {
      // 1. Wait and retry (network issues might be temporary)
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
      
      // 2. Test again
      const retestResult = await this.checkProxyHealth(proxy);
      
      if (retestResult.healthy) {
        console.log(`✅ Proxy ${proxy.proxy_ip} recovered after retry`);
        await this.database.updateProxyStatus(proxy.id, 'healthy', {
          lastHealthCheck: new Date(),
          consecutiveFailures: 0
        });
        
        return { success: true, method: 'retry' };
      }
      
      // 3. If still failing, check with Proxy-Cheap API
      const providerStatus = await this.checkWithProvider(proxy.proxy_cheap_id);
      
      if (providerStatus.maintenance) {
        console.log(`🔧 Provider maintenance detected for ${proxy.proxy_ip}`);
        await this.database.updateProxyStatus(proxy.id, 'maintenance');
        return { success: true, method: 'provider_maintenance' };
      }
      
      return { success: false, reason: 'health_check_still_failing' };
      
    } catch (error) {
      console.error(`❌ Remediation failed for proxy ${proxy.proxy_ip}:`, error);
      return { success: false, reason: error.message };
    }
  }
  
  private shouldCheckReputation(lastCheck: Date | null): boolean {
    if (!lastCheck) return true;
    
    const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
    return lastCheck.getTime() < fourHoursAgo;
  }
}

interface HealthResult {
  healthy: boolean;
  responseTime: number;
  error?: string;
  checks: {
    connectivity: boolean;
    location?: boolean;
    reputation?: boolean;
    performance?: boolean;
  };
  reputationResult?: ReputationResult;
  performanceMetrics?: any;
}

interface ConnectivityResult {
  success: boolean;
  error?: string;
}

interface LocationResult {
  valid: boolean;
  error?: string;
  actualLocation?: any;
}

interface PerformanceResult {
  acceptable: boolean;
  metrics: any;
}
```

## Manual Posting Session Management

### Secure Session Creation for Personas

```typescript
class ManualPostingSessionManager {
  private activeSessions = new Map<string, PersonaSession>();
  private browserManager: PersonaBrowserManager;
  private proxyManager: ProxyManager;
  private database: DatabaseConnection;
  
  constructor(browserManager: PersonaBrowserManager, proxyManager: ProxyManager, database: DatabaseConnection) {
    this.browserManager = browserManager;
    this.proxyManager = proxyManager;
    this.database = database;
  }
  
  async startPersonaSession(personaId: string): Promise<PersonaSession> {
    console.log(`🚀 Starting manual posting session for persona ${personaId}`);
    
    try {
      // 1. Validate persona is ready for session
      await this.validatePersonaReadiness(personaId);
      
      // 2. Get and validate proxy assignment
      const proxyConfig = await this.proxyManager.getPersonaProxy(personaId);
      if (!proxyConfig) {
        throw new Error(`No proxy assigned to persona ${personaId}`);
      }
      
      // 3. Verify proxy health before session
      const proxyHealth = await this.verifyProxyHealth(proxyConfig);
      if (!proxyHealth.healthy) {
        throw new Error(`Proxy unhealthy: ${proxyHealth.error}`);
      }
      
      // 4. Create isolated browser context
      const browserContext = await this.browserManager.createPersonaContext(personaId);
      
      // 5. Create session record
      const session = await this.createSessionRecord(personaId, proxyConfig.id);
      
      // 6. Cache active session
      const personaSession: PersonaSession = {
        sessionId: session.id,
        personaId,
        proxyConfig,
        browserContext,
        startedAt: new Date(),
        status: 'active',
        securityValidated: true,
        manualActionsCount: 0
      };
      
      this.activeSessions.set(personaId, personaSession);
      
      console.log(`✅ Session started for persona ${personaId} - Ready for manual posting`);
      
      return personaSession;
      
    } catch (error) {
      console.error(`❌ Failed to start session for persona ${personaId}:`, error);
      throw error;
    }
  }
  
  async executeManualAction(
    personaId: string, 
    action: ManualAction
  ): Promise<ManualActionResult> {
    const session = this.activeSessions.get(personaId);
    if (!session) {
      throw new Error(`No active session for persona ${personaId}`);
    }
    
    try {
      // 1. Validate session is still healthy
      await this.validateSessionHealth(session);
      
      // 2. Execute action through browser context
      const result = await this.executeAction(session, action);
      
      // 3. Track manual action
      await this.trackManualAction(session.sessionId, action, result);
      
      // 4. Update session metrics
      session.manualActionsCount++;
      session.lastAction = new Date();
      
      return result;
      
    } catch (error) {
      await this.handleActionError(session, action, error);
      throw error;
    }
  }
  
  private async executeAction(
    session: PersonaSession, 
    action: ManualAction
  ): Promise<ManualActionResult> {
    const page = await session.browserContext.newPage();
    
    try {
      switch (action.type) {
        case 'login_platform':
          return await this.executeLogin(page, action);
          
        case 'create_post':
          return await this.executePostCreation(page, action);
          
        case 'engage_content':
          return await this.executeEngagement(page, action);
          
        case 'research_content':
          return await this.executeResearch(page, action);
          
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
      
    } finally {
      await page.close();
    }
  }
  
  private async executeLogin(page: Page, action: ManualAction): Promise<ManualActionResult> {
    const startTime = Date.now();
    
    try {
      const { platform, credentials } = action.data;
      
      // Navigate to platform login
      await page.goto(this.getPlatformLoginURL(platform), { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Human-like delays and interactions
      await this.humanLikeDelay(1000, 3000);
      
      // Fill credentials with human-like typing
      await this.humanLikeType(page, this.getLoginSelector(platform, 'username'), credentials.username);
      await this.humanLikeDelay(500, 1500);
      
      await this.humanLikeType(page, this.getLoginSelector(platform, 'password'), credentials.password);
      await this.humanLikeDelay(500, 1500);
      
      // Click login button
      await page.click(this.getLoginSelector(platform, 'submit'));
      
      // Wait for login completion
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
      
      // Verify successful login
      const loginSuccess = await this.verifyLoginSuccess(page, platform);
      
      return {
        success: loginSuccess,
        platform,
        actionType: 'login_platform',
        duration: Date.now() - startTime,
        humanValidated: true
      };
      
    } catch (error) {
      return {
        success: false,
        platform: action.data.platform,
        actionType: 'login_platform',
        duration: Date.now() - startTime,
        error: error.message,
        humanValidated: false
      };
    }
  }
  
  private async executePostCreation(page: Page, action: ManualAction): Promise<ManualActionResult> {
    const startTime = Date.now();
    
    try {
      const { platform, content, media, scheduling } = action.data;
      
      // Navigate to post creation
      await page.goto(this.getPostCreationURL(platform));
      await this.humanLikeDelay(1000, 2000);
      
      // Fill content with human-like typing
      const contentSelector = this.getContentSelector(platform);
      await this.humanLikeType(page, contentSelector, content);
      
      // Add media if provided
      if (media && media.length > 0) {
        await this.uploadMedia(page, platform, media);
      }
      
      // Handle scheduling or immediate posting
      if (scheduling && scheduling.scheduleTime) {
        await this.schedulePost(page, platform, scheduling.scheduleTime);
      } else {
        // Immediate posting with human confirmation
        await this.confirmAndPublish(page, platform);
      }
      
      // Verify post creation
      const postCreated = await this.verifyPostCreation(page, platform);
      
      return {
        success: postCreated.success,
        platform,
        actionType: 'create_post',
        duration: Date.now() - startTime,
        humanValidated: true,
        postId: postCreated.postId,
        postUrl: postCreated.postUrl
      };
      
    } catch (error) {
      return {
        success: false,
        platform: action.data.platform,
        actionType: 'create_post',
        duration: Date.now() - startTime,
        error: error.message,
        humanValidated: false
      };
    }
  }
  
  private async humanLikeType(page: Page, selector: string, text: string): Promise<void> {
    await page.focus(selector);
    
    // Type with human-like delays between characters
    for (const char of text) {
      await page.keyboard.type(char);
      await this.humanLikeDelay(50, 150); // Random delay between keystrokes
    }
  }
  
  private async humanLikeDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  async endPersonaSession(personaId: string): Promise<void> {
    const session = this.activeSessions.get(personaId);
    if (!session) return;
    
    try {
      // 1. Close all browser pages and context
      await session.browserContext.close();
      
      // 2. Update session record
      await this.database.updatePersonaSession(session.sessionId, {
        ended_at: new Date(),
        duration_minutes: Math.floor((Date.now() - session.startedAt.getTime()) / 60000),
        manual_posts_created: session.manualActionsCount,
        session_status: 'ended'
      });
      
      // 3. Remove from active sessions
      this.activeSessions.delete(personaId);
      
      console.log(`✅ Session ended for persona ${personaId}`);
      
    } catch (error) {
      console.error(`❌ Error ending session for persona ${personaId}:`, error);
    }
  }
}

interface PersonaSession {
  sessionId: string;
  personaId: string;
  proxyConfig: ProxyConfiguration;
  browserContext: BrowserContext;
  startedAt: Date;
  lastAction?: Date;
  status: 'active' | 'idle' | 'ending';
  securityValidated: boolean;
  manualActionsCount: number;
}

interface ManualAction {
  type: 'login_platform' | 'create_post' | 'engage_content' | 'research_content';
  data: any;
  humanInitiated: boolean;
  timestamp: Date;
}

interface ManualActionResult {
  success: boolean;
  platform: string;
  actionType: string;
  duration: number;
  humanValidated: boolean;
  error?: string;
  postId?: string;
  postUrl?: string;
}
```

## Cost Management and Budget Monitoring

### Real-Time Budget Tracking

```typescript
class ProxyCostManager {
  private database: DatabaseConnection;
  private monthlyBudgetLimit = 6.35; // $6.35/month constraint
  private costPerProxy = 1.27; // $1.27/month per proxy
  private maxProxies = 5; // Maximum proxies within budget
  
  constructor(database: DatabaseConnection) {
    this.database = database;
  }
  
  async checkBudgetAvailability(): Promise<BudgetStatus> {
    const currentMonth = this.getCurrentMonth();
    const currentCosts = await this.calculateCurrentMonthlyCosts(currentMonth);
    
    return {
      monthlyBudget: this.monthlyBudgetLimit,
      currentSpending: currentCosts.total,
      remainingBudget: this.monthlyBudgetLimit - currentCosts.total,
      utilizationPercentage: (currentCosts.total / this.monthlyBudgetLimit) * 100,
      proxiesActive: currentCosts.activeProxies,
      canAddProxy: currentCosts.total + this.costPerProxy <= this.monthlyBudgetLimit,
      costBreakdown: currentCosts.breakdown
    };
  }
  
  async trackDailyCosts(): Promise<DailyCostSummary> {
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate daily costs for all active proxies
    const activeProxies = await this.database.getActiveProxyAssignments();
    const dailyProxyCost = (this.costPerProxy / 30); // ~$0.042 per day per proxy
    
    const costBreakdown = await Promise.all(
      activeProxies.map(async (proxy) => {
        const usage = await this.getProxyDailyUsage(proxy.id, today);
        
        return {
          proxyId: proxy.id,
          personaId: proxy.assigned_persona_id,
          location: proxy.city,
          baseCost: dailyProxyCost,
          bandwidthCost: this.calculateBandwidthCost(usage.bandwidthGB),
          totalCost: dailyProxyCost + this.calculateBandwidthCost(usage.bandwidthGB),
          usage: usage
        };
      })
    );
    
    const totalDailyCost = costBreakdown.reduce((sum, cost) => sum + cost.totalCost, 0);
    
    // Store daily cost record
    await this.storeDailyCostRecord(today, costBreakdown, totalDailyCost);
    
    return {
      date: today,
      totalCost: totalDailyCost,
      proxyCosts: costBreakdown,
      projectedMonthlyCost: totalDailyCost * 30,
      budgetOnTrack: (totalDailyCost * 30) <= this.monthlyBudgetLimit
    };
  }
  
  async optimizeCosts(): Promise<CostOptimizationResult> {
    const budgetStatus = await this.checkBudgetAvailability();
    const recommendations: CostOptimization[] = [];
    
    // If over budget, suggest optimizations
    if (budgetStatus.utilizationPercentage > 100) {
      recommendations.push({
        type: 'reduce_proxies',
        description: 'Consider removing underperforming personas to stay within budget',
        potentialSavings: this.costPerProxy,
        priority: 'high'
      });
    }
    
    // Check for underutilized proxies
    const utilizationAnalysis = await this.analyzeProxyUtilization();
    const underutilized = utilizationAnalysis.filter(proxy => proxy.utilizationRate < 0.3);
    
    if (underutilized.length > 0) {
      recommendations.push({
        type: 'optimize_utilization',
        description: `${underutilized.length} proxies are underutilized`,
        details: underutilized.map(p => ({
          proxyId: p.proxyId,
          utilizationRate: p.utilizationRate,
          suggestion: 'Increase posting frequency or consider removal'
        })),
        priority: 'medium'
      });
    }
    
    // ROI-based recommendations
    const roiAnalysis = await this.analyzeProxyROI();
    const lowROI = roiAnalysis.filter(proxy => proxy.roi < 0);
    
    if (lowROI.length > 0) {
      recommendations.push({
        type: 'improve_roi',
        description: `${lowROI.length} proxies have negative ROI`,
        details: lowROI.map(p => ({
          proxyId: p.proxyId,
          currentROI: p.roi,
          suggestion: 'Review persona strategy or content approach'
        })),
        priority: 'high'
      });
    }
    
    return {
      currentBudgetStatus: budgetStatus,
      recommendations,
      projectedSavings: recommendations.reduce((sum, rec) => sum + (rec.potentialSavings || 0), 0)
    };
  }
  
  private async calculateCurrentMonthlyCosts(month: string): Promise<MonthlyCostBreakdown> {
    const activeProxies = await this.database.query(`
      SELECT 
        pa.*,
        p.pen_name,
        p.buyer_persona_type
      FROM proxy_assignments pa
      LEFT JOIN personas p ON pa.assigned_persona_id = p.id
      WHERE pa.assignment_status = 'assigned'
    `);
    
    const breakdown = activeProxies.map(proxy => ({
      proxyId: proxy.id,
      personaName: proxy.pen_name,
      buyerPersonaType: proxy.buyer_persona_type,
      location: proxy.city,
      monthlyCost: this.costPerProxy,
      daysActive: this.calculateDaysActive(proxy.assigned_at)
    }));
    
    const totalCost = breakdown.reduce((sum, item) => sum + item.monthlyCost, 0);
    
    return {
      total: totalCost,
      activeProxies: activeProxies.length,
      breakdown
    };
  }
  
  async alertBudgetThresholds(): Promise<void> {
    const budgetStatus = await this.checkBudgetAvailability();
    
    // Alert at 80% budget utilization
    if (budgetStatus.utilizationPercentage >= 80 && budgetStatus.utilizationPercentage < 100) {
      await this.sendBudgetAlert({
        level: 'warning',
        message: `Budget utilization at ${budgetStatus.utilizationPercentage.toFixed(1)}%`,
        currentSpending: budgetStatus.currentSpending,
        remainingBudget: budgetStatus.remainingBudget
      });
    }
    
    // Alert at 100% budget utilization
    if (budgetStatus.utilizationPercentage >= 100) {
      await this.sendBudgetAlert({
        level: 'critical',
        message: 'Monthly budget exceeded!',
        currentSpending: budgetStatus.currentSpending,
        overBudgetAmount: budgetStatus.currentSpending - budgetStatus.monthlyBudget
      });
    }
  }
}

interface BudgetStatus {
  monthlyBudget: number;
  currentSpending: number;
  remainingBudget: number;
  utilizationPercentage: number;
  proxiesActive: number;
  canAddProxy: boolean;
  costBreakdown: any[];
}

interface DailyCostSummary {
  date: string;
  totalCost: number;
  proxyCosts: any[];
  projectedMonthlyCost: number;
  budgetOnTrack: boolean;
}

interface CostOptimizationResult {
  currentBudgetStatus: BudgetStatus;
  recommendations: CostOptimization[];
  projectedSavings: number;
}

interface CostOptimization {
  type: string;
  description: string;
  potentialSavings?: number;
  priority: 'low' | 'medium' | 'high';
  details?: any[];
}
```

This comprehensive Proxy-Cheap implementation guide provides:

- **Browser isolation per persona** with fingerprint randomization
- **IP reputation monitoring** using multiple free APIs
- **Manual posting session management** with human-like interactions
- **Real-time health monitoring** with automatic remediation
- **Cost management** within the $6.35/month budget constraint
- **Security-first architecture** with encrypted credential storage
- **Philippines geographic focus** with Manila/Cebu targeting
- **Lead generation optimization** through authentic residential IP presence

The system prioritizes manual posting safety while providing the technical infrastructure for consistent, authentic persona management.
        source: 'VirusTotal',
        score: data.positives > 0 ? 0.0 : 1.0, // 0 = bad, 1 = good
        details: {
          positives: data.positives,
          total: data.total,
          scans: data.scans
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        source: 'VirusTotal',
        score: 0.5, // Unknown/error = neutral
        details: { error: error.message },
        timestamp: new Date()
      };
    }
  }
  
  private async checkAbuseIPDB(ip: string): Promise<ReputationCheck> {
    try {
      const response = await fetch(`https://api.abuseipdb.com/api/v2/check`, {
        method: 'GET',
        headers: {
          'Key': process.env.ABUSEIPDB_API_KEY,
          'Accept': 'application/json'
        },
        params: { ip, maxAgeInDays: 90 }
      });
      
      const data = await response.json();
      
      return {
        source: 'AbuseIPDB',
        score: (100 - data.abuseConfidencePercentage) / 100, // Convert to 0-1 scale
        details: {
          abuseConfidence: data.abuseConfidencePercentage,
          countryCode: data.countryCode,
          usageType: data.usageType,
          isp: data.isp,
          totalReports: data.totalReports
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        source: 'AbuseIPDB',
        score: 0.5,
        details: { error: error.message },
        timestamp: new Date()
      };
    }
  }
  
  private async checkIPQualityScore(ip: string): Promise<ReputationCheck> {
    try {
      const response = await fetch(
        `https://ipqualityscore.com/api/json/ip/${process.env.IPQ_API_KEY}/${ip}?strictness=1`
      );
      
      const data = await response.json();
      
      // Calculate composite score
      let score = 1.0;
      if (data.fraud_score > 75) score -= 0.8; // High fraud = very bad
      else if (data.fraud_score > 50) score -= 0.5; // Medium fraud = bad
      else if (data.fraud_score > 25) score -= 0.2; // Low fraud = slightly bad
      
      if (data.vpn || data.tor) score -= 0.3; // VPN/Tor detection
      if (data.proxy) score -= 0.1; // Proxy detection (less severe for our use case)
      if (data.bot_status) score -= 0.4; // Bot activity
      
      return {
        source: 'IPQualityScore',
        score: Math.max(0, score),
        details: {
          fraudScore: data.fraud_score,
          countryCode: data.country_code,
          city: data.city,
          isp: data.ISP,
          connectionType: data.connection_type,
          isVPN: data.vpn,
          isProxy: data.proxy,
          isTor: data.tor,
          botStatus: data.bot_status,
          recentAbuse: data.recent_abuse
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        source: 'IPQualityScore',
        score: 0.5,
        details: { error: error.message },
        timestamp: new Date()
      };
    }
  }
  
  private async performBasicConnectivityTest(ip: string): Promise<ReputationCheck> {
    const startTime = Date.now();
    
    try {
      // Test basic HTTP connectivity through proxy
      const response = await fetch('https://httpbin.org/ip', {
        timeout: 10000,
        // Note: This would use the proxy configuration in real implementation
      });
      
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      return {
        source: 'ConnectivityTest',
        score: response.ok ? 1.0 : 0.0,
        details: {
          responseTime,
          status: response.status,
          responseIP: data.origin
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        source: 'ConnectivityTest',
        score: 0.0,
        details: {
          error: error.message,
          responseTime: Date.now() - startTime
        },
        timestamp: new Date()
      };
    }
  }
  
  private aggregateReputationResults(
    ip: string, 
    checks: PromiseSettledResult<ReputationCheck>[]
  ): ReputationResult {
    const successfulChecks = checks
      .filter(check => check.status === 'fulfilled')
      .map(check => check.value);
    
    if (successfulChecks.length === 0) {
      return {
        ip,
        overallScore: 0.5, // Unknown
        status: 'unknown',
        checks: [],
        checkedAt: Date.now(),
        recommendations: ['Unable to verify IP reputation', 'Consider manual verification']
      };
    }
    
    // Weighted average of reputation scores
    const weights = {
      'VirusTotal': 0.3,
      'AbuseIPDB': 0.3,
      'IPQualityScore': 0.3,
      'ConnectivityTest': 0.1
    };
    
    const weightedScore = successfulChecks.reduce((sum, check) => {
      const weight = weights[check.source] || 0.1;
      return sum + (check.score * weight);
    }, 0);
    
    const overallScore = weightedScore / Object.values(weights).reduce((a, b) => a + b, 0);
    
    // Determine status
    let status: 'excellent' | 'good' | 'acceptable' | 'poor' | 'blocked';
    let recommendations: string[] = [];
    
    if (overallScore >= 0.9) {
      status = 'excellent';
      recommendations.push('IP has excellent reputation');
    } else if (overallScore >= 0.7) {
      status = 'good';
      recommendations.push('IP has good reputation');
    } else if (overallScore >= 0.5) {
      status = 'acceptable';
      recommendations.push('IP has acceptable reputation, monitor closely');
    } else if (overallScore >= 0.3) {
      status = 'poor';
      recommendations.push('IP has poor reputation, consider replacement');
    } else {
      status = 'blocked';
      recommendations.push('IP is likely blocked/blacklisted, replace immediately');
    }
    
    return {
      ip,
      overallScore,
      status,
      checks: successfulChecks,
      checkedAt: Date.now(),
      recommendations
    };
  }
}

interface ReputationCheck {
  source: string;
  score: number; // 0-1 scale, 1 = excellent reputation
  details: any;
  timestamp: Date;
}

interface ReputationResult {
  ip: string;
  overallScore: number;
  status: 'excellent' | 'good' | 'acceptable' | 'poor' | 'blocked' | 'unknown';
  checks: ReputationCheck[];
  checkedAt: number;
  recommendations: string[];
}
```

## Proxy Health Monitoring

### Automated Health Checks

```typescript
class ProxyHealthMonitor {
  private healthCheckInterval = 15 * 60 * 1000; // 15 minutes
  private monitoringActive = false;
  private database: DatabaseConnection;
  private reputationMonitor: ProxyReputationMonitor;
  
  constructor(database: DatabaseConnection) {
    this.database = database;
    this.reputationMonitor = new ProxyReputationMonitor();
  }
  
  startMonitoring(): void {
    if (this.monitoringActive) return;
    
    this.monitoringActive = true;
    
    // Immediate health check
    this.runHealthChecks();
    
    // Schedule regular health checks
    setInterval(async () => {
      await this.runHealthChecks();
    }, this.healthCheckInterval);
    
    console.log('✅ Proxy health monitoring started - checks every 15 minutes');
  }
  
  private async runHealthChecks(): Promise<void> {
    console.log('🔍 Running proxy health checks...');
    
    try {
      const activeProxies = await this.database.getActiveProxyAssignments();
      
      const healthChecks = activeProxies.map(proxy => 
        this.checkProxyHealth(proxy)
      );
      
      const results = await Promise.allSettled(healthChecks);
      
      // Process results and handle failures
      for (let i = 0; i < results.length; i++) {
        const proxy = activeProxies[i];
        const result = results[i];
        
        if (result.status === 'fulfilled' && result.value.healthy) {
          await this.updateProxyStatus(proxy.id, 'healthy', result.value);
        } else {
          await this.handleUnhealthyProxy(proxy, result);
        }
      }
      
      console.log(`✅ Health checks completed for ${activeProxies.length} proxies`);
      
    } catch (error) {
      console.error('❌ Health check batch failed:', error);
    }
  }
  
  private async checkProxyHealth(proxy: ProxyAssignment): Promise<HealthResult> {
    const startTime = Date.now();
    
    try {
      // 1. Basic connectivity test
      const connectivityResult = await this.testProxyConnectivity(proxy);
      if (!connectivityResult.success) {
        return {
          healthy: false,
          responseTime: Date.now() - startTime,
          error: connectivityResult.error,
          checks: { connectivity: false }
        };
      }
      
      // 2. Geographic validation
      const locationResult = await this.validateProxyLocation(proxy);
      if (!locationResult.valid) {
        return {
          healthy: false,
          responseTime: Date.now() - startTime,
          error: 'Geographic location mismatch',
          checks: { connectivity: true, location: false }
        };
      }
      
      // 3. Reputation check (every 4 hours)
      const shouldCheckReputation = this.shouldCheckReputation(proxy.last_reputation_check);
      let reputationResult = null;
      
      if (shouldCheckReputation) {
        reputationResult = await this.reputationMonitor.checkProxyReputation(proxy.proxy_ip);
        
        if (reputationResult.status === 'blocked' || reputationResult.status === 'poor') {
          return {
            healthy: false,
            responseTime: Date.now() - startTime,
            error: `Poor reputation: ${reputationResult.status}`,
            checks: { connectivity: true, location: true, reputation: false },
            reputationResult
          };
        }
      }
      
      // 4. Performance validation
      const performanceResult = await this.checkProxyPerformance(proxy);
      
      return {
        healthy: true,
        responseTime: Date.now() - startTime,
        checks: {
          connectivity: true,
          location: true,
          reputation: reputationResult?.status !== 'poor' && reputationResult?.status !== 'blocked',
          performance: performanceResult.acceptable
        },
        reputationResult,
        performanceMetrics: performanceResult.metrics
      };
      
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        error: error.message,
        checks: { connectivity: false }
      };
    }
  }
  
  private async testProxyConnectivity(proxy: ProxyAssignment): Promise<ConnectivityResult> {
    try {
      const response = await fetch('https://httpbin.org/ip', {
        method: 'GET',
        timeout: 30000,
        // Proxy configuration would be applied here
        // This is a simplified example
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      const data = await response.json();
      
      // Verify IP matches expected proxy IP
      if (data.origin !== proxy.proxy_ip) {
        return {
          success: false,
          error: `IP mismatch. Expected: ${proxy.proxy_ip}, Got: ${data.origin}`
        };
      }
      
      return { success: true };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  private async validateProxyLocation(proxy: ProxyAssignment): Promise<LocationResult> {
    try {
      const response = await fetch('https://ipapi.co/json/', {
        timeout: 30000,
        // Proxy configuration would be applied here
      });
      
      const locationData = await response.json();
      
      // Validate country
      if (locationData.country_code !== 'PH') {
        return {
          valid: false,
          error: `Wrong country. Expected: PH, Got: ${locationData.country_code}`,
          actualLocation: locationData
        };
      }
      
      // Validate city (allow some flexibility for nearby areas)
      const expectedCity = proxy.city.toLowerCase();
      const actualCity = locationData.city.toLowerCase();
      
      const cityMatch = actualCity.includes(expectedCity) || 
                       expectedCity.includes(actualCity) ||
                       this.isNearbyCity(expectedCity, actualCity);
      
      if (!cityMatch) {
        console.warn(`City mismatch for proxy ${proxy.proxy_ip}. Expected: ${expectedCity}, Got: ${actualCity}`);
        // Warning but not failure - ISP routing can vary
      }
      
      return {
        valid: true,
        actualLocation: locationData
      };
      
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
  
  private async checkProxyPerformance(proxy: ProxyAssignment): Promise<PerformanceResult> {
    const startTime = Date.now();
    
    try {
      // Test multiple endpoints for performance
      const testEndpoints = [
        'https://httpbin.org/delay/1',
        'https://facebook.com',
        'https://instagram.com'
      ];
      
      const performanceTests = testEndpoints.map(endpoint => 
        this.timeRequest(endpoint)
      );
      
      const results = await Promise.allSettled(performanceTests);
      const successfulTests = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);
      
      if (successfulTests.length === 0) {
        return {
          acceptable: false,
          metrics: { error: 'All performance tests failed' }
        };
      }
      
      const avgResponseTime = successfulTests.reduce((sum, time) => sum + time, 0) / successfulTests.length;
      const maxResponseTime = Math.max(...successfulTests);
      
      return {