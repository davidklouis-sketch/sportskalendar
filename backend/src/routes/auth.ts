import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { db, User } from '../store/memory';
import { authRateLimit, validatePassword, validateJwtSecret, SessionManager } from '../middleware/security-enhanced';

// Helper function to get user from either PostgreSQL or in-memory store
async function getUserByEmail(email: string): Promise<User | null> {
  // Try PostgreSQL first if available
  if (process.env.DATABASE_URL) {
    try {
      const { UserRepository } = await import('../database/repositories/userRepository');
      const pgUser = await UserRepository.findByEmail(email);
      if (pgUser) {
        return {
          id: pgUser.id,
          email: pgUser.email,
          passwordHash: pgUser.passwordHash,
          displayName: pgUser.displayName,
          role: pgUser.role as 'user' | 'admin',
          isPremium: pgUser.isPremium || false,
          selectedTeams: pgUser.selectedTeams || []
        };
      }
    } catch (error) {
      console.log('⚠️ Could not fetch user from PostgreSQL, falling back to in-memory:', error);
    }
  }
  
  // Fallback to in-memory store
  return db.users.get(email) || null;
}

// Helper function to update user in either PostgreSQL or in-memory store
async function updateUser(email: string, updates: Partial<User>): Promise<void> {
  // Try PostgreSQL first if available
  if (process.env.DATABASE_URL) {
    try {
      const { UserRepository } = await import('../database/repositories/userRepository');
      await UserRepository.updateByEmail(email, updates);
      return;
    } catch (error) {
      console.log('⚠️ Could not update user in PostgreSQL, falling back to in-memory:', error);
    }
  }
  
  // Fallback to in-memory store
  const user = db.users.get(email);
  if (user) {
    Object.assign(user, updates);
    db.users.set(email, user);
  }
}

export const authRouter = Router();

export function signAccess(user: { id: string; email: string; role?: 'user' | 'admin' }) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'dev_secret_change_me') {
    throw new Error('JWT_SECRET not properly configured');
  }
  return jwt.sign({ 
    id: user.id, 
    email: user.email, 
    role: user.role,
    iat: Math.floor(Date.now() / 1000)
  }, secret, { 
    expiresIn: '24h',
    issuer: 'sportskalendar',
    audience: 'sportskalendar-users'
  });
}

export function signRefresh(user: { id: string; email: string; role?: 'user' | 'admin' }) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'dev_secret_change_me') {
    throw new Error('JWT_SECRET not properly configured');
  }
  return jwt.sign({ 
    id: user.id, 
    email: user.email, 
    role: user.role, 
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000)
  }, secret, { 
    expiresIn: '7d',
    issuer: 'sportskalendar',
    audience: 'sportskalendar-users'
  });
}

export function setAuthCookies(res: Response, tokens: { access: string; refresh: string }) {
  // Always use secure cookies for HTTPS environments
  const isHttps = process.env.NODE_ENV === 'production' || process.env.FORCE_HTTPS === 'true';
  res.cookie('access_token', tokens.access, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refresh_token', tokens.refresh, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

const registerSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8),
  displayName: z.string().min(2).max(50).trim(),
});

authRouter.post('/register', authRateLimit, async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: 'Invalid input',
        details: parsed.error.flatten() 
      });
    }

    const { email, password, displayName } = parsed.data;
    
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        error: 'Password does not meet requirements',
        details: passwordValidation.errors 
      });
    }

    // Check if user already exists (check both PostgreSQL and in-memory)
    let existingUser = null;
    try {
      existingUser = await getUserByEmail(email);
    } catch (error) {
      console.log('⚠️ Error checking existing user, continuing with registration:', error);
    }
    
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists',
        message: 'An account with this email already exists' 
      });
    }

    // Hash password with higher salt rounds
    const passwordHash = await bcrypt.hash(password, 12);
    const user: User = { 
      id: `u_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
      email, 
      passwordHash, 
      displayName, 
      role: 'user' 
    };
    
    // Store in both PostgreSQL and in-memory
    if (process.env.DATABASE_URL) {
      try {
        const { UserRepository } = await import('../database/repositories/userRepository');
        await UserRepository.create({
          email: user.email,
          passwordHash: user.passwordHash,
          displayName: user.displayName,
          role: user.role
        });
        console.log(`✅ User created in PostgreSQL: ${user.email}`);
      } catch (error) {
        console.error('❌ Failed to create user in PostgreSQL:', error);
        // Don't fail the registration if PostgreSQL fails, just log it
        console.log('⚠️ Continuing with in-memory storage only');
      }
    }
    
    // Also store in in-memory for consistency
    db.users.set(email, user);
    
    // Don't return sensitive data
    return res.status(201).json({ 
      success: true,
      message: 'User registered successfully' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Registration failed' 
    });
  }
});

const loginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1),
});

authRouter.post('/login', authRateLimit, async (req: Request, res: Response) => {
  try {
    // Validate JWT secret
    if (!validateJwtSecret()) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Authentication service unavailable' 
      });
    }

    let body: any = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        try {
          const params = new URLSearchParams(body);
          body = Object.fromEntries(params.entries());
        } catch {
          return res.status(400).json({ 
            error: 'Invalid request format',
            message: 'Request body must be valid JSON' 
          });
        }
      }
    }
    
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: 'Invalid input',
        details: parsed.error.flatten() 
      });
    }

    const { email, password } = parsed.data;
    
    // Find user
    const user = await getUserByEmail(email);
    if (!user) {
      // Simulate password check to prevent timing attacks
      await bcrypt.compare(password, '$2a$12$dummy.hash.to.prevent.timing.attacks');
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect' 
      });
    }
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect' 
      });
    }

    // Generate tokens
    const access = signAccess(user);
    const refresh = signRefresh(user);
    
    // Set secure cookies
    setAuthCookies(res, { access, refresh });
    
    // Return user data (without sensitive information)
    res.json({ 
      success: true,
      user: { 
        id: user.id, 
        email: user.email, 
        displayName: user.displayName, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Login failed' 
    });
  }
});

authRouter.post('/logout', (req: Request, res: Response) => {
  try {
    // Blacklist the current access token
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
      SessionManager.blacklistToken(token);
    }
    
    // Also check cookies
    const cookieToken = (req as any).cookies?.['access_token'];
    if (cookieToken) {
      SessionManager.blacklistToken(cookieToken);
    }
    
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('access_token', { 
      path: '/', 
      sameSite: 'lax', 
      secure: isProd,
      httpOnly: true 
    });
    res.clearCookie('refresh_token', { 
      path: '/', 
      sameSite: 'lax', 
      secure: isProd,
      httpOnly: true 
    });
    
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Logout failed' 
    });
  }
});

authRouter.post('/refresh', (req: Request, res: Response) => {
  try {
    const { refresh_token } = (req as any).cookies || {};
    if (!refresh_token) {
      return res.status(401).json({ 
        error: 'Missing refresh token',
        message: 'Refresh token not found' 
      });
    }
    
    // Check if token is blacklisted
    if (SessionManager.isTokenBlacklisted(refresh_token)) {
      return res.status(401).json({ 
        error: 'Token revoked',
        message: 'Refresh token has been revoked' 
      });
    }
    
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'dev_secret_change_me') {
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Authentication service unavailable' 
      });
    }
    
    const payload = jwt.verify(refresh_token, secret, {
      issuer: 'sportskalendar',
      audience: 'sportskalendar-users'
    }) as { id: string; email: string; type?: string; iat?: number };
    
    if (payload.type !== 'refresh') {
      return res.status(401).json({ 
        error: 'Invalid token type',
        message: 'Token is not a refresh token' 
      });
    }
    
    // Blacklist the old refresh token
    SessionManager.blacklistToken(refresh_token);
    
    // Generate new tokens
    const access = signAccess(payload);
    const refresh = signRefresh(payload);
    
    // Set new cookies
    setAuthCookies(res, { access, refresh });
    
    res.json({ 
      success: true,
      message: 'Tokens refreshed successfully' 
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({ 
      error: 'Invalid refresh token',
      message: 'Token refresh failed' 
    });
  }
});


