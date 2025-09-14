import express from 'express';
import { Request, Response } from 'express';
import { TwilioValidatedRequest, validateTwilioSignature, webhookRateLimit, sanitizeWebhookRequest } from '../middleware/twilioSignatureValidation';
import { TwilioSMSClient, WebhookSMSEvent } from '../twilio-client';
import { db } from '../db/index';
import { smsWebhookEvents, smsMessages, verificationCodes, expertPhoneNumbers } from '../../shared/schema';
import { logger } from '../services/logger';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = express.Router();

// Lazy initialize Twilio SMS client to avoid environment issues
let twilioSMSClient: TwilioSMSClient | null = null;

function getTwilioSMSClient(): TwilioSMSClient {
  if (!twilioSMSClient) {
    twilioSMSClient = new TwilioSMSClient();
  }
  return twilioSMSClient;
}

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
 * Helper function to get safe headers for logging
 */
function getSecureHeaders(req: Request): Record<string, any> {
  const safeHeaders: Record<string, any> = {};
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
async function logWebhookEvent(eventData: {
  webhookEventType: string;
  twilioEventSid: string;
  requestBody: any;
  requestHeaders: Record<string, any>;
  sourceIp: string;
  processingStatus: string;
  sessionId?: string;
  processingError?: string;
}): Promise<{ id: string } | null> {
  try {
    const [insertedEvent] = await db.insert(smsWebhookEvents).values({
      webhookEventType: eventData.webhookEventType,
      twilioEventSid: eventData.twilioEventSid,
      requestBody: eventData.requestBody,
      requestHeaders: eventData.requestHeaders,
      sourceIp: eventData.sourceIp,
      processingStatus: eventData.processingStatus,
      sessionId: eventData.sessionId || null,
      processingError: eventData.processingError || null
    }).returning({ id: smsWebhookEvents.id });
    
    return insertedEvent || null;
  } catch (error) {
    logger.error('❌ Failed to log webhook event', { error: (error as Error).message });
    return null;
  }
}

/**
 * Update webhook event status
 */
async function updateWebhookEventStatus(eventId: string, updateData: {
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
      .where(eq(smsWebhookEvents.id, eventId));
  } catch (error) {
    logger.error('❌ Failed to update webhook event status', { 
      eventId, 
      error: (error as Error).message 
    });
  }
}

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

      const webhookData: WebhookSMSEvent = {
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

      logger.info('✅ SMS webhook processed successfully', {
        messageSid: webhookData.MessageSid,
        verificationFound: !!verificationResult,
        processingTime: Date.now() - webhookStartTime
      });

      res.status(200).json({
        status: 'success',
        message: 'SMS webhook processed',
        verificationCodeFound: !!verificationResult
      });

    } catch (error) {
      logger.error('❌ SMS webhook processing failed', {
        error: (error as Error).message,
        stack: (error as Error).stack,
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
  }
);

/**
 * Voice webhook endpoint (required for Twilio phone numbers)
 * Route: POST /api/webhooks/voice
 */
router.post('/voice', 
  webhookRateLimit,
  validateTwilioSignature,
  async (req: TwilioValidatedRequest, res: Response) => {
    try {
      logger.info('📞 Received voice webhook request', {
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

    } catch (error) {
      logger.error('❌ Voice webhook processing failed', {
        error: (error as Error).message,
        callSid: req.body.CallSid,
        fromMasked: req.body.From?.substring(0, 4) + '***' + req.body.From?.slice(-4),
        toMasked: req.body.To?.substring(0, 4) + '***' + req.body.To?.slice(-4)
      });

      res.status(500).json({
        error: 'Voice webhook processing failed',
        message: 'Internal server error'
      });
    }
  }
);

/**
 * Health check endpoint for webhook monitoring
 * Route: GET /api/webhooks/health
 */
router.get('/health', (req: Request, res: Response) => {
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

export { router as webhooksRouter };