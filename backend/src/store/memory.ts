import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'user' | 'admin';
}

export const db = {
  users: new Map<string, User>(),
  highlights: new Map<string, HighlightItem>(),
};

export interface HighlightItem {
  id: string;
  title: string;
  url: string;
  sport: string;
  description?: string;
  createdAt: string;
}

export async function seedDevUser() {
  if (db.users.size > 0) return;
  const passwordHash = await bcrypt.hash('password', 10);
  const user: User = {
    id: 'u_1',
    email: 'demo@sportskalender.local',
    passwordHash,
    displayName: 'Demo User',
    role: 'user',
  };
  db.users.set(user.email, user);

  const adminHash = await bcrypt.hash('admin123', 10);
  const admin: User = {
    id: 'u_admin',
    email: 'admin@sportskalender.local',
    passwordHash: adminHash,
    displayName: 'Admin',
    role: 'admin',
  };
  db.users.set(admin.email, admin);
}

export function seedHighlights() {
  if (db.highlights.size > 0) return;
  const items: HighlightItem[] = [
    { id: 'h1', title: 'F1: Overtake of the Day', url: 'https://example.com/f1/overtake', sport: 'F1', description: 'Spektakuläres Überholmanöver', createdAt: new Date().toISOString() },
    { id: 'h2', title: 'NFL: Game-Winning Drive', url: 'https://example.com/nfl/drive', sport: 'NFL', description: 'Letzter Drive entscheidet', createdAt: new Date().toISOString() },
    { id: 'h3', title: 'Fußball: Traumtor', url: 'https://example.com/fussball/traumtor', sport: 'Fußball', description: 'Weitschuss in den Winkel', createdAt: new Date().toISOString() },
  ];
  for (const it of items) {
    db.highlights.set(it.id, it);
  }
}


