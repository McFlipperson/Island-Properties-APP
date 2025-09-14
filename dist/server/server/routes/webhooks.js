"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhooksRouter = void 0;
const express_1 = __importDefault(require("express"));
const twilioSignatureValidation_1 = require("../middleware/twilioSignatureValidation");
const twilio_client_1 = require("../twilio-client");
const index_1 = require("../db/index");
const schema_1 = require("../../shared/schema");
const logger_1 = require("../services/logger");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const router = express_1.default.Router();
exports.webhooksRouter = router;
// Lazy initialize Twilio SMS client to avoid environment issues
let twilioSMSClient = null;
function getTwilioSMSClient() {
    if (!twilioSMSClient) {
        twilioSMSClient = new twilio_client_1.TwilioSMSClient();
    }
    return twilioSMSClient;
}
/**
 * Validation schema for incoming SMS webhooks
 * Reference: https://www.twilio.com/docs/sms/webhooks
 */
const smsWebhookSchema = zod_1.z.object({
    MessageSid: zod_1.z.string().min(1),
    AccountSid: zod_1.z.string().min(1),
    From: zod_1.z.string().min(1),
    To: zod_1.z.string().min(1),
    Body: zod_1.z.string().default(''),
    MessageStatus: zod_1.z.enum(['queued', 'sending', 'sent', 'failed', 'delivered', 'undelivered', 'receiving', 'received']),
    MessageDirection: zod_1.z.enum(['inbound', 'outbound-api', 'outbound-call', 'outbound-reply']).optional(),
    NumMedia: zod_1.z.string().optional(),
    SmsStatus: zod_1.z.string().optional(),
    ApiVersion: zod_1.z.string().optional(),
    SmsSid: zod_1.z.string().optional(),
    SmsMessageSid: zod_1.z.string().optional(),
    NumSegments: zod_1.z.string().optional(),
    ReferralNumMedia: zod_1.z.string().optional(),
    Price: zod_1.z.string().optional(),
    PriceUnit: zod_1.z.string().optional(),
    ErrorCode: zod_1.z.string().optional(),
    ErrorMessage: zod_1.z.string().optional()
});
/**
 * Helper function to get safe headers for logging
 */
function getSecureHeaders(req) {
    const safeHeaders = {};
    const allowedHeaders = ['content-type', 'user-agent', 'x-twilio-signature'];
    Object.entries(req.headers).forEach(([key, value]) => {
        if (allowedHeaders.includes(key.toLowerCase())) {
            safeHeaders[key] = value;
        }
    });
    return safeHeaders;
}
/**
 * Log webhook event to audit table
 */
async function logWebhookEvent(eventData) {
    try {
        const [insertedEvent] = await index_1.db.insert(schema_1.smsWebhookEvents).values({
            webhookEventType: eventData.webhookEventType,
            twilioEventSid: eventData.twilioEventSid,
            requestBody: eventData.requestBody,
            requestHeaders: eventData.requestHeaders,
            sourceIp: eventData.sourceIp,
            processingStatus: eventData.processingStatus,
            sessionId: eventData.sessionId || null,
            processingError: eventData.processingError || null
        }).returning({ id: schema_1.smsWebhookEvents.id });
        return insertedEvent || null;
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to log webhook event', { error: error.message });
        return null;
    }
}
/**
 * Update webhook event status
 */
async function updateWebhookEventStatus(eventId, updateData) {
    try {
        await index_1.db.update(schema_1.smsWebhookEvents)
            .set({
            processingStatus: updateData.processingStatus,
            processingError: updateData.processingError,
            processingDuration: updateData.processingDuration
        })
            .where((0, drizzle_orm_1.eq)(schema_1.smsWebhookEvents.id, eventId));
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to update webhook event status', {
            eventId,
            error: error.message
        });
    }
}
/**
 * Secure SMS webhook endpoint with comprehensive security validation
 * Route: POST /api/webhooks/sms
 */
router.post('/sms', twilioSignatureValidation_1.webhookRateLimit, twilioSignatureValidation_1.validateTwilioSignature, twilioSignatureValidation_1.sanitizeWebhookRequest, async (req, res) => {
    const webhookStartTime = Date.now();
    try {
        logger_1.logger.info('📨 Received SMS webhook request', {
            isValidated: req.isValidTwilioRequest,
            ip: req.ip,
            url: req.url
        });
        // Validate webhook payload structure
        const validationResult = smsWebhookSchema.safeParse(req.body);
        if (!validationResult.success) {
            logger_1.logger.warn('⚠️ Invalid SMS webhook payload structure', {
                validationErrors: validationResult.error.issues,
                receivedFields: Object.keys(req.body)
            });
            // Log to audit table (without sensitive SMS body)
            await logWebhookEvent({
                webhookEventType: 'sms_received',
                twilioEventSid: req.body.MessageSid || 'unknown',
                requestBody: {
                    MessageSid: req.body.MessageSid,
                    From: req.body.From?.substring(0, 4) + '***' + req.body.From?.slice(-4),
                    To: req.body.To?.substring(0, 4) + '***' + req.body.To?.slice(-4),
                    MessageStatus: req.body.MessageStatus,
                    bodyLength: req.body.Body?.length || 0
                },
                requestHeaders: getSecureHeaders(req),
                sourceIp: req.ip || 'unknown',
                processingStatus: 'validation_failed',
                processingError: JSON.stringify({ validationErrors: validationResult.error.issues })
            });
            return res.status(400).json({
                error: 'Invalid webhook payload',
                message: 'Webhook data does not match expected format'
            });
        }
        const webhookData = {
            MessageSid: validationResult.data.MessageSid,
            From: validationResult.data.From,
            To: validationResult.data.To,
            Body: validationResult.data.Body,
            MessageStatus: validationResult.data.MessageStatus,
            EventType: 'sms_received'
        };
        // Log webhook event to audit table (before processing, without sensitive data)
        const webhookRecord = await logWebhookEvent({
            webhookEventType: 'sms_received',
            twilioEventSid: webhookData.MessageSid,
            requestBody: {
                MessageSid: req.body.MessageSid,
                From: req.body.From?.substring(0, 4) + '***' + req.body.From?.slice(-4),
                To: req.body.To?.substring(0, 4) + '***' + req.body.To?.slice(-4),
                MessageStatus: req.body.MessageStatus,
                bodyLength: req.body.Body?.length || 0
            },
            requestHeaders: getSecureHeaders(req),
            sourceIp: req.ip || 'unknown',
            processingStatus: 'received'
        });
        // Process SMS webhook through Twilio SMS client
        const smsClient = getTwilioSMSClient();
        const verificationResult = await smsClient.processSMSWebhook(webhookData);
        // Update webhook event with processing results
        if (webhookRecord) {
            await updateWebhookEventStatus(webhookRecord.id, {
                processingStatus: 'processed',
                processingError: verificationResult ? null : 'No verification code found',
                processingDuration: Date.now() - webhookStartTime
            });
        }
        logger_1.logger.info('✅ SMS webhook processed successfully', {
            messageSid: webhookData.MessageSid,
            verificationFound: !!verificationResult,
            processingTime: Date.now() - webhookStartTime
        });
        res.status(200).json({
            status: 'success',
            message: 'SMS webhook processed',
            verificationCodeFound: !!verificationResult
        });
    }
    catch (error) {
        logger_1.logger.error('❌ SMS webhook processing failed', {
            error: error.message,
            stack: error.stack,
            messageSid: req.body.MessageSid,
            fromMasked: req.body.From?.substring(0, 4) + '***' + req.body.From?.slice(-4),
            toMasked: req.body.To?.substring(0, 4) + '***' + req.body.To?.slice(-4),
            bodyLength: req.body.Body?.length || 0,
            processingTime: Date.now() - webhookStartTime
        });
        res.status(500).json({
            error: 'Webhook processing failed',
            message: 'Internal server error during SMS processing'
        });
    }
});
/**
 * Voice webhook endpoint (required for Twilio phone numbers)
 * Route: POST /api/webhooks/voice
 */
router.post('/voice', twilioSignatureValidation_1.webhookRateLimit, twilioSignatureValidation_1.validateTwilioSignature, async (req, res) => {
    try {
        logger_1.logger.info('📞 Received voice webhook request', {
            isValidated: req.isValidTwilioRequest,
            ip: req.ip
        });
        // Log voice webhook event (without sensitive data)
        await logWebhookEvent({
            webhookEventType: 'voice_received',
            twilioEventSid: req.body.CallSid || 'unknown',
            requestBody: {
                CallSid: req.body.CallSid,
                From: req.body.From?.substring(0, 4) + '***' + req.body.From?.slice(-4),
                To: req.body.To?.substring(0, 4) + '***' + req.body.To?.slice(-4),
                CallStatus: req.body.CallStatus
            },
            requestHeaders: getSecureHeaders(req),
            sourceIp: req.ip || 'unknown',
            processingStatus: 'received'
        });
        // Return TwiML to reject voice calls (SMS-only number)
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">This number is for SMS verification only. Please do not call.</Say>
  <Hangup/>
</Response>`;
        res.type('text/xml');
        res.status(200).send(twiml);
    }
    catch (error) {
        logger_1.logger.error('❌ Voice webhook processing failed', {
            error: error.message,
            callSid: req.body.CallSid,
            fromMasked: req.body.From?.substring(0, 4) + '***' + req.body.From?.slice(-4),
            toMasked: req.body.To?.substring(0, 4) + '***' + req.body.To?.slice(-4)
        });
        res.status(500).json({
            error: 'Voice webhook processing failed',
            message: 'Internal server error'
        });
    }
});
/**
 * Health check endpoint for webhook monitoring
 * Route: GET /api/webhooks/health
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'twilio-webhooks',
        timestamp: new Date().toISOString(),
        endpoints: {
            sms: '/api/webhooks/sms',
            voice: '/api/webhooks/voice'
        }
    });
});
//# sourceMappingURL=webhooks.js.map