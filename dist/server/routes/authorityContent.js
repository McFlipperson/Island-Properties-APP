"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorityContentRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const logger_1 = require("../services/logger");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
exports.authorityContentRouter = router;
// Validation schema
const createContentSchema = zod_1.z.object({
    personaId: zod_1.z.string().uuid(),
    platformAccountId: zod_1.z.string().uuid(),
    contentTitle: zod_1.z.string().min(1),
    contentType: zod_1.z.enum(['article', 'answer', 'post', 'comment', 'guide']),
    contentCategory: zod_1.z.string().optional(),
    contentUrl: zod_1.z.string().url().optional(),
    contentLength: zod_1.z.number().int().min(0).optional(),
    publicationStatus: zod_1.z.enum(['draft', 'published', 'scheduled']).default('draft')
});
// Get content for a persona
router.get('/persona/:personaId', async (req, res, next) => {
    try {
        const { personaId } = req.params;
        const { status, platform } = req.query;
        let query = db_1.db.select().from(db_1.authorityContentPublications)
            .where((0, drizzle_orm_1.eq)(db_1.authorityContentPublications.personaId, personaId));
        if (status) {
            query = query.where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.authorityContentPublications.personaId, personaId), (0, drizzle_orm_1.eq)(db_1.authorityContentPublications.publicationStatus, status)));
        }
        const content = await query;
        logger_1.logger.info(`Retrieved ${content.length} content items for persona: ${personaId}`);
        res.json({
            success: true,
            data: content,
            count: content.length
        });
    }
    catch (error) {
        logger_1.logger.error(`Error fetching content for persona ${req.params.personaId}:`, error);
        next(error);
    }
});
// Get all authority content
router.get('/', async (req, res, next) => {
    try {
        const { status, type } = req.query;
        let query = db_1.db.select().from(db_1.authorityContentPublications);
        if (status) {
            query = query.where((0, drizzle_orm_1.eq)(db_1.authorityContentPublications.publicationStatus, status));
        }
        const content = await query;
        logger_1.logger.info(`Retrieved ${content.length} content items`);
        res.json({
            success: true,
            data: content,
            count: content.length
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching authority content:', error);
        next(error);
    }
});
// Get content by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const content = await db_1.db.select()
            .from(db_1.authorityContentPublications)
            .where((0, drizzle_orm_1.eq)(db_1.authorityContentPublications.id, id))
            .limit(1);
        if (content.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        logger_1.logger.info(`Retrieved content: ${id}`);
        res.json({
            success: true,
            data: content[0]
        });
    }
    catch (error) {
        logger_1.logger.error(`Error fetching content ${req.params.id}:`, error);
        next(error);
    }
});
// Create new content
router.post('/', async (req, res, next) => {
    try {
        const validatedData = createContentSchema.parse(req.body);
        const result = await db_1.db.insert(db_1.authorityContentPublications)
            .values(validatedData)
            .returning();
        logger_1.logger.info(`Created content: ${result[0].contentTitle} (${result[0].id})`);
        res.status(201).json({
            success: true,
            data: result[0],
            message: 'Content created successfully'
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
        }
        logger_1.logger.error('Error creating content:', error);
        next(error);
    }
});
// Update content
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const result = await db_1.db.update(db_1.authorityContentPublications)
            .set({ ...updates, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(db_1.authorityContentPublications.id, id))
            .returning();
        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        logger_1.logger.info(`Updated content: ${id}`);
        res.json({
            success: true,
            data: result[0],
            message: 'Content updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error(`Error updating content ${req.params.id}:`, error);
        next(error);
    }
});
// Delete content
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db_1.db.delete(db_1.authorityContentPublications)
            .where((0, drizzle_orm_1.eq)(db_1.authorityContentPublications.id, id))
            .returning();
        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        logger_1.logger.info(`Deleted content: ${id}`);
        res.json({
            success: true,
            message: 'Content deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error(`Error deleting content ${req.params.id}:`, error);
        next(error);
    }
});
//# sourceMappingURL=authorityContent.js.map