import bcrypt from 'bcryptjs';

export const db = {
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
  
  // Only work with PostgreSQL - no fallbacks
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ No DATABASE_URL found, skipping demo user seeding');
    return;
  }

  console.log('📊 Using PostgreSQL database');
  try {
    const { UserRepository } = await import('../database/repositories/userRepository');
    const existingUsers = await UserRepository.findAll();
    console.log(`📊 Found ${existingUsers.length} existing users in PostgreSQL`);
    
    // Always create demo users if we have less than 2 users (demo + admin)
    if (existingUsers.length < 2) {
      console.log('📊 Less than 2 users found, creating demo users...');
    } else {
      console.log('✅ PostgreSQL database already has sufficient users, skipping demo user seeding');
      return;
    }
    
    // Create demo user
    const demoPasswordHash = await bcrypt.hash('password', 10);
    const existingDemo = await UserRepository.findByEmail('demo@sportskalender.local');
    if (!existingDemo) {
      await UserRepository.create({
        email: 'demo@sportskalender.local',
        passwordHash: demoPasswordHash,
        displayName: 'Demo User',
        role: 'user'
      });
      console.log('✅ Created demo user: demo@sportskalender.local');
    } else {
      console.log('✅ Demo user already exists: demo@sportskalender.local');
    }
    
    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const existingAdmin = await UserRepository.findByEmail('admin@sportskalender.local');
    if (!existingAdmin) {
      const adminUser = await UserRepository.create({
        email: 'admin@sportskalender.local',
        passwordHash: adminPasswordHash,
        displayName: 'Admin',
        role: 'admin'
      });
      console.log('✅ Created admin user: admin@sportskalender.local with role:', adminUser.role);
    } else {
      console.log('✅ Admin user already exists: admin@sportskalender.local with role:', existingAdmin.role);
      // Ensure admin role is set correctly
      if (existingAdmin.role !== 'admin') {
        console.log('⚠️ Admin user exists but role is not admin, updating...');
        await UserRepository.update(existingAdmin.id, { role: 'admin' });
        console.log('✅ Updated admin user role to admin');
      }
    }
    
    console.log('✅ Demo users ensured in PostgreSQL database');
  } catch (error) {
    console.error('❌ Failed to seed demo users in PostgreSQL:', error);
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
