import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            expertId?: string;
            expertPersona?: {
                id: string;
                expertName: string;
                expertStatus: string | null;
            };
        }
    }
}
/**
 * Generate JWT token for expert authentication
 */
export declare function generateExpertToken(expertId: string, expertName: string): string;
/**
 * Authenticate expert access to dashboard endpoints
 * Validates JWT token and ensures expert exists in database
 */
export declare function authenticateExpert(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Authorize expert access to specific expert data
 * Ensures authenticated expert can only access their own data
 */
export declare function authorizeExpertAccess(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.d.ts.map