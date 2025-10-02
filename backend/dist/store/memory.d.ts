export interface User {
    id: string;
    email: string;
    passwordHash: string;
    displayName: string;
    role: 'user' | 'admin';
}
export declare const db: {
    users: Map<string, User>;
    highlights: Map<string, HighlightItem>;
};
export interface HighlightItem {
    id: string;
    title: string;
    url: string;
    sport: string;
    description?: string;
    createdAt: string;
}
export declare function seedDevUser(): Promise<void>;
export declare function seedHighlights(): void;
//# sourceMappingURL=memory.d.ts.map