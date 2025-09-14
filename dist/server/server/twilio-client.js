"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioSMSClient = exports.VerificationSessionError = exports.SMSProcessingError = exports.PhoneProvisioningError = exports.TwilioClientError = void 0;
exports.createTwilioSMSClient = createTwilioSMSClient;
exports.createTwilioSMSClientInstance = createTwilioSMSClientInstance;
const twilio_1 = __importDefault(require("twilio"));
const index_1 = require("./db/index");
const schema_1 = require("../shared/schema");
const encryption_service_1 = require("./encryption-service");
const drizzle_orm_1 = require("drizzle-orm");
const winston_1 = __importDefault(require("winston"));
// Import real-time dashboard delivery
let deliverVerificationCodeToExpert = null;
// Lazy import to avoid circular dependency
async function loadDashboardDelivery() {
    if (!deliverVerificationCodeToExpert) {
        const dashboardModule = await Promise.resolve().then(() => __importStar(require('./routes/dashboard')));
        deliverVerificationCodeToExpert = dashboardModule.deliverVerificationCodeToExpert;
    }
    return deliverVerificationCodeToExpert;
}
// Initialize logger
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    defaultMeta: { service: 'twilio-client' },
    transports: [new winston_1.default.transports.Console()]
});
// Error classes
class TwilioClientError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'TwilioClientError';
    }
}
exports.TwilioClientError = TwilioClientError;
class PhoneProvisioningError extends TwilioClientError {
    constructor(message, details) {
        super(message, 'PHONE_PROVISIONING_ERROR', details);
    }
}
exports.PhoneProvisioningError = PhoneProvisioningError;
class SMSProcessingError extends TwilioClientError {
    constructor(message, details) {
        super(message, 'SMS_PROCESSING_ERROR', details);
    }
}
exports.SMSProcessingError = SMSProcessingError;
class VerificationSessionError extends TwilioClientError {
    constructor(message, details) {
        super(message, 'VERIFICATION_SESSION_ERROR', details);
    }
}
exports.VerificationSessionError = VerificationSessionError;
/**
 * Comprehensive Twilio SMS Automation Client
 * Handles Philippines phone number provisioning, SMS verification automation,
 * and real-time verification code extraction for expert platform authentication
 */
class TwilioSMSClient {
    constructor() {
        this.encryptionService = (0, encryption_service_1.getEncryptionService)();
        this.config = this.loadTwilioConfig();
        this.twilioClient = (0, twilio_1.default)(this.config.accountSid, this.config.authToken);
        logger.info('🔧 Twilio SMS client initialized', {
            accountSid: this.config.accountSid.substring(0, 10) + '...',
            phoneNumber: this.config.phoneNumber.substring(0, 4) + '***' + this.config.phoneNumber.slice(-4)
        });
    }
    loadTwilioConfig() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
        if (!accountSid || !authToken || !phoneNumber) {
            throw new TwilioClientError('Missing required Twilio environment variables', 'MISSING_CREDENTIALS', { required: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'] });
        }
        return { accountSid, authToken, phoneNumber };
    }
    /**
     * Provision Philippines phone number for expert
     */
    async provisionPhilippinesPhoneNumber(request) {
        try {
            logger.info('📱 Provisioning Philippines phone number', { expertId: request.expertId });
            // Check if expert already has a phone number
            const existingPhoneNumbers = await index_1.db
                .select()
                .from(schema_1.expertPhoneNumbers)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.expertPhoneNumbers.personaId, request.expertId), (0, drizzle_orm_1.eq)(schema_1.expertPhoneNumbers.assignmentStatus, 'assigned')));
            if (existingPhoneNumbers.length >= TwilioSMSClient.MAX_PHONE_NUMBERS_PER_EXPERT) {
                throw new PhoneProvisioningError(`Expert ${request.expertId} already has maximum phone numbers (${TwilioSMSClient.MAX_PHONE_NUMBERS_PER_EXPERT})`);
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
            const phoneNumberRecord = await index_1.db
                .insert(schema_1.expertPhoneNumbers)
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
                phoneNumber: purchasedNumber.phoneNumber.substring(0, 4) + '***' + purchasedNumber.phoneNumber.slice(-4),
                phoneNumberId: phoneNumberRecord[0].id
            });
            return {
                phoneNumberId: phoneNumberRecord[0].id,
                twilioPhoneNumber: purchasedNumber.phoneNumber,
                twilioPhoneSid: purchasedNumber.sid,
                monthlyCostUsd: TwilioSMSClient.ESTIMATED_MONTHLY_COST_PER_NUMBER,
                capabilities: phoneNumberRecord[0].capabilities,
                status: 'provisioned'
            };
        }
        catch (error) {
            logger.error('❌ Phone number provisioning failed', {
                expertId: request.expertId,
                error: error.message
            });
            if (error instanceof PhoneProvisioningError) {
                throw error;
            }
            throw new PhoneProvisioningError(`Failed to provision phone number: ${error.message}`, { originalError: error.message });
        }
    }
    /**
     * Create SMS verification session for platform authentication
     */
    async createVerificationSession(request) {
        try {
            logger.info('🔐 Creating SMS verification session', {
                expertId: request.expertId,
                platformType: request.platformType
            });
            // Get expert's phone number
            const phoneNumber = await index_1.db
                .select()
                .from(schema_1.expertPhoneNumbers)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.expertPhoneNumbers.personaId, request.expertId), (0, drizzle_orm_1.eq)(schema_1.expertPhoneNumbers.assignmentStatus, 'assigned'), (0, drizzle_orm_1.eq)(schema_1.expertPhoneNumbers.phoneNumberStatus, 'active')))
                .limit(1);
            if (phoneNumber.length === 0) {
                throw new VerificationSessionError(`No active phone number found for expert ${request.expertId}`);
            }
            // Create verification session
            const sessionExpiry = new Date();
            sessionExpiry.setMinutes(sessionExpiry.getMinutes() + 30); // 30 minute expiry
            const session = await index_1.db
                .insert(schema_1.smsVerificationSessions)
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
                phoneNumber: phoneNumber[0].twilioPhoneNumber.substring(0, 4) + '***' + phoneNumber[0].twilioPhoneNumber.slice(-4)
            });
            return {
                sessionId: session[0].id,
                phoneNumber: phoneNumber[0].twilioPhoneNumber,
                sessionStatus: session[0].sessionStatus || 'active',
                webhookUrl,
                expectedCodePattern: session[0].expectedCodePattern || '6-digit',
                expiresAt: sessionExpiry
            };
        }
        catch (error) {
            logger.error('❌ Verification session creation failed', {
                expertId: request.expertId,
                error: error.message
            });
            if (error instanceof VerificationSessionError) {
                throw error;
            }
            throw new VerificationSessionError(`Failed to create verification session: ${error.message}`, { originalError: error.message });
        }
    }
    /**
     * Process incoming SMS webhook and extract verification codes
     */
    async processSMSWebhook(webhookData) {
        try {
            logger.info('📨 Processing incoming SMS webhook', {
                messageSid: webhookData.MessageSid.substring(0, 10) + '...',
                fromNumber: webhookData.From.substring(0, 4) + '***' + webhookData.From.slice(-4),
                toNumber: webhookData.To.substring(0, 4) + '***' + webhookData.To.slice(-4)
            });
            // Find phone number record
            const phoneNumber = await index_1.db
                .select()
                .from(schema_1.expertPhoneNumbers)
                .where((0, drizzle_orm_1.eq)(schema_1.expertPhoneNumbers.twilioPhoneNumber, webhookData.To))
                .limit(1);
            if (phoneNumber.length === 0) {
                logger.warn('⚠️ SMS received for unknown phone number', {
                    phoneNumber: webhookData.To.substring(0, 4) + '***' + webhookData.To.slice(-4)
                });
                return null;
            }
            // Enhanced session lookup: Find active verification session with expert context
            const activeSession = await index_1.db
                .select({
                id: schema_1.smsVerificationSessions.id,
                personaId: schema_1.smsVerificationSessions.personaId,
                platformType: schema_1.smsVerificationSessions.platformType,
                platformAction: schema_1.smsVerificationSessions.platformAction,
                sessionStatus: schema_1.smsVerificationSessions.sessionStatus,
                expectedCodePattern: schema_1.smsVerificationSessions.expectedCodePattern,
                sessionExpiredAt: schema_1.smsVerificationSessions.sessionExpiredAt,
                attemptsRemaining: schema_1.smsVerificationSessions.attemptsRemaining,
                createdAt: schema_1.smsVerificationSessions.createdAt
            })
                .from(schema_1.smsVerificationSessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.smsVerificationSessions.phoneNumberId, phoneNumber[0].id), (0, drizzle_orm_1.eq)(schema_1.smsVerificationSessions.sessionStatus, 'active'), (0, drizzle_orm_1.gt)(schema_1.smsVerificationSessions.sessionExpiredAt, new Date()) // Not expired
            ))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.smsVerificationSessions.createdAt))
                .limit(1);
            // If no active session found, log for debugging
            if (activeSession.length === 0) {
                logger.warn('⚠️ No active verification session found for SMS', {
                    phoneNumber: webhookData.To.substring(0, 4) + '***' + webhookData.To.slice(-4),
                    messageSid: webhookData.MessageSid.substring(0, 10) + '...'
                });
            }
            else {
                logger.info('✅ Found active verification session', {
                    sessionId: activeSession[0].id.substring(0, 8) + '...',
                    platformType: activeSession[0].platformType,
                    platformAction: activeSession[0].platformAction,
                    attemptsRemaining: activeSession[0].attemptsRemaining
                });
            }
            // Store SMS message
            const smsMessage = await index_1.db
                .insert(schema_1.smsMessages)
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
            // Extract verification code with proper session context
            const sessionContext = activeSession.length > 0 ? activeSession[0] : null;
            const verificationCode = await this.extractVerificationCode(webhookData.Body, sessionContext, smsMessage[0]);
            if (verificationCode) {
                // Update message processing status
                await index_1.db
                    .update(schema_1.smsMessages)
                    .set({
                    verificationCode: verificationCode.verificationCode,
                    codeConfidence: '1.00',
                    codePattern: verificationCode.codeType,
                    processingStatus: 'processed',
                    deliveredToDashboard: false,
                    processedAt: new Date()
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.smsMessages.id, smsMessage[0].id));
                logger.info('🎯 Verification code extracted successfully', {
                    codeLength: verificationCode.verificationCode.length,
                    codeType: verificationCode.codeType,
                    platform: verificationCode.platformType,
                    codePattern: verificationCode.verificationCode.replace(/\d/g, 'X').replace(/[A-Z]/g, 'Y')
                });
                // Real-time delivery to expert dashboard
                if (sessionContext?.personaId) {
                    try {
                        const deliveryFunction = await loadDashboardDelivery();
                        await deliveryFunction(sessionContext.personaId, {
                            codeId: verificationCode.codeId,
                            verificationCode: verificationCode.verificationCode,
                            codeType: verificationCode.codeType,
                            platformType: verificationCode.platformType,
                            extractedAt: verificationCode.extractedAt,
                            expiresAt: verificationCode.expiresAt,
                            isValid: verificationCode.isValid
                        });
                    }
                    catch (deliveryError) {
                        logger.warn('⚠️ Failed to deliver verification code to dashboard', {
                            expertId: sessionContext.personaId.substring(0, 8) + '...',
                            error: deliveryError.message
                        });
                    }
                }
                return verificationCode;
            }
            // Update message as processed but no code found
            await index_1.db
                .update(schema_1.smsMessages)
                .set({
                processingStatus: 'processed',
                processingNotes: 'No verification code detected',
                processedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.smsMessages.id, smsMessage[0].id));
            logger.info('ℹ️ SMS processed but no verification code found', {
                messageLength: webhookData.Body.length,
                hasNumbers: /\d/.test(webhookData.Body),
                messagePattern: webhookData.Body.replace(/\d/g, 'X').replace(/[A-Za-z]/g, 'Y').substring(0, 20) + '...'
            });
            return null;
        }
        catch (error) {
            logger.error('❌ SMS webhook processing failed', {
                messageSid: webhookData.MessageSid.substring(0, 10) + '...',
                error: error.message
            });
            throw new SMSProcessingError(`Failed to process SMS webhook: ${error.message}`, { webhookData, originalError: error.message });
        }
    }
    /**
     * Enhanced verification code extraction with platform-specific patterns and confidence scoring
     */
    async extractVerificationCode(messageBody, session, smsMessage) {
        try {
            const platformType = session?.platformType || 'generic';
            // Get platform-specific patterns or fall back to generic
            const platformPatterns = TwilioSMSClient.PLATFORM_CODE_PATTERNS[platformType]
                || TwilioSMSClient.PLATFORM_CODE_PATTERNS.generic;
            let bestMatch = null;
            // Try platform-specific patterns first
            for (let i = 0; i < platformPatterns.length; i++) {
                const pattern = platformPatterns[i];
                const match = messageBody.match(pattern);
                if (match && match[1]) {
                    const code = match[1].trim();
                    // Validate code length (4-8 characters)
                    if (code.length >= 4 && code.length <= 8) {
                        let confidence = 0.7 + (i === 0 ? 0.2 : 0.0); // Higher confidence for first pattern
                        let codeType = 'unknown';
                        // Determine code type and adjust confidence
                        if (/^\d+$/.test(code)) {
                            codeType = 'numeric';
                            confidence += 0.1; // Numeric codes are more common
                        }
                        else if (/^[A-Z0-9]+$/.test(code.toUpperCase())) {
                            codeType = 'alphanumeric';
                            confidence += 0.05;
                        }
                        else if (/^[a-zA-Z0-9]+$/.test(code)) {
                            codeType = 'mixed_case';
                            confidence += 0.03;
                        }
                        // Context-based confidence boost
                        if (messageBody.toLowerCase().includes('verification') ||
                            messageBody.toLowerCase().includes('verify') ||
                            messageBody.toLowerCase().includes('authenticate')) {
                            confidence += 0.05;
                        }
                        // Length-based confidence (6-digit is most common)
                        if (code.length === 6)
                            confidence += 0.05;
                        else if (code.length === 4 || code.length === 8)
                            confidence += 0.03;
                        const patternType = i < 2 ? `${platformType}_primary` : `${platformType}_fallback`;
                        if (!bestMatch || confidence > bestMatch.confidence) {
                            bestMatch = {
                                code: code.toUpperCase(),
                                confidence: Math.min(confidence, 0.99), // Cap at 99%
                                type: codeType,
                                pattern: patternType
                            };
                        }
                    }
                }
            }
            // If no good match found, return null
            if (!bestMatch || bestMatch.confidence <= 0.6) {
                return null;
            }
            // Store verification code in database
            const codeExpiry = new Date();
            codeExpiry.setMinutes(codeExpiry.getMinutes() + 10); // 10 minute expiry
            const verificationCodeRecord = await index_1.db
                .insert(schema_1.verificationCodes)
                .values({
                sessionId: session?.id || null,
                messageId: smsMessage.id,
                verificationCode: bestMatch.code,
                codeType: bestMatch.type,
                codeLength: bestMatch.code.length,
                isValid: true,
                validationScore: bestMatch.confidence.toFixed(2),
                platformType: session?.platformType || 'unknown',
                codeUsageType: session?.platformAction || 'unknown',
                codeStatus: 'active',
                expiresAt: codeExpiry,
                sentToDashboard: false
            })
                .returning();
            return {
                codeId: verificationCodeRecord[0].id,
                verificationCode: bestMatch.code,
                codeType: bestMatch.type,
                platformType: session?.platformType || 'unknown',
                extractedAt: new Date(),
                isValid: true,
                expiresAt: codeExpiry
            };
        }
        catch (error) {
            logger.error('❌ Verification code extraction failed', { error: error.message });
            throw error;
        }
    }
    /**
     * Get active verification codes for expert dashboard
     */
    async getActiveVerificationCodes(expertId) {
        try {
            const phoneNumbers = await index_1.db
                .select()
                .from(schema_1.expertPhoneNumbers)
                .where((0, drizzle_orm_1.eq)(schema_1.expertPhoneNumbers.personaId, expertId));
            if (phoneNumbers.length === 0) {
                return [];
            }
            const phoneNumberIds = phoneNumbers.map(p => p.id);
            const activeCodes = await index_1.db
                .select({
                id: schema_1.verificationCodes.id,
                verificationCode: schema_1.verificationCodes.verificationCode,
                codeType: schema_1.verificationCodes.codeType,
                platformType: schema_1.verificationCodes.platformType,
                extractedAt: schema_1.verificationCodes.extractedAt,
                isValid: schema_1.verificationCodes.isValid,
                expiresAt: schema_1.verificationCodes.expiresAt,
                sessionId: schema_1.verificationCodes.sessionId
            })
                .from(schema_1.verificationCodes)
                .innerJoin(schema_1.smsVerificationSessions, (0, drizzle_orm_1.eq)(schema_1.verificationCodes.sessionId, schema_1.smsVerificationSessions.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.verificationCodes.codeStatus, 'active'), (0, drizzle_orm_1.eq)(schema_1.verificationCodes.isValid, true), (0, drizzle_orm_1.gt)(schema_1.verificationCodes.expiresAt, new Date())))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.verificationCodes.extractedAt));
            return activeCodes.map(code => ({
                codeId: code.id,
                verificationCode: code.verificationCode || '',
                codeType: code.codeType || 'unknown',
                platformType: code.platformType || 'unknown',
                extractedAt: code.extractedAt || new Date(),
                isValid: code.isValid || false,
                expiresAt: code.expiresAt || undefined
            }));
        }
        catch (error) {
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
    async validateBudgetConstraints() {
        const currentPhoneNumbers = await index_1.db
            .select()
            .from(schema_1.expertPhoneNumbers)
            .where((0, drizzle_orm_1.eq)(schema_1.expertPhoneNumbers.assignmentStatus, 'assigned'));
        const totalMonthlyCost = currentPhoneNumbers.reduce((total, phone) => {
            return total + parseFloat(phone.monthlyCostUsd?.toString() || '0');
        }, 0);
        if (totalMonthlyCost + TwilioSMSClient.ESTIMATED_MONTHLY_COST_PER_NUMBER > TwilioSMSClient.TOTAL_MONTHLY_BUDGET) {
            throw new PhoneProvisioningError(`Adding phone number would exceed budget. Current: $${totalMonthlyCost.toFixed(2)}, Budget: $${TwilioSMSClient.TOTAL_MONTHLY_BUDGET.toFixed(2)}`);
        }
    }
    /**
     * Health check for Twilio service
     */
    async healthCheck() {
        try {
            const account = await this.twilioClient.api.v2010.accounts(this.config.accountSid).fetch();
            const phoneNumberCount = await index_1.db
                .select()
                .from(schema_1.expertPhoneNumbers)
                .where((0, drizzle_orm_1.eq)(schema_1.expertPhoneNumbers.assignmentStatus, 'assigned'));
            const activeSessionCount = await index_1.db
                .select()
                .from(schema_1.smsVerificationSessions)
                .where((0, drizzle_orm_1.eq)(schema_1.smsVerificationSessions.sessionStatus, 'active'));
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
        }
        catch (error) {
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
exports.TwilioSMSClient = TwilioSMSClient;
// Budget constraints (Philippines focus)
TwilioSMSClient.PHILIPPINES_COUNTRY_CODE = '+63';
TwilioSMSClient.MAX_PHONE_NUMBERS_PER_EXPERT = 1;
TwilioSMSClient.ESTIMATED_MONTHLY_COST_PER_NUMBER = 1.00; // USD
TwilioSMSClient.TOTAL_MONTHLY_BUDGET = 15.00; // USD for Twilio
// Enhanced verification code patterns for full 4-8 digit + alphanumeric support
TwilioSMSClient.PLATFORM_CODE_PATTERNS = {
    medium: [
        /(?:verification code|verify|code)[\s:\-]*(\d{4,8})(?![0-9])/i,
        /(?:verification code|verify|code)[\s:\-]*([A-Z0-9]{4,8})(?![A-Z0-9])/i,
        /\b(\d{4,8})\b.*(?:code|verification|verify)/i
    ],
    reddit: [
        /(?:verification code|verify|code)[\s:\-]*(\d{4,8})(?![0-9])/i,
        /(?:verification code|verify|code)[\s:\-]*([A-Z0-9]{4,8})(?![A-Z0-9])/i,
        /\b(\d{4,8})\b.*(?:code|verification|verify)/i
    ],
    quora: [
        /(?:verification|verify|code)[\s:\-]*(\d{4,8})(?![0-9])/i,
        /(?:verification|verify|code)[\s:\-]*([A-Z0-9]{4,8})(?![A-Z0-9])/i,
        /\b(\d{4,8})\b.*(?:code|verification|verify)/i
    ],
    facebook: [
        /(?:verification code|verify|code|FB)[\s:\-]*(\d{4,8})(?![0-9])/i,
        /(?:verification code|verify|code|FB)[\s:\-]*([A-Z0-9]{4,8})(?![A-Z0-9])/i,
        /\b(\d{4,8})\b.*(?:code|verification|verify)/i
    ],
    linkedin: [
        /(?:verification code|verify|code|LinkedIn)[\s:\-]*(\d{4,8})(?![0-9])/i,
        /(?:verification code|verify|code|LinkedIn)[\s:\-]*([A-Z0-9]{4,8})(?![A-Z0-9])/i,
        /\b(\d{4,8})\b.*(?:code|verification|verify)/i
    ],
    // Enhanced generic fallback patterns with confidence scoring
    generic: [
        /(?:code|verification|verify)[\s:\-]*(\d{4,8})(?![0-9])/i,
        /(?:code|verification|verify)[\s:\-]*([A-Z0-9]{4,8})(?![A-Z0-9])/i,
        /your\s+(?:code|pin|otp)[\s:\-]*([A-Z0-9]{4,8})/i,
        /authentication\s+code[\s:\-]*([A-Z0-9]{4,8})/i,
        /\b(\d{4,8})\b.*(?:code|verification|verify)/i,
        /verification.*?(\d{4,8})(?![0-9])/i
    ]
};
// Factory function for creating Twilio SMS client
function createTwilioSMSClient() {
    return new TwilioSMSClient();
}
// Export factory function for on-demand creation
function createTwilioSMSClientInstance() {
    return createTwilioSMSClient();
}
//# sourceMappingURL=twilio-client.js.map