"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeWebhookRequest = exports.webhookRateLimit = exports.validateTwilioSignature = exports.captureRawBody = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../services/logger");
/**
 * Middleware to capture raw body for signature validation
 * Must be applied before express.json() middleware
 */
const captureRawBody = (req, res, next) => {
    const chunks = [];
    req.on('data', (chunk) => {
        chunks.push(chunk);
    });
    req.on('end', () => {
        req.rawBody = Buffer.concat(chunks);
        next();
    });
    req.on('error', (error) => {
        logger_1.logger.error('Error capturing raw body for Twilio signature validation', { error: error.message });
        next(error);
    });
};
exports.captureRawBody = captureRawBody;
/**
 * Validates Twilio webhook signature using HMAC-SHA1
 * Reference: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
const validateTwilioSignature = (req, res, next) => {
    try {
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!authToken) {
            logger_1.logger.error('❌ TWILIO_AUTH_TOKEN not configured for signature validation');
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'Webhook validation not properly configured'
            });
        }
        const twilioSignature = req.get('X-Twilio-Signature');
        if (!twilioSignature) {
            logger_1.logger.warn('⚠️ Webhook request missing X-Twilio-Signature header', {
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
        const isValid = crypto_1.default.timingSafeEqual(Buffer.from(twilioSignature), Buffer.from(expectedSignature));
        if (!isValid) {
            logger_1.logger.warn('⚠️ Invalid Twilio webhook signature detected', {
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
        logger_1.logger.info('✅ Twilio webhook signature validated successfully', {
            url: req.url,
            ip: req.ip
        });
        next();
    }
    catch (error) {
        logger_1.logger.error('❌ Error validating Twilio webhook signature', {
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
exports.validateTwilioSignature = validateTwilioSignature;
/**
 * Generate expected Twilio signature for comparison
 */
function generateTwilioSignature(authToken, url, body) {
    // Parse URL parameters and sort them
    const urlObj = new URL(url);
    const params = [];
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
    const hmac = crypto_1.default.createHmac('sha1', authToken);
    hmac.update(baseString, 'utf8');
    const signature = hmac.digest('base64');
    return signature;
}
/**
 * Rate limiting middleware specifically for webhooks
 */
const webhookRateLimit = (req, res, next) => {
    // Implement simple rate limiting (can be enhanced with Redis)
    const rateLimitKey = `webhook_rate_limit_${req.ip}`;
    // For now, just log the rate limiting attempt
    // In production, implement proper rate limiting with Redis
    logger_1.logger.info('🚦 Webhook rate limit check', {
        ip: req.ip,
        url: req.url,
        timestamp: new Date().toISOString()
    });
    next();
};
exports.webhookRateLimit = webhookRateLimit;
/**
 * Request sanitization middleware for webhook data
 */
const sanitizeWebhookRequest = (req, res, next) => {
    try {
        // Sanitize common webhook fields
        if (req.body) {
            // Remove any potentially dangerous characters from text fields
            const sanitizedBody = {};
            for (const [key, value] of Object.entries(req.body)) {
                if (typeof value === 'string') {
                    // Basic sanitization - remove control characters and normalize
                    sanitizedBody[key] = value
                        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
                        .substring(0, 1000) // Limit length
                        .trim();
                }
                else {
                    sanitizedBody[key] = value;
                }
            }
            req.body = sanitizedBody;
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('❌ Error sanitizing webhook request', { error: error.message });
        return res.status(400).json({
            error: 'Bad request',
            message: 'Invalid request format'
        });
    }
};
exports.sanitizeWebhookRequest = sanitizeWebhookRequest;
//# sourceMappingURL=twilioSignatureValidation.js.map