"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
const expertPersonas_1 = require("./routes/expertPersonas");
const geoPlatformAccounts_1 = require("./routes/geoPlatformAccounts");
const authorityContent_1 = require("./routes/authorityContent");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./services/logger");
const db_1 = require("./db");
(0, dotenv_1.config)();
// Fail fast if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
    logger_1.logger.error('DATABASE_URL environment variable is required');
    process.exit(1);
}
const app = (0, express_1.default)();
const port = process.env.PORT || (process.env.NODE_ENV === 'production' ? 5000 : 3001);
// Security and CORS middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || 'https://your-domain.com'
        : ['http://localhost:3000', 'http://0.0.0.0:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
// Body parsing middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging
app.use((req, res, next) => {
    logger_1.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});
// Health check endpoint with database connectivity check
app.get('/health', async (req, res) => {
    try {
        // Simple database connectivity check using existing table
        await db_1.db.select().from(db_1.expertPersonas).limit(1);
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'geo-expert-authority-app',
            database: 'connected'
        });
    }
    catch (error) {
        logger_1.logger.error('Database health check failed:', error);
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            service: 'geo-expert-authority-app',
            database: 'disconnected',
            error: 'Database connection failed'
        });
    }
});
// In production, serve static files from the built client
if (process.env.NODE_ENV === 'production') {
    const clientDistPath = path_1.default.join(__dirname, '..', 'client');
    app.use(express_1.default.static(clientDistPath));
    // Handle client-side routing - serve index.html for non-API routes
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
            next();
        }
        else {
            res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
        }
    });
}
// API routes
app.use('/api/expert-personas', expertPersonas_1.expertPersonasRouter);
app.use('/api/geo-platform-accounts', geoPlatformAccounts_1.geoPlatformAccountsRouter);
app.use('/api/authority-content', authorityContent_1.authorityContentRouter);
// Error handling
app.use(errorHandler_1.errorHandler);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
    });
});
app.listen(port, () => {
    logger_1.logger.info(`🚀 Server running on port ${port}`);
    logger_1.logger.info(`📊 Health check available at http://localhost:${port}/health`);
    logger_1.logger.info(`🏗️  API endpoints available at http://localhost:${port}/api`);
});
exports.default = app;
//# sourceMappingURL=index.js.map