import { Router, Request, Response, NextFunction } from 'express';
import { db, authorityContentPublications } from '../db';
import { eq, and } from 'drizzle-orm';
import { logger } from '../services/logger';
import { z } from 'zod';

const router = Router();

// Validation schema
const createContentSchema = z.object({
  personaId: z.string().uuid(),
  platformAccountId: z.string().uuid(),
  contentTitle: z.string().min(1),
  contentType: z.enum(['article', 'answer', 'post', 'comment', 'guide']),
  contentCategory: z.string().optional(),
  contentUrl: z.string().url().optional(),
  contentLength: z.number().int().min(0).optional(),
  publicationStatus: z.enum(['draft', 'published', 'scheduled']).default('draft')
});

// Get content for a persona
router.get('/persona/:personaId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { personaId } = req.params;
    const { status, platform } = req.query;
    
    let query = db.select().from(authorityContentPublications)
      .where(eq(authorityContentPublications.personaId, personaId));
    
    if (status) {
      query = query.where(
        and(
          eq(authorityContentPublications.personaId, personaId),
          eq(authorityContentPublications.publicationStatus, status as string)
        )
      );
    }
    
    const content = await query;
    
    logger.info(`Retrieved ${content.length} content items for persona: ${personaId}`);
    res.json({
      success: true,
      data: content,
      count: content.length
    });
  } catch (error) {
    logger.error(`Error fetching content for persona ${req.params.personaId}:`, error);
    next(error);
  }
});

// Get all authority content
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, type } = req.query;
    
    let query = db.select().from(authorityContentPublications);
    
    if (status) {
      query = query.where(eq(authorityContentPublications.publicationStatus, status as string));
    }
    
    const content = await query;
    
    logger.info(`Retrieved ${content.length} content items`);
    res.json({
      success: true,
      data: content,
      count: content.length
    });
  } catch (error) {
    logger.error('Error fetching authority content:', error);
    next(error);
  }
});

// Get content by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const content = await db.select()
      .from(authorityContentPublications)
      .where(eq(authorityContentPublications.id, id))
      .limit(1);
    
    if (content.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    logger.info(`Retrieved content: ${id}`);
    res.json({
      success: true,
      data: content[0]
    });
  } catch (error) {
    logger.error(`Error fetching content ${req.params.id}:`, error);
    next(error);
  }
});

// Create new content
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createContentSchema.parse(req.body);
    
    const result = await db.insert(authorityContentPublications)
      .values(validatedData)
      .returning();
    
    logger.info(`Created content: ${result[0].contentTitle} (${result[0].id})`);
    res.status(201).json({
      success: true,
      data: result[0],
      message: 'Content created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    logger.error('Error creating content:', error);
    next(error);
  }
});

// Update content
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await db.update(authorityContentPublications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(authorityContentPublications.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    logger.info(`Updated content: ${id}`);
    res.json({
      success: true,
      data: result[0],
      message: 'Content updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating content ${req.params.id}:`, error);
    next(error);
  }
});

// Delete content
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const result = await db.delete(authorityContentPublications)
      .where(eq(authorityContentPublications.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    logger.info(`Deleted content: ${id}`);
    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting content ${req.params.id}:`, error);
    next(error);
  }
});

export { router as authorityContentRouter };