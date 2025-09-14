import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/index';
import { expertPersonas } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../services/logger';

// Extend Express Request type to include authenticated expert
declare global {
  namespace Express {
    interface Request {
      expertId?: string;
      expertPersona?: {
        id: string;
        expertName: string;
        expertStatus: string | null;
      };
    }
  }
}

// JWT secret from environment or default for development
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';

/**
 * Generate JWT token for expert authentication
 */
export function generateExpertToken(expertId: string, expertName: string): string {
  return jwt.sign(
    { 
      expertId, 
      expertName,
      type: 'expert_access',
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { 
      expiresIn: '24h',
      issuer: 'geo-expert-authority',
      audience: 'expert-dashboard'
    }
  );
}

/**
 * Authenticate expert access to dashboard endpoints
 * Validates JWT token and ensures expert exists in database
 */
export async function authenticateExpert(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header or query param (for SSE)
    let token: string | undefined;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      logger.warn('❌ Dashboard access denied: No authentication token', {
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
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    
    if (!decoded.expertId || decoded.type !== 'expert_access') {
      logger.warn('❌ Dashboard access denied: Invalid token format', {
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
    const expert = await db
      .select({
        id: expertPersonas.id,
        expertName: expertPersonas.expertName,
        expertStatus: expertPersonas.expertStatus
      })
      .from(expertPersonas)
      .where(eq(expertPersonas.id, decoded.expertId))
      .limit(1);

    if (expert.length === 0) {
      logger.warn('❌ Dashboard access denied: Expert not found', {
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

    logger.info('✅ Expert authenticated for dashboard access', {
      expertId: expert[0].id.substring(0, 8) + '...',
      expertName: expert[0].expertName,
      path: req.path
    });

    next();

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('❌ Dashboard access denied: Invalid JWT', {
        error: error.message,
        ip: req.ip,
        path: req.path
      });
      
      return res.status(401).json({
        error: 'Invalid token',
        message: 'JWT token is malformed or expired'
      });
    }

    logger.error('❌ Authentication middleware error', {
      error: (error as Error).message,
      stack: (error as Error).stack,
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
export function authorizeExpertAccess(req: Request, res: Response, next: NextFunction) {
  const requestedExpertId = req.params.expertId;
  const authenticatedExpertId = req.expertId;

  if (!authenticatedExpertId) {
    logger.error('❌ Authorization called without authentication', {
      path: req.path,
      ip: req.ip
    });
    
    return res.status(500).json({
      error: 'Authentication required',
      message: 'Expert must be authenticated before authorization'
    });
  }

  if (requestedExpertId !== authenticatedExpertId) {
    logger.warn('❌ Unauthorized expert data access attempt', {
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