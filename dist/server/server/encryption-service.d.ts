export interface EncryptedData {
    encryptedData: string;
    iv: string;
    tag: string;
    keyId: string;
}
export interface DecryptedCredentials {
    host: string;
    port: number;
    username: string;
    password: string;
    protocol: string;
    metadata?: Record<string, any>;
}
export declare class EncryptionError extends Error {
    code?: string | undefined;
    constructor(message: string, code?: string | undefined);
}
export declare class DecryptionError extends Error {
    code?: string | undefined;
    constructor(message: string, code?: string | undefined);
}
export declare class KeyManagementError extends Error {
    code?: string | undefined;
    constructor(message: string, code?: string | undefined);
}
export declare class EncryptionService {
    private keyManager;
    constructor();
    /**
     * Encrypt proxy credentials for specific expert
     */
    encryptProxyCredentials(credentials: DecryptedCredentials, expertId: string, keyId?: string): Promise<EncryptedData>;
    /**
     * Decrypt proxy credentials for specific expert
     */
    decryptProxyCredentials(encryptedData: EncryptedData): Promise<DecryptedCredentials>;
    /**
     * Re-encrypt credentials with new key (for key rotation)
     */
    reencryptCredentials(encryptedData: EncryptedData, expertId: string): Promise<EncryptedData>;
    /**
     * Securely generate new expert encryption key
     */
    generateExpertEncryptionKey(expertId: string): string;
    /**
     * Validate key accessibility for expert
     */
    validateExpertKey(keyId: string): boolean;
    /**
     * Rotate encryption key for expert
     */
    rotateExpertKey(expertId: string, currentKeyId?: string): string;
    /**
     * Encrypt any sensitive data with expert context
     */
    encryptSensitiveData(data: Record<string, any>, expertId: string, keyId?: string): Promise<EncryptedData>;
    /**
     * Decrypt any sensitive data with expert context
     */
    decryptSensitiveData(encryptedData: EncryptedData): Promise<Record<string, any>>;
    /**
     * Validate proxy credentials structure
     */
    private validateCredentials;
    /**
     * Health check for encryption service
     */
    healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        details: Record<string, any>;
    }>;
    /**
     * Get encryption service metrics
     */
    getMetrics(): {
        activeKeys: number;
        algorithm: string;
        keyLength: number;
        serviceStatus: string;
    };
}
/**
 * Get singleton encryption service instance
 */
export declare function getEncryptionService(): EncryptionService;
/**
 * Utility function to encrypt proxy credentials
 */
export declare function encryptProxyCredentials(credentials: DecryptedCredentials, expertId: string): Promise<EncryptedData>;
/**
 * Utility function to decrypt proxy credentials
 */
export declare function decryptProxyCredentials(encryptedData: EncryptedData): Promise<DecryptedCredentials>;
//# sourceMappingURL=encryption-service.d.ts.map