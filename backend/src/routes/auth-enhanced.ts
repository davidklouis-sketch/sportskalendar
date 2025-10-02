import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { UserRepository } from '../database/repositories/userRepository';
import { SecurityEventRepository, SecurityEventType } from '../database/repositories/securityEventRepository';
import { TwoFactorService } from '../services/twoFactorService';
import { authRateLimit, validatePassword, validateJwtSecret, SessionManager } from '../middleware/security-enhanced';

export const authEnhancedRouter = Router();

// Helper function to get client IP
function getClientIP(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         'unknown';
}

// Helper function to get user agent
function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'unknown';
}

// Sign JWT tokens
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
    expiresIn: '15m',
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

// Set secure cookies
export function setAuthCookies(res: Response, tokens: { access: string; refresh: string }) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('access_token', tokens.access, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refresh_token', tokens.refresh, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// Registration schema
const registerSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8),
  displayName: z.string().min(2).max(50).trim(),
});

// Enhanced registration with security logging
authEnhancedRouter.post('/register', authRateLimit, async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      await SecurityEventRepository.logEvent({
        eventType: SecurityEventType.REGISTRATION,
        eventData: { success: false, reason: 'invalid_input', errors: parsed.error.flatten() },
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req)
      });

      return res.status(400).json({ 
        error: 'Invalid input',
        details: parsed.error.flatten() 
      });
    }

    const { email, password, displayName } = parsed.data;
    
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      await SecurityEventRepository.logEvent({
        eventType: SecurityEventType.REGISTRATION,
        eventData: { success: false, reason: 'weak_password', email },
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req)
      });

      return res.status(400).json({ 
        error: 'Password does not meet requirements',
        details: passwordValidation.errors 
      });
    }

    // Check if user already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      await SecurityEventRepository.logEvent({
        eventType: SecurityEventType.REGISTRATION,
        eventData: { success: false, reason: 'user_exists', email },
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req)
      });

      return res.status(409).json({ 
        error: 'User already exists',
        message: 'An account with this email already exists' 
      });
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await UserRepository.create({
      email,
      passwordHash,
      displayName,
      role: 'user'
    });

    // Log successful registration
    await SecurityEventRepository.logEvent({
      userId: user.id,
      eventType: SecurityEventType.REGISTRATION,
      eventData: { success: true, email, displayName },
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req)
    });
    
    return res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    await SecurityEventRepository.logEvent({
      eventType: SecurityEventType.REGISTRATION,
      eventData: { success: false, reason: 'server_error', error: error instanceof Error ? error.message : 'Unknown error' },
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req)
    });

    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Registration failed' 
    });
  }
});

// Login schema
const loginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1),
  twoFactorToken: z.string().optional(),
});

// Enhanced login with 2FA and security logging
authEnhancedRouter.post('/login', authRateLimit, async (req: Request, res: Response) => {
  try {
    // Validate JWT secret
    if (!validateJwtSecret()) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Authentication service unavailable' 
      });
    }

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      await SecurityEventRepository.logEvent({
        eventType: SecurityEventType.LOGIN_FAILED,
        eventData: { success: false, reason: 'invalid_input', errors: parsed.error.flatten() },
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req)
      });

      return res.status(400).json({ 
        error: 'Invalid input',
        details: parsed.error.flatten() 
      });
    }

    const { email, password, twoFactorToken } = parsed.data;
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    
    // Check if user is locked
    const lockStatus = await UserRepository.isUserLocked(email);
    if (lockStatus.locked) {
      await SecurityEventRepository.logEvent({
        eventType: SecurityEventType.ACCOUNT_LOCKED,
        eventData: { 
          success: false, 
          reason: 'account_locked', 
          email,
          lockedUntil: lockStatus.lockedUntil 
        },
        ipAddress,
        userAgent
      });

      return res.status(423).json({ 
        error: 'Account locked',
        message: 'Too many failed attempts. Account is temporarily locked.',
        lockedUntil: lockStatus.lockedUntil
      });
    }
    
    // Find user
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // Simulate password check to prevent timing attacks
      await bcrypt.compare(password, '$2a$12$dummy.hash.to.prevent.timing.attacks');
      
      await SecurityEventRepository.logEvent({
        eventType: SecurityEventType.LOGIN_FAILED,
        eventData: { success: false, reason: 'user_not_found', email },
        ipAddress,
        userAgent
      });

      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect' 
      });
    }
    
    // Verify password
    const passwordValid = await UserRepository.verifyPassword(email, password);
    if (!passwordValid) {
      await UserRepository.incrementLoginAttempts(email);
      
      await SecurityEventRepository.logEvent({
        userId: user.id,
        eventType: SecurityEventType.LOGIN_FAILED,
        eventData: { success: false, reason: 'invalid_password', email },
        ipAddress,
        userAgent
      });

      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect' 
      });
    }

    // Check if 2FA is enabled
    if (user.two_factor_enabled) {
      if (!twoFactorToken) {
        await SecurityEventRepository.logEvent({
          userId: user.id,
          eventType: SecurityEventType.TWO_FACTOR_FAILED,
          eventData: { success: false, reason: 'missing_token', email },
          ipAddress,
          userAgent
        });

        return res.status(200).json({
          requiresTwoFactor: true,
          message: 'Two-factor authentication required'
        });
      }

      // Verify 2FA token
      const twoFactorValid = await TwoFactorService.verifyToken(user.id, twoFactorToken, ipAddress);
      if (!twoFactorValid.isValid) {
        await UserRepository.incrementLoginAttempts(email);
        
        return res.status(401).json({ 
          error: 'Invalid two-factor token',
          message: 'Two-factor authentication failed' 
        });
      }
    }

    // Reset login attempts on successful login
    await UserRepository.resetLoginAttempts(email);
    
    // Update last login
    await UserRepository.update(user.id, {
      lastLogin: new Date()
    });

    // Generate tokens
    const access = signAccess(user);
    const refresh = signRefresh(user);
    
    // Set secure cookies
    setAuthCookies(res, { access, refresh });
    
    // Log successful login
    await SecurityEventRepository.logEvent({
      userId: user.id,
      eventType: SecurityEventType.LOGIN_SUCCESS,
      eventData: { 
        success: true, 
        email, 
        twoFactorUsed: user.two_factor_enabled,
        twoFactorMethod: twoFactorToken ? 'totp' : 'none'
      },
      ipAddress,
      userAgent
    });
    
    // Return user data (without sensitive information)
    res.json({ 
      success: true,
      user: { 
        id: user.id, 
        email: user.email, 
        displayName: user.displayName, 
        role: user.role,
        twoFactorEnabled: user.two_factor_enabled
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    
    await SecurityEventRepository.logEvent({
      eventType: SecurityEventType.LOGIN_FAILED,
      eventData: { success: false, reason: 'server_error', error: error instanceof Error ? error.message : 'Unknown error' },
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req)
    });

    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Login failed' 
    });
  }
});

// 2FA setup endpoint
authEnhancedRouter.post('/2fa/setup', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const setup = await TwoFactorService.generateSetup(userId, user.email);
    
    res.json({
      success: true,
      setup
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

// 2FA enable endpoint
authEnhancedRouter.post('/2fa/enable', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { token } = req.body;
    
    if (!userId || !token) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const success = await TwoFactorService.enableTwoFactor(userId, token, getClientIP(req));
    
    if (success) {
      res.json({ success: true, message: 'Two-factor authentication enabled' });
    } else {
      res.status(400).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

// 2FA disable endpoint
authEnhancedRouter.post('/2fa/disable', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { password } = req.body;
    
    if (!userId || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const success = await TwoFactorService.disableTwoFactor(userId, password, getClientIP(req));
    
    if (success) {
      res.json({ success: true, message: 'Two-factor authentication disabled' });
    } else {
      res.status(400).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// Security events endpoint (admin only)
authEnhancedRouter.get('/security/events', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { 
      userId, 
      eventType, 
      startDate, 
      endDate, 
      ipAddress, 
      limit = 50, 
      offset = 0 
    } = req.query;

    const filters: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    if (userId) filters.userId = userId as string;
    if (eventType) filters.eventType = eventType as any;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (ipAddress) filters.ipAddress = ipAddress as string;

    const events = await SecurityEventRepository.getEvents(filters);
    const stats = await SecurityEventRepository.getSecurityStats(24);

    res.json({
      success: true,
      events,
      stats,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: events.length
      }
    });
  } catch (error) {
    console.error('Security events error:', error);
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

// Logout with security logging
authEnhancedRouter.post('/logout', (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
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
    
    // Log logout event
    if (userId) {
      SecurityEventRepository.logEvent({
        userId,
        eventType: SecurityEventType.LOGOUT,
        eventData: { success: true },
        ipAddress: getClientIP(req),
        userAgent: getUserAgent(req)
      });
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
