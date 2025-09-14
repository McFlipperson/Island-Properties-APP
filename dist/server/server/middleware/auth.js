"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExpertToken = generateExpertToken;
exports.authenticateExpert = authenticateExpert;
exports.authorizeExpertAccess = authorizeExpertAccess;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../db/index");
const schema_1 = require("../../shared/schema");
const drizzle_orm_1 = require("drizzle-orm");
const logger_1 = require("../services/logger");
// JWT secret from environment or default for development
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
/**
 * Generate JWT token for expert authentication
 */
function generateExpertToken(expertId, expertName) {
    return jsonwebtoken_1.default.sign({
        expertId,
        expertName,
        type: 'expert_access',
        iat: Math.floor(Date.now() / 1000)
    }, JWT_SECRET, {
        expiresIn: '24h',
        issuer: 'geo-expert-authority',
        audience: 'expert-dashboard'
    });
}
/**
 * Authenticate expert access to dashboard endpoints
 * Validates JWT token and ensures expert exists in database
 */
async function authenticateExpert(req, res, next) {
    try {
        // Extract token from Authorization header or query param (for SSE)
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        else if (req.query.token) {
            token = req.query.token;
        }
        if (!token) {
            logger_1.logger.warn('❌ Dashboard access denied: No authentication token', {
                ip: req.ip,
                path: req.path,
                userAgent: req.get('User-Agent')?.substring(0, 100)
            });
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Valid JWT token required for dashboard access'
            });
        }
        // Verify JWT token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (!decoded.expertId || decoded.type !== 'expert_access') {
            logger_1.logger.warn('❌ Dashboard access denied: Invalid token format', {
                ip: req.ip,
                path: req.path,
                tokenType: decoded.type || 'unknown'
            });
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Token does not contain valid expert credentials'
            });
        }
        // Verify expert exists in database
        const expert = await index_1.db
            .select({
            id: schema_1.expertPersonas.id,
            expertName: schema_1.expertPersonas.expertName,
            expertStatus: schema_1.expertPersonas.expertStatus
        })
            .from(schema_1.expertPersonas)
            .where((0, drizzle_orm_1.eq)(schema_1.expertPersonas.id, decoded.expertId))
            .limit(1);
        if (expert.length === 0) {
            logger_1.logger.warn('❌ Dashboard access denied: Expert not found', {
                expertId: decoded.expertId.substring(0, 8) + '...',
                ip: req.ip,
                path: req.path
            });
            return res.status(401).json({
                error: 'Expert not found',
                message: 'Expert account does not exist or has been deactivated'
            });
        }
        // Attach expert info to request
        req.expertId = expert[0].id;
        req.expertPersona = expert[0];
        logger_1.logger.info('✅ Expert authenticated for dashboard access', {
            expertId: expert[0].id.substring(0, 8) + '...',
            expertName: expert[0].expertName,
            path: req.path
        });
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            logger_1.logger.warn('❌ Dashboard access denied: Invalid JWT', {
                error: error.message,
                ip: req.ip,
                path: req.path
            });
            return res.status(401).json({
                error: 'Invalid token',
                message: 'JWT token is malformed or expired'
            });
        }
        logger_1.logger.error('❌ Authentication middleware error', {
            error: error.message,
            stack: error.stack,
            ip: req.ip,
            path: req.path
        });
        return res.status(500).json({
            error: 'Authentication error',
            message: 'Internal error during authentication'
        });
    }
}
/**
 * Authorize expert access to specific expert data
 * Ensures authenticated expert can only access their own data
 */
function authorizeExpertAccess(req, res, next) {
    const requestedExpertId = req.params.expertId;
    const authenticatedExpertId = req.expertId;
    if (!authenticatedExpertId) {
        logger_1.logger.error('❌ Authorization called without authentication', {
            path: req.path,
            ip: req.ip
        });
        return res.status(500).json({
            error: 'Authentication required',
            message: 'Expert must be authenticated before authorization'
        });
    }
    if (requestedExpertId !== authenticatedExpertId) {
        logger_1.logger.warn('❌ Unauthorized expert data access attempt', {
            authenticatedExpert: authenticatedExpertId.substring(0, 8) + '...',
            requestedExpert: requestedExpertId.substring(0, 8) + '...',
            path: req.path,
            ip: req.ip
        });
        return res.status(403).json({
            error: 'Access denied',
            message: 'Cannot access verification codes for other experts'
        });
    }
    next();
}
//# sourceMappingURL=auth.js.map