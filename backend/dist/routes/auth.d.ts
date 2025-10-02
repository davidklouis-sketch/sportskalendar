import { Response } from 'express';
export declare const authRouter: import("express-serve-static-core").Router;
export declare function signAccess(user: {
    id: string;
    email: string;
    role?: 'user' | 'admin';
}): string;
export declare function signRefresh(user: {
    id: string;
    email: string;
    role?: 'user' | 'admin';
}): string;
export declare function setAuthCookies(res: Response, tokens: {
    access: string;
    refresh: string;
}): void;
//# sourceMappingURL=auth.d.ts.map