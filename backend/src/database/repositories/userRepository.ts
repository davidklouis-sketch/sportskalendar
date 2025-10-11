import { pool } from '../connection';
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

export interface DatabaseUser extends Omit<User, 'id'> {
  id: string;
  isPremium: boolean;
  selectedTeams: Array<{
    sport: 'football' | 'nfl' | 'f1';
    teamId?: string;
    teamName: string;
    leagueId?: number;
  }>;
  email_verified: boolean;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  login_attempts: number;
  locked_until?: Date;
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  displayName: string;
  role?: 'user' | 'admin';
  isPremium?: boolean;
  selectedTeams?: Array<{
    sport: 'football' | 'nfl' | 'f1';
    teamId?: string;
    teamName: string;
    leagueId?: number;
  }>;
}

export interface UpdateUserData {
  email?: string;
  displayName?: string;
  role?: 'user' | 'admin';
  isPremium?: boolean;
  selectedTeams?: Array<{
    sport: 'football' | 'nfl' | 'f1';
    teamId?: string;
    teamName: string;
    leagueId?: number;
  }>;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  lastLogin?: Date;
  loginAttempts?: number;
  lockedUntil?: Date;
}

export class UserRepository {
  // Create a new user
  static async create(userData: CreateUserData): Promise<DatabaseUser> {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO users (email, password_hash, display_name, role, is_premium, selected_teams)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const values = [
        userData.email, 
        userData.passwordHash, 
        userData.displayName, 
        userData.role || 'user',
        userData.isPremium || false,
        JSON.stringify(userData.selectedTeams || [])
      ];
      
      const result = await client.query(query, values);
      return this.mapRowToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  // Find user by email
  static async findByEmail(email: string): Promise<DatabaseUser | null> {
    const client = await pool.connect();
    try {
      console.log('🔍 [UserRepository] findByEmail called with:', email);
      const query = 'SELECT * FROM users WHERE email = $1';
      console.log('🔍 [UserRepository] Executing query:', query);
      const result = await client.query(query, [email]);
      console.log('🔍 [UserRepository] Query result rows:', result.rows.length);
      
      if (result.rows.length === 0) {
        // Debug: Try to find ANY users to see if database is working
        const allUsersQuery = 'SELECT email FROM users LIMIT 5';
        const allUsersResult = await client.query(allUsersQuery);
        console.log('🔍 [UserRepository] Sample emails in database:', allUsersResult.rows.map(r => r.email));
        return null;
      }
      
      console.log('✅ [UserRepository] User found:', result.rows[0].email);
      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      console.error('❌ [UserRepository] Database error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Find user by ID
  static async findById(id: string): Promise<DatabaseUser | null> {
    const client = await pool.connect();
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  // Update user
  static async update(id: string, userData: UpdateUserData): Promise<DatabaseUser | null> {
    const client = await pool.connect();
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (userData.email !== undefined) {
        fields.push(`email = $${paramCount++}`);
        values.push(userData.email);
      }
      if (userData.displayName !== undefined) {
        fields.push(`display_name = $${paramCount++}`);
        values.push(userData.displayName);
      }
      if (userData.role !== undefined) {
        fields.push(`role = $${paramCount++}`);
        values.push(userData.role);
      }
      if (userData.isPremium !== undefined) {
        fields.push(`is_premium = $${paramCount++}`);
        values.push(userData.isPremium);
      }
      if (userData.selectedTeams !== undefined) {
        fields.push(`selected_teams = $${paramCount++}`);
        values.push(JSON.stringify(userData.selectedTeams));
      }
      if (userData.emailVerified !== undefined) {
        fields.push(`email_verified = $${paramCount++}`);
        values.push(userData.emailVerified);
      }
      if (userData.twoFactorEnabled !== undefined) {
        fields.push(`two_factor_enabled = $${paramCount++}`);
        values.push(userData.twoFactorEnabled);
      }
      if (userData.twoFactorSecret !== undefined) {
        fields.push(`two_factor_secret = $${paramCount++}`);
        values.push(userData.twoFactorSecret);
      }
      if (userData.lastLogin !== undefined) {
        fields.push(`last_login = $${paramCount++}`);
        values.push(userData.lastLogin);
      }
      if (userData.loginAttempts !== undefined) {
        fields.push(`login_attempts = $${paramCount++}`);
        values.push(userData.loginAttempts);
      }
      if (userData.lockedUntil !== undefined) {
        fields.push(`locked_until = $${paramCount++}`);
        values.push(userData.lockedUntil);
      }

      if (fields.length === 0) {
        return await this.findById(id);
      }

      values.push(id);
      const query = `
        UPDATE users 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  // Update user by email
  static async updateByEmail(email: string, userData: UpdateUserData): Promise<DatabaseUser | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }
    return await this.update(user.id, userData);
  }

  // Delete user
  static async delete(id: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const query = 'DELETE FROM users WHERE id = $1';
      const result = await client.query(query, [id]);
      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  // Get all users (admin only)
  static async findAll(limit: number = 50, offset: number = 0): Promise<DatabaseUser[]> {
    const client = await pool.connect();
    try {
      const query = `
        SELECT * FROM users 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      const result = await client.query(query, [limit, offset]);
      return result.rows.map(row => this.mapRowToUser(row));
    } finally {
      client.release();
    }
  }

  // Check if user is locked
  static async isUserLocked(email: string): Promise<{ locked: boolean; lockedUntil?: Date }> {
    const user = await this.findByEmail(email);
    if (!user) {
      return { locked: false };
    }

    if (user.locked_until && new Date() < user.locked_until) {
      return { locked: true, lockedUntil: user.locked_until };
    }

    return { locked: false };
  }

  // Increment login attempts
  static async incrementLoginAttempts(email: string): Promise<void> {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE users 
        SET login_attempts = login_attempts + 1,
            locked_until = CASE 
              WHEN login_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
              ELSE locked_until
            END
        WHERE email = $1
      `;
      await client.query(query, [email]);
    } finally {
      client.release();
    }
  }

  // Reset login attempts
  static async resetLoginAttempts(email: string): Promise<void> {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE users 
        SET login_attempts = 0, locked_until = NULL
        WHERE email = $1
      `;
      await client.query(query, [email]);
    } finally {
      client.release();
    }
  }

  // Verify password
  static async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user) {
      // Simulate password check to prevent timing attacks
      await bcrypt.compare(password, '$2a$12$dummy.hash.to.prevent.timing.attacks');
      return false;
    }

    return await bcrypt.compare(password, user.passwordHash);
  }

  // Safe JSON parsing helper
  private static safeJsonParse(jsonString: any, defaultValue: any = []): any {
    // Handle null, undefined, or empty values
    if (jsonString === null || jsonString === undefined) {
      return defaultValue;
    }
    
    // If it's already an object/array, return it
    if (typeof jsonString === 'object') {
      return jsonString;
    }
    
    // If it's a string, try to parse it
    if (typeof jsonString === 'string') {
      if (jsonString.trim() === '') {
        return defaultValue;
      }
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        console.warn('Failed to parse JSON string:', jsonString, 'Error:', error);
        return defaultValue;
      }
    }
    
    // For any other type, return default
    console.warn('Unexpected type for JSON parsing:', typeof jsonString, jsonString);
    return defaultValue;
  }

  // Map database row to User object
  private static mapRowToUser(row: any): DatabaseUser {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      displayName: row.display_name,
      role: row.role,
      isPremium: row.is_premium || false,
      selectedTeams: this.safeJsonParse(row.selected_teams, []),
      email_verified: row.email_verified,
      two_factor_enabled: row.two_factor_enabled,
      two_factor_secret: row.two_factor_secret,
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_login: row.last_login,
      login_attempts: row.login_attempts,
      locked_until: row.locked_until
    };
  }

  // Convert DatabaseUser to User (for backward compatibility)
  static toUser(dbUser: DatabaseUser): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      passwordHash: dbUser.passwordHash,
      displayName: dbUser.displayName,
      role: dbUser.role,
      isPremium: dbUser.isPremium,
      selectedTeams: dbUser.selectedTeams
    };
  }
}







