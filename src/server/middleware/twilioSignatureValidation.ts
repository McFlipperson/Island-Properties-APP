import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../services/logger';

/**
 * Security middleware for validating Twilio webhook signatures
 * Prevents SMS injection attacks and unauthorized webhook calls
 */

export interface TwilioValidatedRequest extends Request {
  rawBody?: Buffer;
  twilioSignature?: string;
  isValidTwilioRequest?: boolean;
}

/**
 * Middleware to capture raw body for signature validation
 * Must be applied before express.json() middleware
 */
export const captureRawBody = (req: TwilioValidatedRequest, res: Response, next: NextFunction) => {
  const chunks: Buffer[] = [];
  
  req.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });
  
  req.on('end', () => {
    req.rawBody = Buffer.concat(chunks);
    next();
  });
  
  req.on('error', (error) => {
    logger.error('Error capturing raw body for Twilio signature validation', { error: error.message });
    next(error);
  });
};

/**
 * Validates Twilio webhook signature using HMAC-SHA1
 * Reference: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
export const validateTwilioSignature = (req: TwilioValidatedRequest, res: Response, next: NextFunction) => {
  try {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!authToken) {
      logger.error('❌ TWILIO_AUTH_TOKEN not configured for signature validation');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Webhook validation not properly configured'
      });
    }

    const twilioSignature = req.get('X-Twilio-Signature');
    
    if (!twilioSignature) {
      logger.warn('⚠️ Webhook request missing X-Twilio-Signature header', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Missing webhook signature'
      });
    }

    // Get the full URL for signature validation
    const protocol = req.secure ? 'https' : 'http';
    const host = req.get('Host');
    const url = `${protocol}://${host}${req.originalUrl}`;
    
    // Get request body for signature validation
    const body = req.rawBody ? req.rawBody.toString('utf8') : '';
    
    // Create expected signature
    const expectedSignature = generateTwilioSignature(authToken, url, body);
    
    // Compare signatures using timing-safe comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(twilioSignature),
      Buffer.from(expectedSignature)
    );
    
    if (!isValid) {
      logger.warn('⚠️ Invalid Twilio webhook signature detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        expectedSignature: expectedSignature.substring(0, 20) + '...',
        receivedSignature: twilioSignature.substring(0, 20) + '...'
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid webhook signature'
      });
    }
    
    // Mark request as validated
    req.twilioSignature = twilioSignature;
    req.isValidTwilioRequest = true;
    
    logger.info('✅ Twilio webhook signature validated successfully', {
      url: req.url,
      ip: req.ip
    });
    
    next();
    
  } catch (error: any) {
    logger.error('❌ Error validating Twilio webhook signature', {
      error: error.message,
      url: req.url,
      ip: req.ip
    });
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Webhook validation failed'
    });
  }
};

/**
 * Generate expected Twilio signature for comparison
 */
function generateTwilioSignature(authToken: string, url: string, body: string): string {
  // Parse URL parameters and sort them
  const urlObj = new URL(url);
  const params: string[] = [];
  
  // Add URL parameters
  urlObj.searchParams.forEach((value, key) => {
    params.push(`${key}${value}`);
  });
  
  // Add POST body parameters if present
  if (body) {
    const bodyParams = new URLSearchParams(body);
    bodyParams.forEach((value, key) => {
      params.push(`${key}${value}`);
    });
  }
  
  // Sort parameters and concatenate with URL
  params.sort();
  const baseString = url + params.join('');
  
  // Generate HMAC-SHA1 signature
  const hmac = crypto.createHmac('sha1', authToken);
  hmac.update(baseString, 'utf8');
  const signature = hmac.digest('base64');
  
  return signature;
}

/**
 * Rate limiting middleware specifically for webhooks
 */
export const webhookRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // Implement simple rate limiting (can be enhanced with Redis)
  const rateLimitKey = `webhook_rate_limit_${req.ip}`;
  
  // For now, just log the rate limiting attempt
  // In production, implement proper rate limiting with Redis
  logger.info('🚦 Webhook rate limit check', {
    ip: req.ip,
    url: req.url,
    timestamp: new Date().toISOString()
  });
  
  next();
};

/**
 * Request sanitization middleware for webhook data
 */
export const sanitizeWebhookRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize common webhook fields
    if (req.body) {
      // Remove any potentially dangerous characters from text fields
      const sanitizedBody: any = {};
      
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string') {
          // Basic sanitization - remove control characters and normalize
          sanitizedBody[key] = value
            .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
            .substring(0, 1000) // Limit length
            .trim();
        } else {
          sanitizedBody[key] = value;
        }
      }
      
      req.body = sanitizedBody;
    }
    
    next();
  } catch (error: any) {
    logger.error('❌ Error sanitizing webhook request', { error: error.message });
    return res.status(400).json({
      error: 'Bad request',
      message: 'Invalid request format'
    });
  }
};