"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
exports.deliverVerificationCodeToExpert = deliverVerificationCodeToExpert;
const express_1 = __importDefault(require("express"));
const index_1 = require("../db/index");
const schema_1 = require("../../shared/schema");
const drizzle_orm_1 = require("drizzle-orm");
const logger_1 = require("../services/logger");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.dashboardRouter = router;
// Store active SSE connections for real-time code delivery
const activeConnections = new Map();
/**
 * Server-Sent Events endpoint for real-time verification code delivery
 * Route: GET /api/dashboard/verification-codes/stream/:expertId
 * SECURITY: Requires authentication via JWT token in query param for SSE compatibility
 */
router.get('/verification-codes/stream/:expertId', auth_1.authenticateExpert, auth_1.authorizeExpertAccess, async (req, res) => {
    const expertId = req.params.expertId;
    try {
        // Expert already verified by authentication middleware
        // Use authenticated expert info from req.expertPersona
        // Set SSE headers with restricted CORS
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production'
                ? process.env.FRONTEND_URL || 'https://your-domain.com'
                : 'http://localhost:3000',
            'Access-Control-Allow-Headers': 'Cache-Control, Authorization',
            'Access-Control-Allow-Credentials': 'true'
        });
        // Store connection for real-time updates
        activeConnections.set(expertId, res);
        // Send initial connection confirmation
        res.write(`data: ${JSON.stringify({
            type: 'connection',
            message: 'Connected to verification code stream',
            expertId: expertId,
            timestamp: new Date().toISOString()
        })}\n\n`);
        // Send any pending verification codes
        await sendPendingCodes(expertId, res);
        logger_1.logger.info('🔗 Expert connected to verification code stream', {
            expertId: expertId.substring(0, 8) + '...',
            expertName: req.expertPersona?.expertName || 'Unknown'
        });
        // Handle client disconnect
        req.on('close', () => {
            activeConnections.delete(expertId);
            logger_1.logger.info('🔌 Expert disconnected from verification code stream', {
                expertId: expertId.substring(0, 8) + '...'
            });
        });
        // Keep connection alive with periodic heartbeat
        const heartbeat = setInterval(() => {
            if (activeConnections.has(expertId)) {
                res.write(`data: ${JSON.stringify({
                    type: 'heartbeat',
                    timestamp: new Date().toISOString()
                })}\n\n`);
            }
            else {
                clearInterval(heartbeat);
            }
        }, 30000); // 30 second heartbeat
    }
    catch (error) {
        logger_1.logger.error('❌ SSE connection failed', {
            expertId: expertId.substring(0, 8) + '...',
            error: error.message
        });
        res.status(500).json({
            error: 'Stream connection failed',
            message: error.message
        });
    }
});
/**
 * Send pending verification codes to expert dashboard
 */
async function sendPendingCodes(expertId, res) {
    try {
        // Get unsent verification codes for this expert (fixed database joins)
        const pendingCodes = await index_1.db
            .select({
            id: schema_1.verificationCodes.id,
            verificationCode: schema_1.verificationCodes.verificationCode,
            codeType: schema_1.verificationCodes.codeType,
            platformType: schema_1.verificationCodes.platformType,
            codeUsageType: schema_1.verificationCodes.codeUsageType,
            extractedAt: schema_1.verificationCodes.extractedAt,
            expiresAt: schema_1.verificationCodes.expiresAt,
            validationScore: schema_1.verificationCodes.validationScore
        })
            .from(schema_1.verificationCodes)
            .innerJoin(schema_1.smsVerificationSessions, (0, drizzle_orm_1.eq)(schema_1.verificationCodes.sessionId, schema_1.smsVerificationSessions.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.smsVerificationSessions.personaId, expertId), (0, drizzle_orm_1.eq)(schema_1.verificationCodes.sentToDashboard, false), (0, drizzle_orm_1.eq)(schema_1.verificationCodes.codeStatus, 'active')))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.verificationCodes.extractedAt))
            .limit(10);
        // Send each pending code
        for (const code of pendingCodes) {
            const codeEvent = {
                type: 'verification_code',
                data: {
                    codeId: code.id,
                    verificationCode: code.verificationCode,
                    codeType: code.codeType,
                    platformType: code.platformType,
                    codeUsageType: code.codeUsageType,
                    confidence: parseFloat(code.validationScore || '0'),
                    extractedAt: code.extractedAt,
                    expiresAt: code.expiresAt,
                    isNew: true
                },
                timestamp: new Date().toISOString()
            };
            res.write(`data: ${JSON.stringify(codeEvent)}\n\n`);
            // Mark as sent to dashboard
            await index_1.db
                .update(schema_1.verificationCodes)
                .set({
                sentToDashboard: true,
                dashboardDeliveryAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.verificationCodes.id, code.id));
        }
        if (pendingCodes.length > 0) {
            logger_1.logger.info('📤 Sent pending verification codes to dashboard', {
                expertId: expertId.substring(0, 8) + '...',
                codeCount: pendingCodes.length
            });
        }
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to send pending codes', {
            expertId: expertId.substring(0, 8) + '...',
            error: error.message
        });
    }
}
/**
 * Real-time verification code delivery function (called from SMS processing)
 * This function is called when a new verification code is extracted
 */
async function deliverVerificationCodeToExpert(expertId, verificationCode) {
    try {
        const connection = activeConnections.get(expertId);
        if (connection) {
            const codeEvent = {
                type: 'verification_code',
                data: {
                    ...verificationCode,
                    isNew: true,
                    confidence: 0.9 // Default confidence for real-time delivery
                },
                timestamp: new Date().toISOString()
            };
            connection.write(`data: ${JSON.stringify(codeEvent)}\n\n`);
            logger_1.logger.info('🚀 Real-time verification code delivered to expert', {
                expertId: expertId.substring(0, 8) + '...',
                codeType: verificationCode.codeType,
                platformType: verificationCode.platformType,
                codePattern: verificationCode.verificationCode.replace(/\d/g, 'X').replace(/[A-Z]/g, 'Y')
            });
        }
        else {
            logger_1.logger.info('📭 Expert not connected - code stored for later retrieval', {
                expertId: expertId.substring(0, 8) + '...',
                codeId: verificationCode.codeId.substring(0, 8) + '...'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to deliver verification code to expert', {
            expertId: expertId.substring(0, 8) + '...',
            error: error.message
        });
    }
}
/**
 * Get verification code history for expert dashboard
 * Route: GET /api/dashboard/verification-codes/:expertId
 */
router.get('/verification-codes/:expertId', auth_1.authenticateExpert, auth_1.authorizeExpertAccess, async (req, res) => {
    const expertId = req.params.expertId;
    const limit = parseInt(req.query.limit) || 20;
    try {
        // Get recent verification codes for this expert (fixed database joins)
        const recentCodes = await index_1.db
            .select({
            id: schema_1.verificationCodes.id,
            verificationCode: schema_1.verificationCodes.verificationCode,
            codeType: schema_1.verificationCodes.codeType,
            platformType: schema_1.verificationCodes.platformType,
            codeUsageType: schema_1.verificationCodes.codeUsageType,
            codeStatus: schema_1.verificationCodes.codeStatus,
            extractedAt: schema_1.verificationCodes.extractedAt,
            expiresAt: schema_1.verificationCodes.expiresAt,
            validationScore: schema_1.verificationCodes.validationScore,
            viewedByUser: schema_1.verificationCodes.viewedByUser,
            usedAt: schema_1.verificationCodes.usedAt
        })
            .from(schema_1.verificationCodes)
            .innerJoin(schema_1.smsVerificationSessions, (0, drizzle_orm_1.eq)(schema_1.verificationCodes.sessionId, schema_1.smsVerificationSessions.id))
            .where((0, drizzle_orm_1.eq)(schema_1.smsVerificationSessions.personaId, expertId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.verificationCodes.extractedAt))
            .limit(limit);
        res.json({
            expertId,
            codes: recentCodes,
            total: recentCodes.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to get verification code history', {
            expertId: expertId.substring(0, 8) + '...',
            error: error.message
        });
        res.status(500).json({
            error: 'Failed to get verification code history',
            message: error.message
        });
    }
});
/**
 * Mark verification code as viewed/used
 * Route: POST /api/dashboard/verification-codes/:codeId/mark-used
 * SECURITY: Requires authentication + ownership verification to prevent cross-expert manipulation
 */
router.post('/verification-codes/:codeId/mark-used', auth_1.authenticateExpert, async (req, res) => {
    const codeId = req.params.codeId;
    const authenticatedExpertId = req.expertId;
    try {
        // Verify code ownership before allowing modification
        const codeOwnership = await index_1.db
            .select({
            codeId: schema_1.verificationCodes.id,
            personaId: schema_1.smsVerificationSessions.personaId
        })
            .from(schema_1.verificationCodes)
            .innerJoin(schema_1.smsVerificationSessions, (0, drizzle_orm_1.eq)(schema_1.verificationCodes.sessionId, schema_1.smsVerificationSessions.id))
            .where((0, drizzle_orm_1.eq)(schema_1.verificationCodes.id, codeId))
            .limit(1);
        if (codeOwnership.length === 0) {
            return res.status(404).json({
                error: 'Verification code not found',
                message: 'Code does not exist or has been deleted'
            });
        }
        // Critical security check: Ensure expert can only modify their own codes
        if (!authenticatedExpertId || codeOwnership[0].personaId !== authenticatedExpertId) {
            logger_1.logger.warn('❌ Unauthorized verification code access attempt', {
                authenticatedExpert: authenticatedExpertId ? authenticatedExpertId.substring(0, 8) + '...' : 'unknown',
                codeOwner: (codeOwnership[0].personaId ?? 'unknown').substring(0, 8) + '...',
                codeId: codeId.substring(0, 8) + '...',
                ip: req.ip
            });
            return res.status(403).json({
                error: 'Access denied',
                message: 'Cannot modify verification codes belonging to other experts'
            });
        }
        // Now safe to update the verification code
        await index_1.db
            .update(schema_1.verificationCodes)
            .set({
            viewedByUser: true,
            viewedAt: new Date(),
            usedAt: new Date(),
            codeStatus: 'used'
        })
            .where((0, drizzle_orm_1.eq)(schema_1.verificationCodes.id, codeId));
        logger_1.logger.info('✅ Verification code marked as used', {
            codeId: codeId.substring(0, 8) + '...'
        });
        res.json({
            success: true,
            message: 'Verification code marked as used',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to mark verification code as used', {
            codeId: codeId.substring(0, 8) + '...',
            error: error.message
        });
        res.status(500).json({
            error: 'Failed to mark verification code as used',
            message: error.message
        });
    }
});
//# sourceMappingURL=dashboard.js.map