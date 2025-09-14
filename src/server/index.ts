import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import path from 'path';
import { expertPersonasRouter } from './routes/expertPersonas';
import { geoPlatformAccountsRouter } from './routes/geoPlatformAccounts';
import { authorityContentRouter } from './routes/authorityContent';
import { webhooksRouter } from './routes/webhooks';
import { dashboardRouter } from './routes/dashboard';
import proxyAssignmentsRouter from './routes/proxyAssignments';
import { errorHandler } from './middleware/errorHandler';
import { captureRawBody } from './middleware/twilioSignatureValidation';
import { logger } from './services/logger';
import { db, expertPersonas } from './db';

config();

// Fail fast if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  logger.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || (process.env.NODE_ENV === 'production' ? 5000 : 3001);

// Security and CORS middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://your-domain.com'
    : ['http://localhost:5000', 'http://0.0.0.0:5000', 'http://127.0.0.1:5000', 'http://localhost:3000', 'http://0.0.0.0:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Raw body capture for webhook signature validation (must be before express.json)
app.use('/api/webhooks', captureRawBody);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint with database connectivity check
app.get('/health', async (req, res) => {
  try {
    // Simple database connectivity check using existing table
    await db.select().from(expertPersonas).limit(1);
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'geo-expert-authority-app',
      database: 'connected'
    });
  } catch (error) {
    logger.error('Database health check failed:', error);
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
  const clientDistPath = path.join(__dirname, '..', 'client');
  app.use(express.static(clientDistPath));
  
  // Handle client-side routing - serve index.html for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      next();
    } else {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

// API routes
app.use('/api/expert-personas', expertPersonasRouter);
app.use('/api/geo-platform-accounts', geoPlatformAccountsRouter);
app.use('/api/authority-content', authorityContentRouter);
app.use('/api/proxy-assignments', proxyAssignmentsRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/dashboard', dashboardRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  logger.info(`🚀 Server running on port ${port}`);
  logger.info(`📊 Health check available at http://localhost:${port}/health`);
  logger.info(`🏗️  API endpoints available at http://localhost:${port}/api`);
});

export default app;