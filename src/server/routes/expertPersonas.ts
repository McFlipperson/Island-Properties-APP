import { Router, Request, Response, NextFunction } from 'express';
import { db, expertPersonas, ExpertPersona, NewExpertPersona } from '../db';
import { eq } from 'drizzle-orm';
import { logger } from '../services/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createExpertPersonaSchema = z.object({
  expertName: z.string().min(1).max(100),
  expertiseFocus: z.string().min(1).max(50),
  targetBuyerSegments: z.array(z.string()),
  primaryMarketLocation: z.string().min(1).max(50),
  geoContentSpecializations: z.array(z.string()),
  authorityBuildingTopics: z.array(z.string()),
  citationWorthyExpertise: z.array(z.string()),
  platformExpertiseFocus: z.object({
    medium: z.object({
      active: z.boolean(),
      contentTypes: z.array(z.string())
    }).optional(),
    reddit: z.object({
      active: z.boolean(),
      subreddits: z.array(z.string())
    }).optional(),
    quora: z.object({
      active: z.boolean(),
      topics: z.array(z.string())
    }).optional()
  }),
  contentPublicationSchedule: z.object({
    frequency: z.string(),
    timezone: z.string().default('Asia/Manila')
  }),
  expertVoiceCharacteristics: z.object({
    tone: z.string(),
    expertise_level: z.string(),
    target_audience: z.string()
  }),
  browserFingerprintConfig: z.object({
    userAgent: z.string().optional(),
    viewport: z.object({
      width: z.number(),
      height: z.number()
    }).optional()
  })
});

// Get all expert personas
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const personas = await db.select().from(expertPersonas);
    
    logger.info(`Retrieved ${personas.length} expert personas`);
    res.json({
      success: true,
      data: personas,
      count: personas.length
    });
  } catch (error) {
    logger.error('Error fetching expert personas:', error);
    next(error);
  }
});

// Get expert persona by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const persona = await db.select()
      .from(expertPersonas)
      .where(eq(expertPersonas.id, id))
      .limit(1);
    
    if (persona.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expert persona not found'
      });
    }
    
    logger.info(`Retrieved expert persona: ${id}`);
    res.json({
      success: true,
      data: persona[0]
    });
  } catch (error) {
    logger.error(`Error fetching expert persona ${req.params.id}:`, error);
    next(error);
  }
});

// Create new expert persona
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createExpertPersonaSchema.parse(req.body);
    
    // Create encrypted placeholders for sensitive data
    const newPersona: NewExpertPersona = {
      ...validatedData,
      professionalBackgroundEncrypted: 'encrypted_placeholder',
      expertiseCredentialsEncrypted: 'encrypted_placeholder',
      marketExperienceEncrypted: 'encrypted_placeholder',
      personaEncryptionKeyId: `key_${Date.now()}`
    };
    
    const result = await db.insert(expertPersonas)
      .values(newPersona)
      .returning();
    
    logger.info(`Created expert persona: ${result[0].expertName} (${result[0].id})`);
    res.status(201).json({
      success: true,
      data: result[0],
      message: 'Expert persona created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    logger.error('Error creating expert persona:', error);
    next(error);
  }
});

// Update expert persona
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await db.update(expertPersonas)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(expertPersonas.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expert persona not found'
      });
    }
    
    logger.info(`Updated expert persona: ${id}`);
    res.json({
      success: true,
      data: result[0],
      message: 'Expert persona updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating expert persona ${req.params.id}:`, error);
    next(error);
  }
});

// Delete expert persona
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const result = await db.delete(expertPersonas)
      .where(eq(expertPersonas.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expert persona not found'
      });
    }
    
    logger.info(`Deleted expert persona: ${id}`);
    res.json({
      success: true,
      message: 'Expert persona deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting expert persona ${req.params.id}:`, error);
    next(error);
  }
});

export { router as expertPersonasRouter };