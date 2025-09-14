import { Request, Response, NextFunction } from 'express';
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
export declare const captureRawBody: (req: TwilioValidatedRequest, res: Response, next: NextFunction) => void;
/**
 * Validates Twilio webhook signature using HMAC-SHA1
 * Reference: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
export declare const validateTwilioSignature: (req: TwilioValidatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Rate limiting middleware specifically for webhooks
 */
export declare const webhookRateLimit: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request sanitization middleware for webhook data
 */
export declare const sanitizeWebhookRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=twilioSignatureValidation.d.ts.map