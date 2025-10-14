import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { UserRepository } from '../database/repositories/userRepository';
import { authRateLimit, validatePassword, validateJwtSecret, SessionManager } from '../middleware/security-enhanced';
import { emailService } from '../services/email.service';

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

export function signRefresh(user: { id: string; email: string; role?: 'user' | 'admin' }, keepLoggedIn: boolean = false) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'dev_secret_change_me') {
    throw new Error('JWT_SECRET not properly configured');
  }
  
  // If keepLoggedIn is true, token expires in 30 days, otherwise 7 days
  const expiresIn = keepLoggedIn ? '30d' : '7d';
  
  return jwt.sign({ 
    id: user.id, 
    email: user.email, 
    role: user.role, 
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000)
  }, secret, { 
    expiresIn,
    issuer: 'sportskalendar',
    audience: 'sportskalendar-users'
  });
}

export function setAuthCookies(res: Response, tokens: { access: string; refresh: string }, keepLoggedIn: boolean = false) {
  // Always use secure cookies for HTTPS environments
  const isHttps = process.env.NODE_ENV === 'production' || process.env.FORCE_HTTPS === 'true';
  
  // If keepLoggedIn is true, refresh token cookie expires in 30 days
  const refreshMaxAge = keepLoggedIn ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  
  // Mobile-optimized cookie settings
  // Use 'lax' for better mobile browser compatibility
  res.cookie('access_token', tokens.access, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours to match JWT expiry
  });
  res.cookie('refresh_token', tokens.refresh, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    path: '/',
    maxAge: refreshMaxAge, // 30 days if keepLoggedIn, otherwise 7 days
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
    
    // Body should already be parsed by express.json() middleware
    const body = req.body;
    
    // Check if request body is empty or invalid
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      console.log('❌ Empty or invalid request body');
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body is empty or invalid',
        details: 'Expected JSON with email, password, and displayName fields'
      });
    }
    
    const parsed = registerSchema.safeParse(body);
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
    
    // Create user ONLY in PostgreSQL (email_verified defaults to false)
    console.log('📝 Creating user in PostgreSQL...');
    const user = await UserRepository.create({
      email,
      passwordHash,
      displayName,
      role: 'user'
    });
    
    console.log(`✅ User created in PostgreSQL: ${user.email}`);
    
    // Generate email verification token
    const verificationToken = jwt.sign({
      userId: user.id,
      email: user.email,
      type: 'email_verification'
    }, process.env.JWT_SECRET!, {
      expiresIn: '24h', // Token expires in 24 hours
      issuer: 'sportskalendar',
      audience: 'sportskalendar-users'
    });

    // Send verification email
    console.log('📧 Sending verification email...');
    const emailSent = await emailService.sendVerificationEmail(email, displayName, verificationToken);
    
    if (!emailSent) {
      console.warn('⚠️ Failed to send verification email, but user was created');
      // Don't fail registration if email fails - user can request resend later
    } else {
      console.log('✅ Verification email sent successfully');
    }
    
    // Don't return sensitive data
    return res.status(201).json({ 
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      emailSent: emailSent,
      requiresVerification: true
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
  keepLoggedIn: z.boolean().optional().default(false),
});

authRouter.post('/login', authRateLimit, async (req: Request, res: Response) => {
  try {
    console.log('🔍 Login endpoint reached - before JWT validation');
    
    // Validate JWT secret
    if (!validateJwtSecret()) {
      console.log('❌ JWT secret validation failed');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Authentication service unavailable' 
      });
    }
    
    console.log('✅ JWT secret validation passed');

    console.log('🔍 Login request received');
    console.log('🔍 Request body type:', typeof req.body);
    console.log('🔍 Request body:', req.body);
    console.log('🔍 Content-Type:', req.headers['content-type']);
    
    // Body should already be parsed by express.json() middleware
    const body = req.body;
    
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

    const { email, password, keepLoggedIn } = parsed.data;
    
    console.log('🔍 Starting database lookup for:', email);
    
    // Find user in PostgreSQL
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL not configured');
      return res.status(500).json({ 
        error: 'Database not available',
        message: 'Login is currently unavailable' 
      });
    }

    console.log('✅ DATABASE_URL configured, importing UserRepository...');
    const { UserRepository } = await import('../database/repositories/userRepository');
    console.log('✅ UserRepository imported successfully');
    
    console.log('🔍 Searching for user in database...');
    const user = await UserRepository.findByEmail(email);
    console.log('🔍 Database query result:', user ? 'User found' : 'User not found');
    
    if (!user) {
      // Debug: Show what we're searching for
      console.log('🔍 Search details:');
      console.log('  - Email searched:', email);
      console.log('  - Email type:', typeof email);
      console.log('  - Email length:', email.length);
      console.log('  - Database connected:', !!process.env.DATABASE_URL);
    }
    
    if (!user) {
      console.log('❌ User not found in database, simulating password check...');
      // Simulate password check to prevent timing attacks
      await bcrypt.compare(password, '$2a$12$dummy.hash.to.prevent.timing.attacks');
      console.log('❌ Returning 401 - User not found');
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect' 
      });
    }
    
    console.log('✅ User found, verifying password...');
    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    console.log('🔍 Password verification result:', passwordValid ? 'Valid' : 'Invalid');
    
    if (!passwordValid) {
      console.log('❌ Password invalid, returning 401');
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect' 
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      console.log('❌ Email not verified for user:', user.email);
      return res.status(403).json({ 
        error: 'Email not verified',
        message: 'Please verify your email address before logging in. Check your inbox for a verification email.',
        requiresVerification: true,
        email: user.email
      });
    }
    
    console.log('✅ Password valid, proceeding with token generation...');

    // Generate tokens
    console.log('🔍 Login - User role from database:', user.role);
    console.log('🔍 Login - Keep logged in:', keepLoggedIn);
    console.log('🔍 Generating access token...');
    const access = signAccess(user);
    console.log('✅ Access token generated');
    console.log('🔍 Generating refresh token...');
    const refresh = signRefresh(user, keepLoggedIn);
    console.log('✅ Refresh token generated');
    
    // Set secure cookies
    setAuthCookies(res, { access, refresh }, keepLoggedIn);
    
    // Return user data (without sensitive information)
    const userData = { 
      id: user.id, 
      email: user.email, 
      displayName: user.displayName, 
      role: user.role,
      isPremium: user.isPremium || false,
      selectedTeams: user.selectedTeams || []
    };
    console.log('🔍 Login - Returning user data:', userData);
    console.log('✅ Login successful - sending response');
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

authRouter.post('/refresh', async (req: Request, res: Response) => {
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
    
    // Load fresh user data from database to get current role and premium status
    let userPayload: { id: string; email: string; role?: 'user' | 'admin' } = payload;
    try {
      const { UserRepository } = await import('../database/repositories/userRepository');
      const freshUser = await UserRepository.findByEmail(payload.email);
      if (freshUser) {
        userPayload = {
          id: freshUser.id,
          email: freshUser.email,
          role: freshUser.role as 'user' | 'admin'
        };
      }
    } catch (error) {
      console.error('Failed to load fresh user data during refresh:', error);
      // Continue with existing payload if database load fails
    }
    
    // Generate new tokens with fresh user data
    const access = signAccess(userPayload);
    const refresh = signRefresh(userPayload);
    
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


