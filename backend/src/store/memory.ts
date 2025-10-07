import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'user' | 'admin';
  isPremium?: boolean;
  selectedTeams?: Array<{
    sport: 'football' | 'nfl' | 'f1';
    teamId?: string;
    teamName: string;
    leagueId?: number;
  }>;
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
  thumbnail?: string;
  duration?: string;
  views?: number;
  priority?: 'high' | 'medium' | 'low';
  source?: string;
}

export async function seedDevUser() {
  console.log('🌱 Starting demo user seeding...');
  
  // Check if we're using PostgreSQL and if users already exist
  if (process.env.DATABASE_URL) {
    console.log('📊 Using PostgreSQL database');
    try {
      const { UserRepository } = await import('../database/repositories/userRepository');
      const existingUsers = await UserRepository.findAll();
      console.log(`📊 Found ${existingUsers.length} existing users in PostgreSQL`);
      if (existingUsers.length > 0) {
        console.log('✅ PostgreSQL database already has users, skipping demo user seeding');
        return;
      }
    } catch (error) {
      console.log('⚠️ Could not check PostgreSQL users, falling back to in-memory check:', error);
    }
  } else {
    console.log('📊 Using in-memory storage');
  }
  
  // Fallback to in-memory check
  if (db.users.size > 0) {
    console.log(`✅ In-memory store already has ${db.users.size} users, skipping seeding`);
    return;
  }
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

  // If using PostgreSQL, also create users in database
  if (process.env.DATABASE_URL) {
    console.log('📊 Creating demo users in PostgreSQL database...');
    try {
      const { UserRepository } = await import('../database/repositories/userRepository');
      await UserRepository.create({
        email: user.email,
        passwordHash: user.passwordHash,
        displayName: user.displayName,
        role: user.role
      });
      console.log(`✅ Created demo user: ${user.email}`);
      
      await UserRepository.create({
        email: admin.email,
        passwordHash: admin.passwordHash,
        displayName: admin.displayName,
        role: admin.role
      });
      console.log(`✅ Created admin user: ${admin.email}`);
      console.log('✅ Demo users created in PostgreSQL database');
    } catch (error) {
      console.log('⚠️ Could not create demo users in PostgreSQL:', error);
    }
  }
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


