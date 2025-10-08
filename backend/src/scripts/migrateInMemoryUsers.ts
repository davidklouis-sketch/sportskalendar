import { db } from '../store/memory';
import { UserRepository } from '../database/repositories/userRepository';

export async function migrateInMemoryUsersToPostgreSQL(): Promise<void> {
  console.log('🔄 Starting migration of in-memory users to PostgreSQL...');
  
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ No DATABASE_URL found, skipping migration');
    return;
  }
  
  const inMemoryUsers = Array.from(db.users.values());
  console.log(`📊 Found ${inMemoryUsers.length} users in memory`);
  
  for (const user of inMemoryUsers) {
    try {
      // Check if user already exists in PostgreSQL
      const existingUser = await UserRepository.findByEmail(user.email);
      if (existingUser) {
        console.log(`✅ User ${user.email} already exists in PostgreSQL`);
        continue;
      }
      
      // Create user in PostgreSQL
      await UserRepository.create({
        email: user.email,
        passwordHash: user.passwordHash,
        displayName: user.displayName,
        role: user.role,
        isPremium: user.isPremium || false,
        selectedTeams: user.selectedTeams || []
      });
      
      console.log(`✅ Migrated user ${user.email} to PostgreSQL`);
    } catch (error) {
      console.error(`❌ Failed to migrate user ${user.email}:`, error);
    }
  }
  
  console.log('✅ Migration completed');
}

// Run migration if called directly
if (require.main === module) {
  migrateInMemoryUsersToPostgreSQL()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
