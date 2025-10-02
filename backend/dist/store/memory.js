"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.seedDevUser = seedDevUser;
exports.seedHighlights = seedHighlights;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.db = {
    users: new Map(),
    highlights: new Map(),
};
async function seedDevUser() {
    if (exports.db.users.size > 0)
        return;
    const passwordHash = await bcryptjs_1.default.hash('password', 10);
    const user = {
        id: 'u_1',
        email: 'demo@sportskalender.local',
        passwordHash,
        displayName: 'Demo User',
        role: 'user',
    };
    exports.db.users.set(user.email, user);
    const adminHash = await bcryptjs_1.default.hash('admin123', 10);
    const admin = {
        id: 'u_admin',
        email: 'admin@sportskalender.local',
        passwordHash: adminHash,
        displayName: 'Admin',
        role: 'admin',
    };
    exports.db.users.set(admin.email, admin);
}
function seedHighlights() {
    if (exports.db.highlights.size > 0)
        return;
    const items = [
        { id: 'h1', title: 'F1: Overtake of the Day', url: 'https://example.com/f1/overtake', sport: 'F1', description: 'Spektakuläres Überholmanöver', createdAt: new Date().toISOString() },
        { id: 'h2', title: 'NFL: Game-Winning Drive', url: 'https://example.com/nfl/drive', sport: 'NFL', description: 'Letzter Drive entscheidet', createdAt: new Date().toISOString() },
        { id: 'h3', title: 'Fußball: Traumtor', url: 'https://example.com/fussball/traumtor', sport: 'Fußball', description: 'Weitschuss in den Winkel', createdAt: new Date().toISOString() },
    ];
    for (const it of items) {
        exports.db.highlights.set(it.id, it);
    }
}
//# sourceMappingURL=memory.js.map