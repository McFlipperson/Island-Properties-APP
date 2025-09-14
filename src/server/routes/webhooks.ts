import express from 'express';
import { Request, Response } from 'express';
import { TwilioValidatedRequest, validateTwilioSignature, webhookRateLimit, sanitizeWebhookRequest } from '../middleware/twilioSignatureValidation';
import { TwilioSMSClient, WebhookSMSEvent } from '../twilio-client';
import { db } from '../db/index';
import { smsWebhookEvents, smsMessages } from '../../shared/schema';
import { logger } from '../services/logger';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = express.Router();

// Initialize Twilio SMS client
const twilioSMSClient = new TwilioSMSClient();

/**
 * Validation schema for incoming SMS webhooks
 * Reference: https://www.twilio.com/docs/sms/webhooks
 */
const smsWebhookSchema = z.object({
  MessageSid: z.string().min(1),
  AccountSid: z.string().min(1),
  From: z.string().min(1),
  To: z.string().min(1),
  Body: z.string().default(''),
  MessageStatus: z.enum(['queued', 'sending', 'sent', 'failed', 'delivered', 'undelivered', 'receiving', 'received']),
  MessageDirection: z.enum(['inbound', 'outbound-api', 'outbound-call', 'outbound-reply']).optional(),
  NumMedia: z.string().optional(),
  SmsStatus: z.string().optional(),
  ApiVersion: z.string().optional(),
  SmsSid: z.string().optional(),
  SmsMessageSid: z.string().optional(),
  NumSegments: z.string().optional(),
  ReferralNumMedia: z.string().optional(),
  Price: z.string().optional(),
  PriceUnit: z.string().optional(),
  ErrorCode: z.string().optional(),
  ErrorMessage: z.string().optional()
});

/**
 * Secure SMS webhook endpoint with comprehensive security validation
 * Route: POST /api/webhooks/sms
 */
router.post('/sms', 
  webhookRateLimit,
  validateTwilioSignature,
  sanitizeWebhookRequest,
  async (req: TwilioValidatedRequest, res: Response) => {
    const webhookStartTime = Date.now();
    
    try {
      logger.info('📨 Received SMS webhook request', {
        isValidated: req.isValidTwilioRequest,
        ip: req.ip,
        url: req.url
      });

      // Validate webhook payload structure
      const validationResult = smsWebhookSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        logger.warn('⚠️ Invalid SMS webhook payload structure', {
          validationErrors: validationResult.error.issues,
          receivedFields: Object.keys(req.body)
        });
        
        // Log to audit table
        await logWebhookEvent({
          webhookEventType: 'sms_received',
          twilioEventSid: req.body.MessageSid || 'unknown',
          requestBody: req.body,
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

      const webhookData: WebhookSMSEvent = {
        MessageSid: validationResult.data.MessageSid,
        From: validationResult.data.From,
        To: validationResult.data.To,
        Body: validationResult.data.Body,
        MessageStatus: validationResult.data.MessageStatus,
        EventType: 'sms_received'
      };

      // Log webhook event to audit table (before processing)
      const webhookRecord = await logWebhookEvent({
        webhookEventType: 'sms_received',
        twilioEventSid: webhookData.MessageSid,
        requestBody: req.body,
        requestHeaders: getSecureHeaders(req),
        sourceIp: req.ip || 'unknown',
        processingStatus: 'received'
      });

      // Process SMS webhook through Twilio SMS client
      const verificationResult = await twilioSMSClient.processSMSWebhook(webhookData);
      
      // Update webhook event with processing results
      if (webhookRecord) {
        await updateWebhookEventStatus(webhookRecord.id, {
          processingStatus: 'processed',
          processingError: verificationResult ? null : 'No verification code found',
          processingDuration: Date.now() - webhookStartTime
        });
      }

      // Respond to Twilio with success (required for webhook acknowledgment)
      logger.info('✅ SMS webhook processed successfully', {
        messageSid: webhookData.MessageSid,
        verificationCodeFound: verificationResult ? true : false,
        processingTime: Date.now() - webhookStartTime
      });

      res.status(200).json({
        status: 'success',
        message: 'Webhook processed successfully',
        verificationCodeExtracted: verificationResult ? true : false
      });

    } catch (error: any) {
      logger.error('❌ SMS webhook processing failed', {
        error: error.message,
        processingTime: Date.now() - webhookStartTime
      });

      // Log error to audit table
      await logWebhookEvent({
        webhookEventType: 'sms_received',
        twilioEventSid: req.body?.MessageSid || 'unknown',
        requestBody: req.body,
        requestHeaders: getSecureHeaders(req),
        sourceIp: req.ip || 'unknown',
        processingStatus: 'failed',
        processingError: `${error.constructor.name}: ${error.message}`
      });

      // Return error response to Twilio
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }
);

/**
 * Session-specific SMS webhook endpoint for verification sessions
 * Route: POST /api/webhooks/sms/:sessionId
 */
router.post('/sms/:sessionId',
  webhookRateLimit,
  validateTwilioSignature,
  sanitizeWebhookRequest,
  async (req: TwilioValidatedRequest, res: Response) => {
    const { sessionId } = req.params;
    const webhookStartTime = Date.now();
    
    try {
      logger.info('📨 Received session-specific SMS webhook', {
        sessionId,
        isValidated: req.isValidTwilioRequest
      });

      // Validate session ID format
      if (!sessionId || sessionId.length < 10) {
        return res.status(400).json({
          error: 'Invalid session ID',
          message: 'Session ID is required and must be valid'
        });
      }

      // Validate webhook payload
      const validationResult = smsWebhookSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        await logWebhookEvent({
          webhookEventType: 'sms_session_webhook',
          twilioEventSid: req.body.MessageSid || 'unknown',
          requestBody: req.body,
          requestHeaders: getSecureHeaders(req),
          sourceIp: req.ip || 'unknown',
          processingStatus: 'validation_failed',
          sessionId,
          processingError: JSON.stringify({ validationErrors: validationResult.error.issues })
        });
        
        return res.status(400).json({
          error: 'Invalid webhook payload',
          message: 'Webhook data does not match expected format'
        });
      }

      const webhookData: WebhookSMSEvent = {
        MessageSid: validationResult.data.MessageSid,
        From: validationResult.data.From,
        To: validationResult.data.To,
        Body: validationResult.data.Body,
        MessageStatus: validationResult.data.MessageStatus,
        EventType: 'sms_session_webhook'
      };

      // Log session webhook event
      const webhookRecord = await logWebhookEvent({
        webhookEventType: 'sms_session_webhook',
        twilioEventSid: webhookData.MessageSid,
        requestBody: req.body,
        requestHeaders: getSecureHeaders(req),
        sourceIp: req.ip || 'unknown',
        processingStatus: 'received',
        sessionId
      });

      // Process through Twilio SMS client with session context
      const verificationResult = await twilioSMSClient.processSMSWebhook(webhookData);
      
      // Update webhook event status
      if (webhookRecord) {
        await updateWebhookEventStatus(webhookRecord.id, {
          processingStatus: 'processed',
          processingError: verificationResult ? null : 'No verification code found',
          processingDuration: Date.now() - webhookStartTime
        });
      }

      logger.info('✅ Session SMS webhook processed successfully', {
        sessionId,
        messageSid: webhookData.MessageSid,
        verificationCodeFound: verificationResult ? true : false,
        processingTime: Date.now() - webhookStartTime
      });

      res.status(200).json({
        status: 'success',
        message: 'Session webhook processed successfully',
        sessionId,
        verificationCodeExtracted: verificationResult ? true : false
      });

    } catch (error: any) {
      logger.error('❌ Session SMS webhook processing failed', {
        sessionId,
        error: error.message,
        processingTime: Date.now() - webhookStartTime
      });

      await logWebhookEvent({
        webhookEventType: 'sms_session_webhook',
        twilioEventSid: req.body?.MessageSid || 'unknown',
        requestBody: req.body,
        requestHeaders: getSecureHeaders(req),
        sourceIp: req.ip || 'unknown',
        processingStatus: 'failed',
        sessionId,
        processingError: `${error.constructor.name}: ${error.message}`
      });

      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        sessionId
      });
    }
  }
);

/**
 * Voice webhook endpoint (required by Twilio but not actively used)
 */
router.post('/voice',
  webhookRateLimit,
  validateTwilioSignature,
  (req: TwilioValidatedRequest, res: Response) => {
    logger.info('📞 Voice webhook received (not processed)', {
      callSid: req.body?.CallSid,
      isValidated: req.isValidTwilioRequest
    });
    
    // Respond with TwiML to hang up (we don't process voice calls)
    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>');
  }
);

/**
 * Helper function to log webhook events to audit table
 */
async function logWebhookEvent(eventData: {
  webhookEventType: string;
  twilioEventSid: string;
  requestBody: any;
  requestHeaders: Record<string, any>;
  sourceIp: string;
  processingStatus: string;
  sessionId?: string;
  processingError?: string;
}) {
  try {
    const result = await db.insert(smsWebhookEvents).values({
      webhookEventType: eventData.webhookEventType,
      twilioEventSid: eventData.twilioEventSid,
      requestBody: eventData.requestBody,
      requestHeaders: eventData.requestHeaders,
      sourceIp: eventData.sourceIp,
      processingStatus: eventData.processingStatus,
      sessionId: eventData.sessionId || null,
      processingError: eventData.processingError || null
    }).returning();
    return result[0] || null;
  } catch (error: any) {
    logger.error('❌ Failed to log webhook event to audit table', {
      twilioEventSid: eventData.twilioEventSid,
      error: error.message
    });
    return null;
  }
}

/**
 * Helper function to update webhook event processing status
 */
async function updateWebhookEventStatus(webhookId: string, updateData: {
  processingStatus: string;
  processingError?: string | null;
  processingDuration?: number;
}) {
  try {
    await db.update(smsWebhookEvents)
      .set({
        processingStatus: updateData.processingStatus,
        processingError: updateData.processingError,
        processingDuration: updateData.processingDuration
      })
      .where(eq(smsWebhookEvents.id, webhookId));
  } catch (error: any) {
    logger.error('❌ Failed to update webhook event status', {
      webhookId,
      error: error.message
    });
  }
}

/**
 * Helper function to extract secure headers (removing sensitive data)
 */
function getSecureHeaders(req: Request): Record<string, any> {
  const secureHeaders: Record<string, any> = {};
  
  // Only include safe headers for audit logging
  const safeHeaders = [
    'host',
    'user-agent',
    'content-type',
    'content-length',
    'x-forwarded-for',
    'x-twilio-signature'
  ];
  
  safeHeaders.forEach(header => {
    const value = req.get(header);
    if (value) {
      // Mask the Twilio signature for security (keep first 10 chars)
      if (header === 'x-twilio-signature') {
        secureHeaders[header] = value.substring(0, 10) + '...';
      } else {
        secureHeaders[header] = value;
      }
    }
  });
  
  return secureHeaders;
}

export { router as webhooksRouter };