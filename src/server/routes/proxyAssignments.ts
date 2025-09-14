import { Router, Request, Response } from 'express';
import { db } from '../db/index';
import { proxyAssignments, expertPersonas } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '../services/logger';
import crypto from 'crypto';
import axios from 'axios';
import { HttpProxyAgent } from 'http-proxy-agent';

const router = Router();

// Manila Proxy Configuration
const MANILA_PROXY = {
  host: '95.135.113.91',
  port: '46137', 
  username: 'MkkW6ZQHCOcmsFS',
  password: process.env.MANILA_PROXY_PASSWORD || '',
  location: 'Manila, Philippines'
};

// Validation schemas
const assignProxySchema = z.object({
  personaId: z.string().uuid(),
  assignmentReason: z.string().optional()
});

const testProxySchema = z.object({
  host: z.string(),
  port: z.string(),
  username: z.string(),
  password: z.string()
});

// Secure encryption utility functions
function encrypt(text: string): string {
  const algorithm = 'aes-256-gcm';
  const key = process.env.MASTER_ENCRYPTION_KEY || 'default-key-for-dev-only-change-in-production';
  const keyBuffer = crypto.scryptSync(key, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  try {
    const algorithm = 'aes-256-gcm';
    const key = process.env.MASTER_ENCRYPTION_KEY || 'default-key-for-dev-only-change-in-production';
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);
    const textParts = encryptedText.split(':');
    
    if (textParts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(textParts[0], 'hex');
    const authTag = Buffer.from(textParts[1], 'hex');
    const encryptedData = textParts[2];
    
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Decryption failed', { error: (error as Error).message });
    return '';
  }
}

// Interface for geo API response
interface GeoResponse {
  status: string;
  message?: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  lat: number;
  lon: number;
  timezone: string;
  query: string;
}

// Secure proxy connection test using axios with HttpProxyAgent
async function testProxyConnection(host: string, port: string, username: string, password: string): Promise<{
  success: boolean;
  responseTime: number;
  geoData?: any;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    logger.info('Testing proxy connection', { host, port, username: username.substring(0, 4) + '***' });
    
    // Create proxy agent with authentication
    const proxyUrl = `http://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}`;
    const proxyAgent = new HttpProxyAgent(proxyUrl);
    
    // Test proxy connection with geo IP lookup using axios instance with proxy agent
    const axiosInstance = axios.create({
      timeout: 25000,
      httpAgent: proxyAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    } as any);
    
    const response = await axiosInstance.get<GeoResponse>('http://ip-api.com/json/', {
      params: {
        fields: 'status,message,country,countryCode,region,regionName,city,lat,lon,timezone,query'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.data) {
      return {
        success: false,
        responseTime,
        error: 'No response data from geo service'
      };
    }
    
    const geoData = response.data;
    
    if (geoData.status === 'success') {
      const isPhilippines = geoData.countryCode === 'PH';
      
      logger.info('Proxy geo verification', {
        country: geoData.country,
        region: geoData.regionName,
        city: geoData.city,
        isPhilippines,
        responseTime
      });
      
      return {
        success: true,
        responseTime,
        geoData: {
          country: geoData.country,
          countryCode: geoData.countryCode,
          region: geoData.regionName,
          city: geoData.city,
          ip: geoData.query,
          isPhilippines
        }
      };
    } else {
      return {
        success: false,
        responseTime,
        error: geoData.message || 'Geo lookup failed'
      };
    }
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;
    let errorMessage = 'Unknown error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific error codes
      const anyError = error as any;
      if (anyError.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout';
      } else if (anyError.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused by proxy';
      } else if (anyError.response) {
        errorMessage = `HTTP ${anyError.response.status}: ${anyError.response.statusText}`;
      } else if (anyError.request && !anyError.response) {
        errorMessage = 'No response received from proxy';
      }
    }
    
    logger.error('Proxy test failed', { 
      error: errorMessage, 
      responseTime,
      host,
      port
    });
    
    return {
      success: false,
      responseTime,
      error: errorMessage
    };
  }
}

// GET /api/proxy-assignments - Get all proxy assignments
router.get('/', async (req: Request, res: Response) => {
  try {
    const assignments = await db
      .select({
        id: proxyAssignments.id,
        personaId: proxyAssignments.personaId,
        assignmentStatus: proxyAssignments.assignmentStatus,
        proxyLocation: proxyAssignments.proxyLocation,
        proxyStatus: proxyAssignments.proxyStatus,
        isPhilippinesVerified: proxyAssignments.isPhilippinesVerified,
        detectedCountry: proxyAssignments.detectedCountry,
        detectedCity: proxyAssignments.detectedCity,
        averageResponseTime: proxyAssignments.averageResponseTime,
        connectionSuccessRate: proxyAssignments.connectionSuccessRate,
        lastHealthCheck: proxyAssignments.lastHealthCheck,
        healthCheckStatus: proxyAssignments.healthCheckStatus,
        createdAt: proxyAssignments.createdAt,
        updatedAt: proxyAssignments.updatedAt,
        // Join expert data
        expertName: expertPersonas.expertName
      })
      .from(proxyAssignments)
      .leftJoin(expertPersonas, eq(proxyAssignments.personaId, expertPersonas.id));

    logger.info(`Retrieved ${assignments.length} proxy assignments`);

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    logger.error('Failed to fetch proxy assignments', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch proxy assignments'
    });
  }
});

// GET /api/proxy-assignments/:personaId - Get proxy assignment for a specific expert
router.get('/expert/:personaId', async (req: Request, res: Response) => {
  try {
    const { personaId } = req.params;

    const assignment = await db
      .select()
      .from(proxyAssignments)
      .where(eq(proxyAssignments.personaId, personaId))
      .limit(1);

    if (assignment.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No proxy assigned to this expert'
      });
    }

    const assignmentData = assignment[0];
    
    // Return assignment without sensitive credentials
    const safeAssignment = {
      id: assignmentData.id,
      personaId: assignmentData.personaId,
      assignmentStatus: assignmentData.assignmentStatus,
      proxyLocation: assignmentData.proxyLocation,
      proxyStatus: assignmentData.proxyStatus,
      isPhilippinesVerified: assignmentData.isPhilippinesVerified,
      detectedCountry: assignmentData.detectedCountry,
      detectedCity: assignmentData.detectedCity,
      detectedRegion: assignmentData.detectedRegion,
      averageResponseTime: assignmentData.averageResponseTime,
      connectionSuccessRate: assignmentData.connectionSuccessRate,
      lastHealthCheck: assignmentData.lastHealthCheck,
      healthCheckStatus: assignmentData.healthCheckStatus,
      consecutiveFailures: assignmentData.consecutiveFailures,
      createdAt: assignmentData.createdAt,
      updatedAt: assignmentData.updatedAt
    };

    res.json({
      success: true,
      data: safeAssignment
    });
  } catch (error) {
    logger.error('Failed to fetch expert proxy assignment', { 
      personaId: req.params.personaId,
      error: (error as Error).message 
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch proxy assignment'
    });
  }
});

// POST /api/proxy-assignments/assign - Assign Manila proxy to expert
router.post('/assign', async (req: Request, res: Response) => {
  try {
    const validatedData = assignProxySchema.parse(req.body);
    const { personaId, assignmentReason = 'Manila proxy assignment for Philippines authority building' } = validatedData;

    // Check if expert exists
    const expert = await db
      .select()
      .from(expertPersonas)
      .where(eq(expertPersonas.id, personaId))
      .limit(1);

    if (expert.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Expert not found'
      });
    }

    // Check if proxy already assigned
    const existing = await db
      .select()
      .from(proxyAssignments)
      .where(eq(proxyAssignments.personaId, personaId))
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Expert already has a proxy assignment'
      });
    }

    // Validate Manila proxy credentials
    if (!MANILA_PROXY.password) {
      return res.status(500).json({
        success: false,
        error: 'Manila proxy password not configured in environment'
      });
    }

    // Create proxy assignment with "testing" status
    const [newAssignment] = await db
      .insert(proxyAssignments)
      .values({
        personaId,
        proxyCheapId: 'manila-static-01',
        proxyProvider: 'proxy-cheap',
        proxyType: 'residential',
        proxyLocation: MANILA_PROXY.location,
        assignmentStatus: 'testing',
        proxyStatus: 'inactive',
        proxyHostEncrypted: encrypt(MANILA_PROXY.host),
        proxyPortEncrypted: encrypt(MANILA_PROXY.port),
        proxyUsernameEncrypted: encrypt(MANILA_PROXY.username),
        proxyPasswordEncrypted: encrypt(MANILA_PROXY.password),
        assignmentReason,
        encryptionKeyId: 'master-key-001',
        assignedAt: new Date()
      })
      .returning();

    logger.info('Created proxy assignment for expert', {
      expertId: personaId,
      expertName: expert[0].expertName,
      assignmentId: newAssignment.id
    });

    // Start asynchronous proxy testing
    setImmediate(async () => {
      try {
        logger.info('Starting proxy health test', { assignmentId: newAssignment.id });
        
        const testResult = await testProxyConnection(
          MANILA_PROXY.host,
          MANILA_PROXY.port,
          MANILA_PROXY.username,
          MANILA_PROXY.password
        );

        // Update assignment based on test result AND location verification
        if (testResult.success && testResult.geoData?.isPhilippines === true) {
          await db
            .update(proxyAssignments)
            .set({
              assignmentStatus: 'active',
              proxyStatus: 'active',
              healthCheckStatus: 'healthy',
              lastHealthCheck: new Date(),
              detectedCountry: testResult.geoData.countryCode,
              detectedCity: testResult.geoData.city,
              detectedRegion: testResult.geoData.region,
              isPhilippinesVerified: true,
              averageResponseTime: testResult.responseTime,
              connectionSuccessRate: '100.00',
              consecutiveFailures: 0,
              activatedAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(proxyAssignments.id, newAssignment.id));

          logger.info('Proxy test successful and Philippines location verified - assignment activated', {
            assignmentId: newAssignment.id,
            responseTime: testResult.responseTime,
            location: `${testResult.geoData.city}, ${testResult.geoData.country}`,
            isPhilippines: testResult.geoData.isPhilippines
          });
        } else {
          // Determine failure reason
          let failureReason = 'Connection test failed';
          if (testResult.success && testResult.geoData?.isPhilippines === false) {
            failureReason = `Location verification failed: detected ${testResult.geoData.country} instead of Philippines`;
          } else if (testResult.error) {
            failureReason = testResult.error;
          }
          
          await db
            .update(proxyAssignments)
            .set({
              assignmentStatus: 'failed',
              proxyStatus: 'failed',
              healthCheckStatus: 'failed',
              lastHealthCheck: new Date(),
              detectedCountry: testResult.geoData?.countryCode || null,
              detectedCity: testResult.geoData?.city || null,
              detectedRegion: testResult.geoData?.region || null,
              isPhilippinesVerified: testResult.geoData?.isPhilippines || false,
              statusChangeReason: failureReason,
              consecutiveFailures: 1,
              updatedAt: new Date()
            })
            .where(eq(proxyAssignments.id, newAssignment.id));

          logger.error('Proxy assignment failed', {
            assignmentId: newAssignment.id,
            reason: failureReason,
            responseTime: testResult.responseTime,
            detectedLocation: testResult.geoData ? `${testResult.geoData.city}, ${testResult.geoData.country}` : 'unknown',
            isPhilippines: testResult.geoData?.isPhilippines
          });
        }
      } catch (testError) {
        logger.error('Proxy test process failed', {
          assignmentId: newAssignment.id,
          error: (testError as Error).message
        });
        
        await db
          .update(proxyAssignments)
          .set({
            assignmentStatus: 'failed',
            proxyStatus: 'failed',
            healthCheckStatus: 'failed',
            lastHealthCheck: new Date(),
            statusChangeReason: `Test process failed: ${(testError as Error).message}`,
            consecutiveFailures: 1,
            updatedAt: new Date()
          })
          .where(eq(proxyAssignments.id, newAssignment.id));
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: newAssignment.id,
        personaId: newAssignment.personaId,
        assignmentStatus: newAssignment.assignmentStatus,
        proxyLocation: newAssignment.proxyLocation,
        proxyStatus: newAssignment.proxyStatus,
        assignedAt: newAssignment.assignedAt
      },
      message: 'Proxy assignment created and testing in progress'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    logger.error('Failed to assign proxy', { error: (error as Error).message, stack: (error as Error).stack });
    res.status(500).json({
      success: false,
      error: 'Failed to assign proxy'
    });
  }
});

// POST /api/proxy-assignments/:id/test - Test proxy connection
router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const assignment = await db
      .select()
      .from(proxyAssignments)
      .where(eq(proxyAssignments.id, id))
      .limit(1);

    if (assignment.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Proxy assignment not found'
      });
    }

    const assignmentData = assignment[0];
    
    // Decrypt credentials for testing
    const host = decrypt(assignmentData.proxyHostEncrypted || '');
    const port = decrypt(assignmentData.proxyPortEncrypted || '');
    const username = decrypt(assignmentData.proxyUsernameEncrypted || '');
    const password = decrypt(assignmentData.proxyPasswordEncrypted || '');

    if (!host || !port || !username || !password) {
      return res.status(500).json({
        success: false,
        error: 'Failed to decrypt proxy credentials'
      });
    }

    // Update status to testing
    await db
      .update(proxyAssignments)
      .set({
        assignmentStatus: 'testing',
        lastHealthCheck: new Date(),
        updatedAt: new Date()
      })
      .where(eq(proxyAssignments.id, id));

    // Perform test
    const testResult = await testProxyConnection(host, port, username, password);

    // Update assignment based on test result AND location verification
    if (testResult.success && testResult.geoData?.isPhilippines === true) {
      await db
        .update(proxyAssignments)
        .set({
          assignmentStatus: 'active',
          proxyStatus: 'active',
          healthCheckStatus: 'healthy',
          detectedCountry: testResult.geoData.countryCode,
          detectedCity: testResult.geoData.city,
          detectedRegion: testResult.geoData.region,
          isPhilippinesVerified: true,
          averageResponseTime: testResult.responseTime,
          connectionSuccessRate: '100.00',
          consecutiveFailures: 0,
          lastHealthCheck: new Date(),
          updatedAt: new Date()
        })
        .where(eq(proxyAssignments.id, id));
    } else {
      // Determine failure reason
      let failureReason = 'Connection test failed';
      if (testResult.success && testResult.geoData?.isPhilippines === false) {
        failureReason = `Location verification failed: detected ${testResult.geoData.country} instead of Philippines`;
      } else if (testResult.error) {
        failureReason = testResult.error;
      }
      
      await db
        .update(proxyAssignments)
        .set({
          assignmentStatus: 'failed',
          proxyStatus: 'failed',
          healthCheckStatus: 'failed',
          detectedCountry: testResult.geoData?.countryCode || null,
          detectedCity: testResult.geoData?.city || null,
          detectedRegion: testResult.geoData?.region || null,
          isPhilippinesVerified: testResult.geoData?.isPhilippines || false,
          statusChangeReason: failureReason,
          consecutiveFailures: (assignmentData.consecutiveFailures || 0) + 1,
          lastHealthCheck: new Date(),
          updatedAt: new Date()
        })
        .where(eq(proxyAssignments.id, id));
    }

    logger.info('Proxy test completed', {
      assignmentId: id,
      success: testResult.success,
      responseTime: testResult.responseTime,
      error: testResult.error
    });

    res.json({
      success: true,
      data: {
        testSuccess: testResult.success,
        responseTime: testResult.responseTime,
        geoData: testResult.geoData,
        error: testResult.error
      }
    });

  } catch (error) {
    logger.error('Failed to test proxy', { assignmentId: req.params.id, error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: 'Failed to test proxy connection'
    });
  }
});

// DELETE /api/proxy-assignments/:id - Remove proxy assignment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const assignment = await db
      .select()
      .from(proxyAssignments)
      .where(eq(proxyAssignments.id, id))
      .limit(1);

    if (assignment.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Proxy assignment not found'
      });
    }

    await db
      .delete(proxyAssignments)
      .where(eq(proxyAssignments.id, id));

    logger.info('Deleted proxy assignment', {
      assignmentId: id,
      personaId: assignment[0].personaId
    });

    res.json({
      success: true,
      message: 'Proxy assignment removed successfully'
    });

  } catch (error) {
    logger.error('Failed to delete proxy assignment', { 
      assignmentId: req.params.id,
      error: (error as Error).message 
    });
    res.status(500).json({
      success: false,
      error: 'Failed to remove proxy assignment'
    });
  }
});

// POST /api/proxy-assignments/health-check - Run health check on all active proxies
router.post('/health-check', async (req: Request, res: Response) => {
  try {
    const activeAssignments = await db
      .select()
      .from(proxyAssignments)
      .where(eq(proxyAssignments.proxyStatus, 'active'));

    logger.info(`Starting health check for ${activeAssignments.length} active proxy assignments`);

    const results: any[] = [];

    for (const assignment of activeAssignments) {
      try {
        // Decrypt credentials
        const host = decrypt(assignment.proxyHostEncrypted || '');
        const port = decrypt(assignment.proxyPortEncrypted || '');
        const username = decrypt(assignment.proxyUsernameEncrypted || '');
        const password = decrypt(assignment.proxyPasswordEncrypted || '');

        if (!host || !port || !username || !password) {
          results.push({
            assignmentId: assignment.id,
            success: false,
            error: 'Failed to decrypt credentials'
          });
          continue;
        }

        const testResult = await testProxyConnection(host, port, username, password);

        // Update assignment based on result
        if (testResult.success) {
          await db
            .update(proxyAssignments)
            .set({
              proxyStatus: 'active',
              healthCheckStatus: 'healthy',
              averageResponseTime: testResult.responseTime,
              consecutiveFailures: 0,
              lastHealthCheck: new Date(),
              updatedAt: new Date()
            })
            .where(eq(proxyAssignments.id, assignment.id));
        } else {
          const newFailureCount = (assignment.consecutiveFailures || 0) + 1;
          await db
            .update(proxyAssignments)
            .set({
              proxyStatus: newFailureCount >= 3 ? 'failed' : 'active',
              healthCheckStatus: 'failed',
              consecutiveFailures: newFailureCount,
              statusChangeReason: testResult.error || 'Health check failed',
              lastHealthCheck: new Date(),
              updatedAt: new Date()
            })
            .where(eq(proxyAssignments.id, assignment.id));
        }

        results.push({
          assignmentId: assignment.id,
          success: testResult.success,
          responseTime: testResult.responseTime,
          error: testResult.error
        });

      } catch (error) {
        logger.error('Health check failed for assignment', {
          assignmentId: assignment.id,
          error: (error as Error).message
        });
        
        results.push({
          assignmentId: assignment.id,
          success: false,
          error: (error as Error).message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    logger.info('Health check completed', {
      total: results.length,
      successful: successCount,
      failed: failureCount
    });

    res.json({
      success: true,
      data: {
        totalChecked: results.length,
        successful: successCount,
        failed: failureCount,
        results
      },
      message: `Health check completed: ${successCount}/${results.length} proxies healthy`
    });

  } catch (error) {
    logger.error('Failed to run health check', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: 'Failed to run proxy health check'
    });
  }
});

export default router;