import { Request, Response, NextFunction } from 'express';
export interface JwtUser {
    id: string;
    email: string;
    role?: 'user' | 'admin';
    iat?: number;
    exp?: number;
}
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function requireRole(role: 'user' | 'admin'): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.d.ts.map