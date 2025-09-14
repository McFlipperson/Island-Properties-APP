"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geoPlatformAccountsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const logger_1 = require("../services/logger");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
exports.geoPlatformAccountsRouter = router;
// Validation schema
const createPlatformAccountSchema = zod_1.z.object({
    personaId: zod_1.z.string().uuid(),
    platformType: zod_1.z.enum(['medium', 'reddit', 'quora', 'facebook', 'linkedin']),
    platformPriority: zod_1.z.number().int().min(1).max(10),
    username: zod_1.z.string().min(1).max(100),
    displayName: zod_1.z.string().max(100).optional(),
    expertBio: zod_1.z.string().optional(),
    expertCredentials: zod_1.z.string().optional(),
    platformGeoSettings: zod_1.z.object({
        targetRegions: zod_1.z.array(zod_1.z.string()),
        contentLanguage: zod_1.z.string().default('en-PH'),
        timezoneFocus: zod_1.z.string().default('Asia/Manila')
    }),
    contentAuthorityStrategy: zod_1.z.object({
        contentTypes: zod_1.z.array(zod_1.z.string()),
        publicationFrequency: zod_1.z.string(),
        expertiseAreas: zod_1.z.array(zod_1.z.string())
    }),
    expertEngagementApproach: zod_1.z.object({
        responseStyle: zod_1.z.string(),
        engagementLevel: zod_1.z.enum(['low', 'medium', 'high']),
        communityParticipation: zod_1.z.boolean()
    }),
    citationOptimizationConfig: zod_1.z.object({
        keywordTargets: zod_1.z.array(zod_1.z.string()),
        contentDepth: zod_1.z.enum(['comprehensive', 'detailed', 'summary']),
        authoritySignals: zod_1.z.array(zod_1.z.string())
    })
});
// Get platform accounts for a persona
router.get('/persona/:personaId', async (req, res, next) => {
    try {
        const { personaId } = req.params;
        const accounts = await db_1.db.select()
            .from(db_1.geoPlatformAccounts)
            .where((0, drizzle_orm_1.eq)(db_1.geoPlatformAccounts.personaId, personaId));
        logger_1.logger.info(`Retrieved ${accounts.length} platform accounts for persona: ${personaId}`);
        res.json({
            success: true,
            data: accounts,
            count: accounts.length
        });
    }
    catch (error) {
        logger_1.logger.error(`Error fetching platform accounts for persona ${req.params.personaId}:`, error);
        next(error);
    }
});
// Get all platform accounts
router.get('/', async (req, res, next) => {
    try {
        const { platform, status } = req.query;
        let query = db_1.db.select().from(db_1.geoPlatformAccounts);
        if (platform) {
            query = query.where((0, drizzle_orm_1.eq)(db_1.geoPlatformAccounts.platformType, platform));
        }
        const accounts = await query;
        logger_1.logger.info(`Retrieved ${accounts.length} platform accounts`);
        res.json({
            success: true,
            data: accounts,
            count: accounts.length
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching platform accounts:', error);
        next(error);
    }
});
// Get platform account by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const account = await db_1.db.select()
            .from(db_1.geoPlatformAccounts)
            .where((0, drizzle_orm_1.eq)(db_1.geoPlatformAccounts.id, id))
            .limit(1);
        if (account.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Platform account not found'
            });
        }
        logger_1.logger.info(`Retrieved platform account: ${id}`);
        res.json({
            success: true,
            data: account[0]
        });
    }
    catch (error) {
        logger_1.logger.error(`Error fetching platform account ${req.params.id}:`, error);
        next(error);
    }
});
// Create new platform account
router.post('/', async (req, res, next) => {
    try {
        const validatedData = createPlatformAccountSchema.parse(req.body);
        const newAccount = {
            ...validatedData,
            credentialsEncrypted: 'encrypted_placeholder', // Will be properly encrypted in production
            accountStatus: 'building',
            platformAuthorityLevel: 'newcomer',
            expertVerificationStatus: 'unverified'
        };
        const result = await db_1.db.insert(db_1.geoPlatformAccounts)
            .values(newAccount)
            .returning();
        logger_1.logger.info(`Created platform account: ${result[0].username} on ${result[0].platformType} (${result[0].id})`);
        res.status(201).json({
            success: true,
            data: result[0],
            message: 'Platform account created successfully'
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
        logger_1.logger.error('Error creating platform account:', error);
        next(error);
    }
});
// Update platform account
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const result = await db_1.db.update(db_1.geoPlatformAccounts)
            .set({ ...updates, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(db_1.geoPlatformAccounts.id, id))
            .returning();
        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Platform account not found'
            });
        }
        logger_1.logger.info(`Updated platform account: ${id}`);
        res.json({
            success: true,
            data: result[0],
            message: 'Platform account updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error(`Error updating platform account ${req.params.id}:`, error);
        next(error);
    }
});
//# sourceMappingURL=geoPlatformAccounts.js.map