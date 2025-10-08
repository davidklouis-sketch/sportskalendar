import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { UserRepository } from '../database/repositories/userRepository';
import { authRateLimit, validatePassword, validateJwtSecret, SessionManager } from '../middleware/security-enhanced';

// Helper function to get user from PostgreSQL
async function getUserByEmail(email: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error('Database not configured');
  }
  
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
  
  return null;
}

// Helper function to update user in PostgreSQL
async function updateUser(email: string, updates: any): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('Database not configured');
  }
  
  await UserRepository.updateByEmail(email, updates);
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
    // Debug: Log request body
    console.log('🔍 Registration request body:', JSON.stringify(req.body));
    console.log('🔍 Request body type:', typeof req.body);
    console.log('🔍 Request body keys:', Object.keys(req.body || {}));
    
    // Check if request body is empty or invalid
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
      console.log('❌ Empty or invalid request body');
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body is empty or invalid',
        details: 'Expected JSON with email, password, and displayName fields'
      });
    }
    
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('❌ Schema validation failed:', parsed.error.flatten());
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

    // Check if user already exists in PostgreSQL
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not configured');
      return res.status(500).json({ 
        error: 'Database not available',
        message: 'Registration is currently unavailable' 
      });
    }

    console.log('🔍 Attempting to import UserRepository...');
    const { UserRepository } = await import('../database/repositories/userRepository');
    console.log('✅ UserRepository imported successfully');
    
    // Check if user already exists
    console.log(`🔍 Checking if user ${email} already exists...`);
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      console.log(`❌ User ${email} already exists`);
      return res.status(409).json({ 
        error: 'User already exists',
        message: 'An account with this email already exists' 
      });
    }
    console.log(`✅ User ${email} does not exist, proceeding with registration`);

    // Hash password with higher salt rounds
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);
    console.log('✅ Password hashed successfully');
    
    // Create user ONLY in PostgreSQL
    console.log('📝 Creating user in PostgreSQL...');
    const user = await UserRepository.create({
      email,
      passwordHash,
      displayName,
      role: 'user'
    });
    
    console.log(`✅ User created in PostgreSQL: ${user.email}`);
    
    // Don't return sensitive data
    return res.status(201).json({ 
      success: true,
      message: 'User registered successfully' 
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Registration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
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

    console.log('🔍 Login request received');
    console.log('🔍 Request body type:', typeof req.body);
    console.log('🔍 Request body:', req.body);
    console.log('🔍 Content-Type:', req.headers['content-type']);
    
    let body: any = req.body;
    if (typeof body === 'string') {
      console.log('🔍 Body is string, attempting to parse...');
      try {
        body = JSON.parse(body);
        console.log('✅ JSON parsing successful:', body);
      } catch {
        console.log('❌ JSON parsing failed, trying URLSearchParams...');
        try {
          const params = new URLSearchParams(body);
          body = Object.fromEntries(params.entries());
          console.log('✅ URLSearchParams parsing successful:', body);
        } catch {
          console.log('❌ All parsing methods failed');
          return res.status(400).json({ 
            error: 'Invalid request format',
            message: 'Request body must be valid JSON' 
          });
        }
      }
    }
    
    console.log('🔍 Final body for validation:', body);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      console.log('❌ Schema validation failed:', parsed.error.flatten());
      return res.status(400).json({ 
        error: 'Invalid input',
        details: parsed.error.flatten() 
      });
    }
    console.log('✅ Schema validation successful:', parsed.data);

    const { email, password } = parsed.data;
    
    // Find user in PostgreSQL
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ 
        error: 'Database not available',
        message: 'Login is currently unavailable' 
      });
    }

    const { UserRepository } = await import('../database/repositories/userRepository');
    const user = await UserRepository.findByEmail(email);
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
    console.log('🔍 Login - User role from database:', user.role);
    const access = signAccess(user);
    const refresh = signRefresh(user);
    
    // Set secure cookies
    setAuthCookies(res, { access, refresh });
    
    // Return user data (without sensitive information)
    const userData = { 
      id: user.id, 
      email: user.email, 
      displayName: user.displayName, 
      role: user.role 
    };
    console.log('🔍 Login - Returning user data:', userData);
    res.json({ 
      success: true,
      user: userData
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


