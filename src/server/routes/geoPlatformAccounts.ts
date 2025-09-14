import { Router, Request, Response, NextFunction } from 'express';
import { db, geoPlatformAccounts, GeoPlatformAccount } from '../db';
import { eq } from 'drizzle-orm';
import { logger } from '../services/logger';
import { z } from 'zod';

const router = Router();

// Validation schema
const createPlatformAccountSchema = z.object({
  personaId: z.string().uuid(),
  platformType: z.enum(['medium', 'reddit', 'quora', 'facebook', 'linkedin']),
  platformPriority: z.number().int().min(1).max(10),
  username: z.string().min(1).max(100),
  displayName: z.string().max(100).optional(),
  expertBio: z.string().optional(),
  expertCredentials: z.string().optional(),
  platformGeoSettings: z.object({
    targetRegions: z.array(z.string()),
    contentLanguage: z.string().default('en-PH'),
    timezoneFocus: z.string().default('Asia/Manila')
  }),
  contentAuthorityStrategy: z.object({
    contentTypes: z.array(z.string()),
    publicationFrequency: z.string(),
    expertiseAreas: z.array(z.string())
  }),
  expertEngagementApproach: z.object({
    responseStyle: z.string(),
    engagementLevel: z.enum(['low', 'medium', 'high']),
    communityParticipation: z.boolean()
  }),
  citationOptimizationConfig: z.object({
    keywordTargets: z.array(z.string()),
    contentDepth: z.enum(['comprehensive', 'detailed', 'summary']),
    authoritySignals: z.array(z.string())
  })
});

// Get platform accounts for a persona
router.get('/persona/:personaId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { personaId } = req.params;
    
    const accounts = await db.select()
      .from(geoPlatformAccounts)
      .where(eq(geoPlatformAccounts.personaId, personaId));
    
    logger.info(`Retrieved ${accounts.length} platform accounts for persona: ${personaId}`);
    res.json({
      success: true,
      data: accounts,
      count: accounts.length
    });
  } catch (error) {
    logger.error(`Error fetching platform accounts for persona ${req.params.personaId}:`, error);
    next(error);
  }
});

// Get all platform accounts
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { platform, status } = req.query;
    
    let query = db.select().from(geoPlatformAccounts);
    
    if (platform) {
      query = query.where(eq(geoPlatformAccounts.platformType, platform as string));
    }
    
    const accounts = await query;
    
    logger.info(`Retrieved ${accounts.length} platform accounts`);
    res.json({
      success: true,
      data: accounts,
      count: accounts.length
    });
  } catch (error) {
    logger.error('Error fetching platform accounts:', error);
    next(error);
  }
});

// Get platform account by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const account = await db.select()
      .from(geoPlatformAccounts)
      .where(eq(geoPlatformAccounts.id, id))
      .limit(1);
    
    if (account.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Platform account not found'
      });
    }
    
    logger.info(`Retrieved platform account: ${id}`);
    res.json({
      success: true,
      data: account[0]
    });
  } catch (error) {
    logger.error(`Error fetching platform account ${req.params.id}:`, error);
    next(error);
  }
});

// Create new platform account
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createPlatformAccountSchema.parse(req.body);
    
    const newAccount = {
      ...validatedData,
      credentialsEncrypted: 'encrypted_placeholder', // Will be properly encrypted in production
      accountStatus: 'building' as const,
      platformAuthorityLevel: 'newcomer' as const,
      expertVerificationStatus: 'unverified' as const
    };
    
    const result = await db.insert(geoPlatformAccounts)
      .values(newAccount)
      .returning();
    
    logger.info(`Created platform account: ${result[0].username} on ${result[0].platformType} (${result[0].id})`);
    res.status(201).json({
      success: true,
      data: result[0],
      message: 'Platform account created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    logger.error('Error creating platform account:', error);
    next(error);
  }
});

// Update platform account
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await db.update(geoPlatformAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(geoPlatformAccounts.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Platform account not found'
      });
    }
    
    logger.info(`Updated platform account: ${id}`);
    res.json({
      success: true,
      data: result[0],
      message: 'Platform account updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating platform account ${req.params.id}:`, error);
    next(error);
  }
});

export { router as geoPlatformAccountsRouter };