"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expertPersonasRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const logger_1 = require("../services/logger");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
exports.expertPersonasRouter = router;
// Validation schemas
const createExpertPersonaSchema = zod_1.z.object({
    expertName: zod_1.z.string().min(1).max(100),
    expertiseFocus: zod_1.z.string().min(1).max(50),
    targetBuyerSegments: zod_1.z.array(zod_1.z.string()),
    primaryMarketLocation: zod_1.z.string().min(1).max(50),
    geoContentSpecializations: zod_1.z.array(zod_1.z.string()),
    authorityBuildingTopics: zod_1.z.array(zod_1.z.string()),
    citationWorthyExpertise: zod_1.z.array(zod_1.z.string()),
    platformExpertiseFocus: zod_1.z.object({
        medium: zod_1.z.object({
            active: zod_1.z.boolean(),
            contentTypes: zod_1.z.array(zod_1.z.string())
        }).optional(),
        reddit: zod_1.z.object({
            active: zod_1.z.boolean(),
            subreddits: zod_1.z.array(zod_1.z.string())
        }).optional(),
        quora: zod_1.z.object({
            active: zod_1.z.boolean(),
            topics: zod_1.z.array(zod_1.z.string())
        }).optional()
    }),
    contentPublicationSchedule: zod_1.z.object({
        frequency: zod_1.z.string(),
        timezone: zod_1.z.string().default('Asia/Manila')
    }),
    expertVoiceCharacteristics: zod_1.z.object({
        tone: zod_1.z.string(),
        expertise_level: zod_1.z.string(),
        target_audience: zod_1.z.string()
    }),
    browserFingerprintConfig: zod_1.z.object({
        userAgent: zod_1.z.string().optional(),
        viewport: zod_1.z.object({
            width: zod_1.z.number(),
            height: zod_1.z.number()
        }).optional()
    })
});
// Get all expert personas
router.get('/', async (req, res, next) => {
    try {
        const personas = await db_1.db.select().from(db_1.expertPersonas);
        logger_1.logger.info(`Retrieved ${personas.length} expert personas`);
        res.json({
            success: true,
            data: personas,
            count: personas.length
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching expert personas:', error);
        next(error);
    }
});
// Get expert persona by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const persona = await db_1.db.select()
            .from(db_1.expertPersonas)
            .where((0, drizzle_orm_1.eq)(db_1.expertPersonas.id, id))
            .limit(1);
        if (persona.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expert persona not found'
            });
        }
        logger_1.logger.info(`Retrieved expert persona: ${id}`);
        res.json({
            success: true,
            data: persona[0]
        });
    }
    catch (error) {
        logger_1.logger.error(`Error fetching expert persona ${req.params.id}:`, error);
        next(error);
    }
});
// Create new expert persona
router.post('/', async (req, res, next) => {
    try {
        const validatedData = createExpertPersonaSchema.parse(req.body);
        // Create encrypted placeholders for sensitive data
        const newPersona = {
            ...validatedData,
            professionalBackgroundEncrypted: 'encrypted_placeholder',
            expertiseCredentialsEncrypted: 'encrypted_placeholder',
            marketExperienceEncrypted: 'encrypted_placeholder',
            personaEncryptionKeyId: `key_${Date.now()}`
        };
        const result = await db_1.db.insert(db_1.expertPersonas)
            .values(newPersona)
            .returning();
        logger_1.logger.info(`Created expert persona: ${result[0].expertName} (${result[0].id})`);
        res.status(201).json({
            success: true,
            data: result[0],
            message: 'Expert persona created successfully'
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
        logger_1.logger.error('Error creating expert persona:', error);
        next(error);
    }
});
// Update expert persona
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const result = await db_1.db.update(db_1.expertPersonas)
            .set({ ...updates, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(db_1.expertPersonas.id, id))
            .returning();
        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expert persona not found'
            });
        }
        logger_1.logger.info(`Updated expert persona: ${id}`);
        res.json({
            success: true,
            data: result[0],
            message: 'Expert persona updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error(`Error updating expert persona ${req.params.id}:`, error);
        next(error);
    }
});
// Delete expert persona
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db_1.db.delete(db_1.expertPersonas)
            .where((0, drizzle_orm_1.eq)(db_1.expertPersonas.id, id))
            .returning();
        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expert persona not found'
            });
        }
        logger_1.logger.info(`Deleted expert persona: ${id}`);
        res.json({
            success: true,
            message: 'Expert persona deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error(`Error deleting expert persona ${req.params.id}:`, error);
        next(error);
    }
});
//# sourceMappingURL=expertPersonas.js.map