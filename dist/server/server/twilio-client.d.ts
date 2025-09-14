export interface PhoneNumberProvisionRequest {
    expertId: string;
    phoneNumberType?: 'local' | 'mobile' | 'toll-free';
    areaCode?: string;
    friendlyName?: string;
}
export interface PhoneNumberProvisionResult {
    phoneNumberId: string;
    twilioPhoneNumber: string;
    twilioPhoneSid: string;
    monthlyCostUsd: number;
    capabilities: Record<string, any>;
    status: 'provisioned' | 'failed';
    error?: string;
}
export interface SMSVerificationSessionRequest {
    expertId: string;
    platformType: 'medium' | 'reddit' | 'quora' | 'facebook' | 'linkedin';
    platformAction: 'signup' | 'login' | 'phone_verification' | '2fa_setup';
    expectedCodePattern?: '4-digit' | '6-digit' | '8-digit' | 'alphanumeric';
    sessionNotes?: string;
}
export interface SMSVerificationSessionResult {
    sessionId: string;
    phoneNumber: string;
    sessionStatus: string;
    webhookUrl: string;
    expectedCodePattern: string;
    expiresAt: Date;
}
export interface VerificationCodeResult {
    codeId: string;
    verificationCode: string;
    codeType: string;
    platformType: string;
    extractedAt: Date;
    isValid: boolean;
    expiresAt?: Date;
    validationScore?: number;
}
export interface WebhookSMSEvent {
    MessageSid: string;
    From: string;
    To: string;
    Body: string;
    MessageStatus: string;
    EventType: string;
}
export declare class TwilioClientError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
export declare class PhoneProvisioningError extends TwilioClientError {
    constructor(message: string, details?: any);
}
export declare class SMSProcessingError extends TwilioClientError {
    constructor(message: string, details?: any);
}
export declare class VerificationSessionError extends TwilioClientError {
    constructor(message: string, details?: any);
}
/**
 * Comprehensive Twilio SMS Automation Client
 * Handles Philippines phone number provisioning, SMS verification automation,
 * and real-time verification code extraction for expert platform authentication
 */
export declare class TwilioSMSClient {
    private twilioClient;
    private encryptionService;
    private config;
    private static readonly PHILIPPINES_COUNTRY_CODE;
    private static readonly MAX_PHONE_NUMBERS_PER_EXPERT;
    private static readonly ESTIMATED_MONTHLY_COST_PER_NUMBER;
    private static readonly TOTAL_MONTHLY_BUDGET;
    private static readonly PLATFORM_CODE_PATTERNS;
    constructor();
    private loadTwilioConfig;
    /**
     * Provision Philippines phone number for expert
     */
    provisionPhilippinesPhoneNumber(request: PhoneNumberProvisionRequest): Promise<PhoneNumberProvisionResult>;
    /**
     * Create SMS verification session for platform authentication
     */
    createVerificationSession(request: SMSVerificationSessionRequest): Promise<SMSVerificationSessionResult>;
    /**
     * Process incoming SMS webhook and extract verification codes
     */
    processSMSWebhook(webhookData: WebhookSMSEvent): Promise<VerificationCodeResult | null>;
    /**
     * Enhanced verification code extraction with platform-specific patterns and confidence scoring
     */
    private extractVerificationCode;
    /**
     * Get active verification codes for expert dashboard
     */
    getActiveVerificationCodes(expertId: string): Promise<VerificationCodeResult[]>;
    /**
     * Validate budget constraints for phone number provisioning
     */
    private validateBudgetConstraints;
    /**
     * Health check for Twilio service
     */
    healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'failed';
        accountInfo: any;
        phoneNumberCount: number;
        activeSessionCount: number;
    }>;
}
export declare function createTwilioSMSClient(): TwilioSMSClient;
export declare function createTwilioSMSClientInstance(): TwilioSMSClient;
//# sourceMappingURL=twilio-client.d.ts.map