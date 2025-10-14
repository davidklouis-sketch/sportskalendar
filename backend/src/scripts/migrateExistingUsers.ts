/**
 * Migration Script für bestehende User
 * 
 * Dieses Script markiert alle bestehenden User als email-verifiziert,
 * damit sie nicht von der neuen Email-Verifikation betroffen sind.
 * 
 * Ausführung:
 * npm run migrate-users
 */

import { UserRepository } from '../database/repositories/userRepository';
import { emailService } from '../services/email.service';

async function migrateExistingUsers() {
  console.log('🔄 Starting migration of existing users...');
  console.log('🔍 Environment check:');
  console.log('  - DATABASE_URL configured:', !!process.env.DATABASE_URL);
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
  
  try {
    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not configured');
      console.error('❌ Cannot run migration without database connection');
      process.exit(1);
    }
    
    console.log('✅ DATABASE_URL is configured, proceeding with migration...');

    // Get all existing users
    console.log('📊 Fetching all existing users...');
    const users = await UserRepository.findAll();
    console.log(`📊 Found ${users.length} existing users`);

    if (users.length === 0) {
      console.log('✅ No users to migrate');
      return;
    }

    let migratedCount = 0;
    let alreadyVerifiedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        console.log(`🔍 Processing user: ${user.email}`);
        
        // Check if user is already verified
        if (user.email_verified) {
          console.log(`✅ User ${user.email} is already verified`);
          alreadyVerifiedCount++;
          continue;
        }

        // Mark user as verified
        await UserRepository.updateByEmail(user.email, {
          email_verified: true
        });

        console.log(`✅ Migrated user: ${user.email}`);
        migratedCount++;

        // Optional: Send welcome email to existing users
        if (emailService.isServiceConfigured()) {
          try {
            await emailService.sendWelcomeEmail(user.email, user.displayName);
            console.log(`📧 Welcome email sent to: ${user.email}`);
          } catch (emailError) {
            console.warn(`⚠️ Failed to send welcome email to ${user.email}:`, emailError);
          }
        }

      } catch (userError) {
        console.error(`❌ Failed to migrate user ${user.email}:`, userError);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    console.log(`ℹ️  Already verified: ${alreadyVerifiedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log(`📊 Total processed: ${users.length} users`);

    if (errorCount > 0) {
      console.log('\n⚠️ Some users could not be migrated. Please check the logs above.');
      process.exit(1);
    } else {
      console.log('\n🎉 Migration completed successfully!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateExistingUsers()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateExistingUsers };
