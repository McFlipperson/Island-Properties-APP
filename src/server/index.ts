import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { expertPersonasRouter } from './routes/expertPersonas';
import { geoPlatformAccountsRouter } from './routes/geoPlatformAccounts';
import { authorityContentRouter } from './routes/authorityContent';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './services/logger';

config();

const app = express();
const port = process.env.PORT || 3001;

// Security and CORS middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://your-domain.com'
    : ['http://localhost:3000', 'http://0.0.0.0:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'geo-expert-authority-app'
  });
});

// API routes
app.use('/api/expert-personas', expertPersonasRouter);
app.use('/api/geo-platform-accounts', geoPlatformAccountsRouter);
app.use('/api/authority-content', authorityContentRouter);

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