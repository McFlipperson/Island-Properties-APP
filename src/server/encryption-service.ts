import crypto from 'crypto';

// Encryption Configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM (12 bytes recommended)
const TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

// Types for encryption
export interface EncryptedData {
  encryptedData: string; // Base64 encoded
  iv: string; // Base64 encoded
  tag: string; // Base64 encoded
  keyId: string; // Expert-specific key identifier
}

export interface DecryptedCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  protocol: string;
  metadata?: Record<string, any>;
}

// Custom Error Classes
export class EncryptionError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class DecryptionError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DecryptionError';
  }
}

export class KeyManagementError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'KeyManagementError';
  }
}

// Expert-specific key management
class ExpertKeyManager {
  private keys: Map<string, Buffer> = new Map();
  private masterKey: Buffer;

  constructor() {
    // Initialize master key from environment - REQUIRED for production
    const masterKeyEnv = process.env.MASTER_ENCRYPTION_KEY;
    if (!masterKeyEnv) {
      throw new KeyManagementError(
        'MASTER_ENCRYPTION_KEY environment variable is required. ' +
        'Generate with: openssl rand -base64 32'
      );
    }
    
    this.masterKey = Buffer.from(masterKeyEnv, 'base64');
    if (this.masterKey.length !== KEY_LENGTH) {
      throw new KeyManagementError(
        `Invalid master key length. Expected ${KEY_LENGTH} bytes, got ${this.masterKey.length}. ` +
        'Generate with: openssl rand -base64 32'
      );
    }
  }

  /**
   * Generate expert-specific encryption key using deterministic derivation
   */
  generateExpertKey(expertId: string): string {
    // Use deterministic key ID for persistence across restarts
    const keyId = `expert_${expertId}`;
    
    // Only generate if not already exists
    if (!this.keys.has(keyId)) {
      // Derive expert-specific key using PBKDF2 (deterministic)
      const expertKey = crypto.pbkdf2Sync(
        this.masterKey,
        Buffer.from(`expert_salt_${expertId}`, 'utf8'), // Deterministic salt
        100000, // iterations
        KEY_LENGTH,
        'sha256'
      );

      // Store the key
      this.keys.set(keyId, expertKey);
    }
    
    return keyId;
  }

  /**
   * Retrieve expert-specific encryption key (derive on-demand if not found)
   */
  getExpertKey(keyId: string): Buffer {
    let key = this.keys.get(keyId);
    if (!key) {
      // Derive key on-demand from keyId (handles cold starts)
      const expertId = this.extractExpertIdFromKeyId(keyId);
      if (!expertId) {
        throw new KeyManagementError(`Invalid key ID format: ${keyId}`);
      }
      
      // Regenerate the key using deterministic derivation
      key = crypto.pbkdf2Sync(
        this.masterKey,
        Buffer.from(`expert_salt_${expertId}`, 'utf8'),
        100000,
        KEY_LENGTH,
        'sha256'
      );
      
      // Cache the derived key
      this.keys.set(keyId, key);
    }
    return key;
  }

  /**
   * Extract expertId from keyId for on-demand key derivation
   */
  private extractExpertIdFromKeyId(keyId: string): string | null {
    if (!keyId.startsWith('expert_')) {
      return null;
    }
    return keyId.substring(7); // Remove 'expert_' prefix
  }

  /**
   * Rotate expert key (generate new key for expert)
   */
  rotateExpertKey(expertId: string, oldKeyId?: string): string {
    const newKeyId = this.generateExpertKey(expertId);
    
    // Mark old key for deletion (if provided)
    if (oldKeyId) {
      this.keys.delete(oldKeyId);
    }
    
    return newKeyId;
  }

  /**
   * Validate key ID format and accessibility
   */
  validateKeyId(keyId: string): boolean {
    // Validate format first
    if (!keyId.startsWith('expert_')) {
      return false;
    }
    
    // Check if we can derive/access the key
    try {
      this.getExpertKey(keyId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clean up unused keys (should be called periodically)
   */
  cleanupUnusedKeys(activeKeyIds: string[]): void {
    const allKeys = Array.from(this.keys.keys());
    const unusedKeys = allKeys.filter(keyId => !activeKeyIds.includes(keyId));
    
    unusedKeys.forEach(keyId => {
      this.keys.delete(keyId);
    });
    
    console.log(`🔐 Cleaned up ${unusedKeys.length} unused encryption keys`);
  }
}

// Main Encryption Service
export class EncryptionService {
  private keyManager: ExpertKeyManager;

  constructor() {
    this.keyManager = new ExpertKeyManager();
  }

  /**
   * Encrypt proxy credentials for specific expert
   */
  async encryptProxyCredentials(
    credentials: DecryptedCredentials,
    expertId: string,
    keyId?: string
  ): Promise<EncryptedData> {
    try {
      // Generate or use existing key
      const currentKeyId = keyId || this.keyManager.generateExpertKey(expertId);
      const encryptionKey = this.keyManager.getExpertKey(currentKeyId);

      // Prepare data for encryption
      const dataToEncrypt = JSON.stringify(credentials);
      const iv = crypto.randomBytes(IV_LENGTH);

      // Create cipher with proper GCM implementation
      const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);

      // Encrypt data
      let encrypted = cipher.update(dataToEncrypt, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Get authentication tag
      const tag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        keyId: currentKeyId
      };

    } catch (error) {
      throw new EncryptionError(
        `Failed to encrypt proxy credentials: ${(error as Error).message}`,
        'ENCRYPTION_FAILED'
      );
    }
  }

  /**
   * Decrypt proxy credentials for specific expert
   */
  async decryptProxyCredentials(encryptedData: EncryptedData): Promise<DecryptedCredentials> {
    try {
      // Validate key ID and get encryption key
      if (!this.keyManager.validateKeyId(encryptedData.keyId)) {
        throw new DecryptionError('Invalid or inaccessible encryption key', 'INVALID_KEY');
      }

      const encryptionKey = this.keyManager.getExpertKey(encryptedData.keyId);

      // Prepare decryption
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const tag = Buffer.from(encryptedData.tag, 'base64');

      // Create decipher with proper GCM implementation
      const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
      decipher.setAuthTag(tag);

      // Decrypt data
      let decrypted = decipher.update(encryptedData.encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      // Parse and validate decrypted data
      const credentials = JSON.parse(decrypted) as DecryptedCredentials;
      this.validateCredentials(credentials);

      return credentials;

    } catch (error) {
      if (error instanceof DecryptionError) {
        throw error;
      }
      throw new DecryptionError(
        `Failed to decrypt proxy credentials: ${(error as Error).message}`,
        'DECRYPTION_FAILED'
      );
    }
  }

  /**
   * Re-encrypt credentials with new key (for key rotation)
   */
  async reencryptCredentials(
    encryptedData: EncryptedData,
    expertId: string
  ): Promise<EncryptedData> {
    try {
      // Decrypt with old key
      const credentials = await this.decryptProxyCredentials(encryptedData);
      
      // Generate new key and encrypt
      const newKeyId = this.keyManager.rotateExpertKey(expertId, encryptedData.keyId);
      return await this.encryptProxyCredentials(credentials, expertId, newKeyId);

    } catch (error) {
      throw new EncryptionError(
        `Failed to re-encrypt credentials: ${(error as Error).message}`,
        'REENCRYPTION_FAILED'
      );
    }
  }

  /**
   * Securely generate new expert encryption key
   */
  generateExpertEncryptionKey(expertId: string): string {
    if (!expertId || expertId.trim().length === 0) {
      throw new KeyManagementError('Expert ID is required for key generation');
    }
    
    return this.keyManager.generateExpertKey(expertId);
  }

  /**
   * Validate key accessibility for expert
   */
  validateExpertKey(keyId: string): boolean {
    return this.keyManager.validateKeyId(keyId);
  }

  /**
   * Rotate encryption key for expert
   */
  rotateExpertKey(expertId: string, currentKeyId?: string): string {
    return this.keyManager.rotateExpertKey(expertId, currentKeyId);
  }

  /**
   * Encrypt any sensitive data with expert context
   */
  async encryptSensitiveData(
    data: Record<string, any>,
    expertId: string,
    keyId?: string
  ): Promise<EncryptedData> {
    return this.encryptProxyCredentials(data as DecryptedCredentials, expertId, keyId);
  }

  /**
   * Decrypt any sensitive data with expert context
   */
  async decryptSensitiveData(encryptedData: EncryptedData): Promise<Record<string, any>> {
    return this.decryptProxyCredentials(encryptedData) as Record<string, any>;
  }

  /**
   * Validate proxy credentials structure
   */
  private validateCredentials(credentials: DecryptedCredentials): void {
    const required = ['host', 'port', 'username', 'password', 'protocol'];
    const missing = required.filter(field => !(field in credentials));
    
    if (missing.length > 0) {
      throw new DecryptionError(
        `Missing required credential fields: ${missing.join(', ')}`,
        'INVALID_CREDENTIALS'
      );
    }

    // Validate port is a number
    if (typeof credentials.port !== 'number' || credentials.port < 1 || credentials.port > 65535) {
      throw new DecryptionError('Invalid port number', 'INVALID_PORT');
    }

    // Validate protocol
    const validProtocols = ['http', 'https', 'socks5', 'socks4'];
    if (!validProtocols.includes(credentials.protocol.toLowerCase())) {
      throw new DecryptionError(
        `Invalid protocol. Must be one of: ${validProtocols.join(', ')}`,
        'INVALID_PROTOCOL'
      );
    }
  }

  /**
   * Health check for encryption service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      // Test encryption/decryption cycle
      const testData = {
        host: 'test.example.com',
        port: 8080,
        username: 'test',
        password: 'test123',
        protocol: 'http'
      };

      const testExpertId = 'health_check_test';
      const encrypted = await this.encryptProxyCredentials(testData, testExpertId);
      const decrypted = await this.decryptProxyCredentials(encrypted);

      // Verify data integrity
      const isDataIntact = JSON.stringify(testData) === JSON.stringify(decrypted);

      return {
        status: isDataIntact ? 'healthy' : 'degraded',
        details: {
          encryptionTest: isDataIntact,
          algorithm: ALGORITHM,
          keyLength: KEY_LENGTH,
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

  /**
   * Get encryption service metrics
   */
  getMetrics(): {
    activeKeys: number;
    algorithm: string;
    keyLength: number;
    serviceStatus: string;
  } {
    return {
      activeKeys: this.keyManager['keys'].size,
      algorithm: ALGORITHM,
      keyLength: KEY_LENGTH,
      serviceStatus: 'operational'
    };
  }
}

// Singleton instance
let encryptionServiceInstance: EncryptionService | null = null;

/**
 * Get singleton encryption service instance
 */
export function getEncryptionService(): EncryptionService {
  if (!encryptionServiceInstance) {
    encryptionServiceInstance = new EncryptionService();
  }
  return encryptionServiceInstance;
}

/**
 * Utility function to encrypt proxy credentials
 */
export async function encryptProxyCredentials(
  credentials: DecryptedCredentials,
  expertId: string
): Promise<EncryptedData> {
  const service = getEncryptionService();
  return service.encryptProxyCredentials(credentials, expertId);
}

/**
 * Utility function to decrypt proxy credentials
 */
export async function decryptProxyCredentials(
  encryptedData: EncryptedData
): Promise<DecryptedCredentials> {
  const service = getEncryptionService();
  return service.decryptProxyCredentials(encryptedData);
}