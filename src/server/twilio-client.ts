import twilio from 'twilio';
import { db } from './db/index';
import { expertPhoneNumbers, smsVerificationSessions, smsMessages, verificationCodes, expertPersonas } from '../shared/schema';
import { getEncryptionService, EncryptedData } from './encryption-service';
import { eq, and, desc, gt } from 'drizzle-orm';
import winston from 'winston';

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'twilio-client' },
  transports: [new winston.transports.Console()]
});

// Twilio Configuration
interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

// Types for Twilio operations
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

// Error classes
export class TwilioClientError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'TwilioClientError';
  }
}

export class PhoneProvisioningError extends TwilioClientError {
  constructor(message: string, details?: any) {
    super(message, 'PHONE_PROVISIONING_ERROR', details);
  }
}

export class SMSProcessingError extends TwilioClientError {
  constructor(message: string, details?: any) {
    super(message, 'SMS_PROCESSING_ERROR', details);
  }
}

export class VerificationSessionError extends TwilioClientError {
  constructor(message: string, details?: any) {
    super(message, 'VERIFICATION_SESSION_ERROR', details);
  }
}

/**
 * Comprehensive Twilio SMS Automation Client
 * Handles Philippines phone number provisioning, SMS verification automation,
 * and real-time verification code extraction for expert platform authentication
 */
export class TwilioSMSClient {
  private twilioClient: twilio.Twilio;
  private encryptionService = getEncryptionService();
  private config: TwilioConfig;

  // Budget constraints (Philippines focus)
  private static readonly PHILIPPINES_COUNTRY_CODE = '+63';
  private static readonly MAX_PHONE_NUMBERS_PER_EXPERT = 1;
  private static readonly ESTIMATED_MONTHLY_COST_PER_NUMBER = 1.00; // USD
  private static readonly TOTAL_MONTHLY_BUDGET = 15.00; // USD for Twilio
  
  // Verification code patterns for different platforms
  private static readonly PLATFORM_CODE_PATTERNS = {
    medium: /\b\d{6}\b/g,
    reddit: /\b\d{6}\b/g,
    quora: /\b\d{4,6}\b/g,
    facebook: /\b\d{6}\b/g,
    linkedin: /\b\d{6}\b/g
  };

  constructor() {
    this.config = this.loadTwilioConfig();
    this.twilioClient = twilio(this.config.accountSid, this.config.authToken);
    
    logger.info('🔧 Twilio SMS client initialized', {
      accountSid: this.config.accountSid.substring(0, 10) + '...',
      phoneNumber: this.config.phoneNumber
    });
  }

  private loadTwilioConfig(): TwilioConfig {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !phoneNumber) {
      throw new TwilioClientError(
        'Missing required Twilio environment variables',
        'MISSING_CREDENTIALS',
        { required: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'] }
      );
    }

    return { accountSid, authToken, phoneNumber };
  }

  /**
   * Provision Philippines phone number for expert
   */
  async provisionPhilippinesPhoneNumber(request: PhoneNumberProvisionRequest): Promise<PhoneNumberProvisionResult> {
    try {
      logger.info('📱 Provisioning Philippines phone number', { expertId: request.expertId });

      // Check if expert already has a phone number
      const existingPhoneNumbers = await db
        .select()
        .from(expertPhoneNumbers)
        .where(and(
          eq(expertPhoneNumbers.personaId, request.expertId),
          eq(expertPhoneNumbers.assignmentStatus, 'assigned')
        ));

      if (existingPhoneNumbers.length >= TwilioSMSClient.MAX_PHONE_NUMBERS_PER_EXPERT) {
        throw new PhoneProvisioningError(
          `Expert ${request.expertId} already has maximum phone numbers (${TwilioSMSClient.MAX_PHONE_NUMBERS_PER_EXPERT})`
        );
      }

      // Check budget constraints
      await this.validateBudgetConstraints();

      // Search for available Philippines phone numbers
      const availableNumbers = await this.twilioClient.availablePhoneNumbers('PH')
        .local
        .list({
          smsEnabled: true,
          voiceEnabled: true,
          limit: 10,
          areaCode: request.areaCode ? parseInt(request.areaCode) : undefined
        });

      if (availableNumbers.length === 0) {
        throw new PhoneProvisioningError('No Philippines phone numbers available');
      }

      // Purchase the first available number
      const selectedNumber = availableNumbers[0];
      const purchasedNumber = await this.twilioClient.incomingPhoneNumbers.create({
        phoneNumber: selectedNumber.phoneNumber,
        friendlyName: request.friendlyName || `Expert ${request.expertId} - PH`,
        smsUrl: `${process.env.REPLIT_DOMAIN || 'http://localhost:3001'}/api/webhooks/sms`,
        smsMethod: 'POST',
        voiceUrl: `${process.env.REPLIT_DOMAIN || 'http://localhost:3001'}/api/webhooks/voice`,
        voiceMethod: 'POST'
      });

      // Generate encryption key for phone number credentials
      const encryptionKeyId = this.encryptionService.generateExpertEncryptionKey(request.expertId);

      // Store phone number in database
      const phoneNumberRecord = await db
        .insert(expertPhoneNumbers)
        .values({
          personaId: request.expertId,
          twilioPhoneNumber: purchasedNumber.phoneNumber,
          twilioPhoneSid: purchasedNumber.sid,
          phoneNumberStatus: 'active',
          countryCode: 'PH',
          friendlyName: purchasedNumber.friendlyName || '',
          phoneNumberType: request.phoneNumberType || 'local',
          capabilities: {
            voice: purchasedNumber.capabilities.voice,
            sms: purchasedNumber.capabilities.sms,
            mms: purchasedNumber.capabilities.mms
          },
          assignmentStatus: 'assigned',
          monthlyCostUsd: TwilioSMSClient.ESTIMATED_MONTHLY_COST_PER_NUMBER.toFixed(2),
          webhookUrl: `${process.env.REPLIT_DOMAIN || 'http://localhost:3001'}/api/webhooks/sms`,
          verificationEnabled: true,
          encryptionKeyId,
          healthStatus: 'healthy',
          assignedAt: new Date()
        })
        .returning();

      logger.info('✅ Philippines phone number provisioned successfully', {
        expertId: request.expertId,
        phoneNumber: purchasedNumber.phoneNumber,
        phoneNumberId: phoneNumberRecord[0].id
      });

      return {
        phoneNumberId: phoneNumberRecord[0].id,
        twilioPhoneNumber: purchasedNumber.phoneNumber,
        twilioPhoneSid: purchasedNumber.sid,
        monthlyCostUsd: TwilioSMSClient.ESTIMATED_MONTHLY_COST_PER_NUMBER,
        capabilities: phoneNumberRecord[0].capabilities as Record<string, any>,
        status: 'provisioned'
      };

    } catch (error: any) {
      logger.error('❌ Phone number provisioning failed', { 
        expertId: request.expertId, 
        error: error.message 
      });
      
      if (error instanceof PhoneProvisioningError) {
        throw error;
      }
      
      throw new PhoneProvisioningError(
        `Failed to provision phone number: ${error.message}`,
        { originalError: error.message }
      );
    }
  }

  /**
   * Create SMS verification session for platform authentication
   */
  async createVerificationSession(request: SMSVerificationSessionRequest): Promise<SMSVerificationSessionResult> {
    try {
      logger.info('🔐 Creating SMS verification session', { 
        expertId: request.expertId, 
        platformType: request.platformType 
      });

      // Get expert's phone number
      const phoneNumber = await db
        .select()
        .from(expertPhoneNumbers)
        .where(and(
          eq(expertPhoneNumbers.personaId, request.expertId),
          eq(expertPhoneNumbers.assignmentStatus, 'assigned'),
          eq(expertPhoneNumbers.phoneNumberStatus, 'active')
        ))
        .limit(1);

      if (phoneNumber.length === 0) {
        throw new VerificationSessionError(
          `No active phone number found for expert ${request.expertId}`
        );
      }

      // Create verification session
      const sessionExpiry = new Date();
      sessionExpiry.setMinutes(sessionExpiry.getMinutes() + 30); // 30 minute expiry

      const session = await db
        .insert(smsVerificationSessions)
        .values({
          personaId: request.expertId,
          phoneNumberId: phoneNumber[0].id,
          platformType: request.platformType,
          platformAction: request.platformAction,
          sessionStatus: 'active',
          sessionExpiredAt: sessionExpiry,
          expectedCodePattern: request.expectedCodePattern || '6-digit',
          maxRetries: 3,
          attemptsRemaining: 3,
          sessionNotes: request.sessionNotes
        })
        .returning();

      const webhookUrl = `${process.env.REPLIT_DOMAIN || 'http://localhost:3001'}/api/webhooks/sms/${session[0].id}`;

      logger.info('✅ SMS verification session created', {
        sessionId: session[0].id,
        expertId: request.expertId,
        platformType: request.platformType,
        phoneNumber: phoneNumber[0].twilioPhoneNumber
      });

      return {
        sessionId: session[0].id,
        phoneNumber: phoneNumber[0].twilioPhoneNumber,
        sessionStatus: session[0].sessionStatus || 'active',
        webhookUrl,
        expectedCodePattern: session[0].expectedCodePattern || '6-digit',
        expiresAt: sessionExpiry
      };

    } catch (error: any) {
      logger.error('❌ Verification session creation failed', { 
        expertId: request.expertId, 
        error: error.message 
      });
      
      if (error instanceof VerificationSessionError) {
        throw error;
      }
      
      throw new VerificationSessionError(
        `Failed to create verification session: ${error.message}`,
        { originalError: error.message }
      );
    }
  }

  /**
   * Process incoming SMS webhook and extract verification codes
   */
  async processSMSWebhook(webhookData: WebhookSMSEvent): Promise<VerificationCodeResult | null> {
    try {
      logger.info('📨 Processing incoming SMS webhook', {
        messageSid: webhookData.MessageSid,
        from: webhookData.From,
        to: webhookData.To
      });

      // Find phone number record
      const phoneNumber = await db
        .select()
        .from(expertPhoneNumbers)
        .where(eq(expertPhoneNumbers.twilioPhoneNumber, webhookData.To))
        .limit(1);

      if (phoneNumber.length === 0) {
        logger.warn('⚠️ SMS received for unknown phone number', { phoneNumber: webhookData.To });
        return null;
      }

      // Find active verification session
      const activeSession = await db
        .select()
        .from(smsVerificationSessions)
        .where(and(
          eq(smsVerificationSessions.phoneNumberId, phoneNumber[0].id),
          eq(smsVerificationSessions.sessionStatus, 'active')
        ))
        .orderBy(desc(smsVerificationSessions.createdAt))
        .limit(1);

      // Store SMS message
      const smsMessage = await db
        .insert(smsMessages)
        .values({
          sessionId: activeSession.length > 0 ? activeSession[0].id : null,
          phoneNumberId: phoneNumber[0].id,
          twilioMessageSid: webhookData.MessageSid,
          fromPhoneNumber: webhookData.From,
          toPhoneNumber: webhookData.To,
          messageBody: webhookData.Body,
          messageDirection: 'inbound',
          messageStatus: webhookData.MessageStatus,
          processingStatus: 'pending'
        })
        .returning();

      // Extract verification code
      const verificationCode = await this.extractVerificationCode(
        webhookData.Body,
        activeSession.length > 0 ? activeSession[0] : null,
        smsMessage[0]
      );

      if (verificationCode) {
        // Update message processing status
        await db
          .update(smsMessages)
          .set({
            verificationCode: verificationCode.verificationCode,
            codeConfidence: '1.00',
            codePattern: verificationCode.codeType,
            processingStatus: 'processed',
            deliveredToDashboard: false,
            processedAt: new Date()
          })
          .where(eq(smsMessages.id, smsMessage[0].id));

        logger.info('🎯 Verification code extracted successfully', {
          code: verificationCode.verificationCode,
          codeType: verificationCode.codeType,
          platform: verificationCode.platformType
        });

        return verificationCode;
      }

      // Update message as processed but no code found
      await db
        .update(smsMessages)
        .set({
          processingStatus: 'processed',
          processingNotes: 'No verification code detected',
          processedAt: new Date()
        })
        .where(eq(smsMessages.id, smsMessage[0].id));

      logger.info('ℹ️ SMS processed but no verification code found', {
        messageBody: webhookData.Body.substring(0, 50) + '...'
      });

      return null;

    } catch (error: any) {
      logger.error('❌ SMS webhook processing failed', { 
        messageSid: webhookData.MessageSid, 
        error: error.message 
      });
      
      throw new SMSProcessingError(
        `Failed to process SMS webhook: ${error.message}`,
        { webhookData, originalError: error.message }
      );
    }
  }

  /**
   * Extract verification code from SMS message body
   */
  private async extractVerificationCode(
    messageBody: string,
    session: any,
    smsMessage: any
  ): Promise<VerificationCodeResult | null> {
    try {
      // Try different patterns for verification code extraction
      const patterns = [
        /\b\d{4,8}\b/g,  // 4-8 digit codes
        /\b[A-Z0-9]{4,8}\b/g,  // Alphanumeric codes
        /(?:code|verification|verify)[\s:]*([A-Z0-9]{4,8})/gi  // Context-aware extraction
      ];

      let extractedCode: string | null = null;
      let codeType = 'unknown';
      let confidence = 0.5;

      for (const pattern of patterns) {
        const matches = messageBody.match(pattern);
        if (matches && matches.length > 0) {
          extractedCode = matches[0];
          
          // Determine code type
          if (/^\d+$/.test(extractedCode)) {
            codeType = 'numeric';
            confidence = 0.9;
          } else if (/^[A-Z0-9]+$/.test(extractedCode)) {
            codeType = 'alphanumeric';
            confidence = 0.8;
          } else {
            codeType = 'mixed';
            confidence = 0.7;
          }
          
          break;
        }
      }

      if (!extractedCode) {
        return null;
      }

      // Store verification code
      const codeExpiry = new Date();
      codeExpiry.setMinutes(codeExpiry.getMinutes() + 10); // 10 minute expiry

      const verificationCodeRecord = await db
        .insert(verificationCodes)
        .values({
          sessionId: session?.id || null,
          messageId: smsMessage.id,
          verificationCode: extractedCode,
          codeType,
          codeLength: extractedCode.length,
          isValid: true,
          validationScore: confidence.toFixed(2),
          platformType: session?.platformType || 'unknown',
          codeUsageType: session?.platformAction || 'unknown',
          codeStatus: 'active',
          expiresAt: codeExpiry,
          sentToDashboard: false
        })
        .returning();

      return {
        codeId: verificationCodeRecord[0].id,
        verificationCode: extractedCode,
        codeType,
        platformType: session?.platformType || 'unknown',
        extractedAt: new Date(),
        isValid: true,
        expiresAt: codeExpiry
      };

    } catch (error: any) {
      logger.error('❌ Verification code extraction failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get active verification codes for expert dashboard
   */
  async getActiveVerificationCodes(expertId: string): Promise<VerificationCodeResult[]> {
    try {
      const phoneNumbers = await db
        .select()
        .from(expertPhoneNumbers)
        .where(eq(expertPhoneNumbers.personaId, expertId));

      if (phoneNumbers.length === 0) {
        return [];
      }

      const phoneNumberIds = phoneNumbers.map(p => p.id);
      
      const activeCodes = await db
        .select({
          id: verificationCodes.id,
          verificationCode: verificationCodes.verificationCode,
          codeType: verificationCodes.codeType,
          platformType: verificationCodes.platformType,
          extractedAt: verificationCodes.extractedAt,
          isValid: verificationCodes.isValid,
          expiresAt: verificationCodes.expiresAt,
          sessionId: verificationCodes.sessionId
        })
        .from(verificationCodes)
        .innerJoin(smsVerificationSessions, eq(verificationCodes.sessionId, smsVerificationSessions.id))
        .where(and(
          eq(verificationCodes.codeStatus, 'active'),
          eq(verificationCodes.isValid, true),
          gt(verificationCodes.expiresAt, new Date())
        ))
        .orderBy(desc(verificationCodes.extractedAt));

      return activeCodes.map(code => ({
        codeId: code.id,
        verificationCode: code.verificationCode || '',
        codeType: code.codeType || 'unknown',
        platformType: code.platformType || 'unknown',
        extractedAt: code.extractedAt || new Date(),
        isValid: code.isValid || false,
        expiresAt: code.expiresAt || undefined
      }));

    } catch (error: any) {
      logger.error('❌ Failed to get active verification codes', { 
        expertId, 
        error: error.message 
      });
      return [];
    }
  }

  /**
   * Validate budget constraints for phone number provisioning
   */
  private async validateBudgetConstraints(): Promise<void> {
    const currentPhoneNumbers = await db
      .select()
      .from(expertPhoneNumbers)
      .where(eq(expertPhoneNumbers.assignmentStatus, 'assigned'));

    const totalMonthlyCost = currentPhoneNumbers.reduce((total, phone) => {
      return total + parseFloat(phone.monthlyCostUsd?.toString() || '0');
    }, 0);

    if (totalMonthlyCost + TwilioSMSClient.ESTIMATED_MONTHLY_COST_PER_NUMBER > TwilioSMSClient.TOTAL_MONTHLY_BUDGET) {
      throw new PhoneProvisioningError(
        `Adding phone number would exceed budget. Current: $${totalMonthlyCost.toFixed(2)}, Budget: $${TwilioSMSClient.TOTAL_MONTHLY_BUDGET.toFixed(2)}`
      );
    }
  }

  /**
   * Health check for Twilio service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'failed';
    accountInfo: any;
    phoneNumberCount: number;
    activeSessionCount: number;
  }> {
    try {
      const account = await this.twilioClient.api.v2010.accounts(this.config.accountSid).fetch();
      
      const phoneNumberCount = await db
        .select()
        .from(expertPhoneNumbers)
        .where(eq(expertPhoneNumbers.assignmentStatus, 'assigned'));

      const activeSessionCount = await db
        .select()
        .from(smsVerificationSessions)
        .where(eq(smsVerificationSessions.sessionStatus, 'active'));

      return {
        status: 'healthy',
        accountInfo: {
          accountSid: account.sid,
          friendlyName: account.friendlyName,
          status: account.status
        },
        phoneNumberCount: phoneNumberCount.length,
        activeSessionCount: activeSessionCount.length
      };

    } catch (error: any) {
      logger.error('❌ Twilio health check failed', { error: error.message });
      
      return {
        status: 'failed',
        accountInfo: null,
        phoneNumberCount: 0,
        activeSessionCount: 0
      };
    }
  }
}

// Factory function for creating Twilio SMS client
export function createTwilioSMSClient(): TwilioSMSClient {
  return new TwilioSMSClient();
}

// Default instance export
export const twilioSMSClient = createTwilioSMSClient();