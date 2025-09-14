import express from 'express';
import { Request, Response } from 'express';
import { db } from '../db/index';
import { verificationCodes, expertPersonas, smsVerificationSessions } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '../services/logger';

const router = express.Router();

// Store active SSE connections for real-time code delivery
const activeConnections = new Map<string, Response>();

/**
 * Server-Sent Events endpoint for real-time verification code delivery
 * Route: GET /api/dashboard/verification-codes/stream/:expertId
 */
router.get('/verification-codes/stream/:expertId', async (req: Request, res: Response) => {
  const expertId = req.params.expertId;
  
  try {
    // Verify expert exists
    const expert = await db
      .select({ id: expertPersonas.id, expertName: expertPersonas.expertName })
      .from(expertPersonas)
      .where(eq(expertPersonas.id, expertId))
      .limit(1);

    if (expert.length === 0) {
      return res.status(404).json({ error: 'Expert not found' });
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
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

    logger.info('🔗 Expert connected to verification code stream', {
      expertId: expertId.substring(0, 8) + '...',
      expertName: expert[0].expertName
    });

    // Handle client disconnect
    req.on('close', () => {
      activeConnections.delete(expertId);
      logger.info('🔌 Expert disconnected from verification code stream', {
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
      } else {
        clearInterval(heartbeat);
      }
    }, 30000); // 30 second heartbeat

  } catch (error: any) {
    logger.error('❌ SSE connection failed', {
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
async function sendPendingCodes(expertId: string, res: Response) {
  try {
    // Get unsent verification codes for this expert (fixed database joins)
    const pendingCodes = await db
      .select({
        id: verificationCodes.id,
        verificationCode: verificationCodes.verificationCode,
        codeType: verificationCodes.codeType,
        platformType: verificationCodes.platformType,
        codeUsageType: verificationCodes.codeUsageType,
        extractedAt: verificationCodes.extractedAt,
        expiresAt: verificationCodes.expiresAt,
        validationScore: verificationCodes.validationScore
      })
      .from(verificationCodes)
      .innerJoin(
        smsVerificationSessions,
        eq(verificationCodes.sessionId, smsVerificationSessions.id)
      )
      .where(and(
        eq(smsVerificationSessions.personaId, expertId),
        eq(verificationCodes.sentToDashboard, false),
        eq(verificationCodes.codeStatus, 'active')
      ))
      .orderBy(desc(verificationCodes.extractedAt))
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
      await db
        .update(verificationCodes)
        .set({ 
          sentToDashboard: true,
          dashboardDeliveryAt: new Date()
        })
        .where(eq(verificationCodes.id, code.id));
    }

    if (pendingCodes.length > 0) {
      logger.info('📤 Sent pending verification codes to dashboard', {
        expertId: expertId.substring(0, 8) + '...',
        codeCount: pendingCodes.length
      });
    }

  } catch (error: any) {
    logger.error('❌ Failed to send pending codes', {
      expertId: expertId.substring(0, 8) + '...',
      error: error.message
    });
  }
}

/**
 * Real-time verification code delivery function (called from SMS processing)
 * This function is called when a new verification code is extracted
 */
export async function deliverVerificationCodeToExpert(
  expertId: string, 
  verificationCode: {
    codeId: string;
    verificationCode: string;
    codeType: string;
    platformType: string;
    extractedAt: Date;
    expiresAt: Date;
    isValid: boolean;
  }
): Promise<void> {
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

      logger.info('🚀 Real-time verification code delivered to expert', {
        expertId: expertId.substring(0, 8) + '...',
        codeType: verificationCode.codeType,
        platformType: verificationCode.platformType,
        codePattern: verificationCode.verificationCode.replace(/\d/g, 'X').replace(/[A-Z]/g, 'Y')
      });
    } else {
      logger.info('📭 Expert not connected - code stored for later retrieval', {
        expertId: expertId.substring(0, 8) + '...',
        codeId: verificationCode.codeId.substring(0, 8) + '...'
      });
    }

  } catch (error: any) {
    logger.error('❌ Failed to deliver verification code to expert', {
      expertId: expertId.substring(0, 8) + '...',
      error: error.message
    });
  }
}

/**
 * Get verification code history for expert dashboard
 * Route: GET /api/dashboard/verification-codes/:expertId
 */
router.get('/verification-codes/:expertId', async (req: Request, res: Response) => {
  const expertId = req.params.expertId;
  const limit = parseInt(req.query.limit as string) || 20;
  
  try {
    // Get recent verification codes for this expert (fixed database joins)
    const recentCodes = await db
      .select({
        id: verificationCodes.id,
        verificationCode: verificationCodes.verificationCode,
        codeType: verificationCodes.codeType,
        platformType: verificationCodes.platformType,
        codeUsageType: verificationCodes.codeUsageType,
        codeStatus: verificationCodes.codeStatus,
        extractedAt: verificationCodes.extractedAt,
        expiresAt: verificationCodes.expiresAt,
        validationScore: verificationCodes.validationScore,
        viewedByUser: verificationCodes.viewedByUser,
        usedAt: verificationCodes.usedAt
      })
      .from(verificationCodes)
      .innerJoin(
        smsVerificationSessions,
        eq(verificationCodes.sessionId, smsVerificationSessions.id)
      )
      .where(eq(smsVerificationSessions.personaId, expertId))
      .orderBy(desc(verificationCodes.extractedAt))
      .limit(limit);

    res.json({
      expertId,
      codes: recentCodes,
      total: recentCodes.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('❌ Failed to get verification code history', {
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
 */
router.post('/verification-codes/:codeId/mark-used', async (req: Request, res: Response) => {
  const codeId = req.params.codeId;
  
  try {
    await db
      .update(verificationCodes)
      .set({
        viewedByUser: true,
        viewedAt: new Date(),
        usedAt: new Date(),
        codeStatus: 'used'
      })
      .where(eq(verificationCodes.id, codeId));

    logger.info('✅ Verification code marked as used', {
      codeId: codeId.substring(0, 8) + '...'
    });

    res.json({
      success: true,
      message: 'Verification code marked as used',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('❌ Failed to mark verification code as used', {
      codeId: codeId.substring(0, 8) + '...',
      error: error.message
    });

    res.status(500).json({
      error: 'Failed to mark verification code as used',
      message: error.message
    });
  }
});

export { router as dashboardRouter };