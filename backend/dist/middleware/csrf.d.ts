import { Request, Response, NextFunction } from 'express';
export declare function issueCsrfToken(req: Request, res: Response): any;
export declare function csrfProtection(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
//# sourceMappingURL=csrf.d.ts.map