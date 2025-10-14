import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../database/repositories/userRepository';
import { emailService } from '../services/email.service';
import { authRateLimit } from '../middleware/security-enhanced';

export const emailVerificationRouter = Router();

// Schema for email verification request
const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
});

// Schema for resend verification email request
const resendVerificationSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim())
});

// Schema for password reset request
const requestPasswordResetSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim())
});

// Schema for password reset confirmation
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

/**
 * Verify email with token
 * POST /api/email-verification/verify
 */
emailVerificationRouter.post('/verify', authRateLimit, async (req: Request, res: Response) => {
  try {
    console.log('🔍 Email verification request received');
    
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('❌ Schema validation failed:', parsed.error.flatten());
      return res.status(400).json({ 
        error: 'Invalid input',
        details: parsed.error.flatten() 
      });
    }

    const { token } = parsed.data;

    // Verify JWT secret
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'dev_secret_change_me') {
      console.error('❌ JWT_SECRET not properly configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Email verification service unavailable' 
      });
    }

    try {
      // Verify the token
      const payload = jwt.verify(token, secret, {
        issuer: 'sportskalendar',
        audience: 'sportskalendar-users'
      }) as { 
        userId: string; 
        email: string; 
        type: string; 
        exp: number;
        iat: number;
      };

      console.log('✅ Token verified successfully:', { 
        userId: payload.userId, 
        email: payload.email, 
        type: payload.type 
      });

      // Check if it's an email verification token
      if (payload.type !== 'email_verification') {
        console.log('❌ Invalid token type:', payload.type);
        return res.status(400).json({ 
          error: 'Invalid token',
          message: 'This token is not for email verification' 
        });
      }

      // Check if token is not expired (additional check)
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        console.log('❌ Token expired');
        return res.status(400).json({ 
          error: 'Token expired',
          message: 'Verification token has expired. Please request a new one.' 
        });
      }

      // Find user in database
      if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not configured');
        return res.status(500).json({ 
          error: 'Database not available',
          message: 'Email verification is currently unavailable' 
        });
      }

      const user = await UserRepository.findByEmail(payload.email);
      if (!user) {
        console.log('❌ User not found for email:', payload.email);
        return res.status(404).json({ 
          error: 'User not found',
          message: 'No account found with this email address' 
        });
      }

      // Check if email is already verified
      if (user.email_verified) {
        console.log('✅ Email already verified for user:', payload.email);
        return res.status(200).json({ 
          success: true,
          message: 'Email address is already verified',
          alreadyVerified: true
        });
      }

      // Update user email verification status
      await UserRepository.updateByEmail(payload.email, {
        email_verified: true
      });

      console.log('✅ Email verified successfully for user:', payload.email);

      // Send welcome email (optional, don't fail if it fails)
      try {
        await emailService.sendWelcomeEmail(payload.email, user.displayName);
      } catch (emailError) {
        console.warn('⚠️ Failed to send welcome email:', emailError);
        // Don't fail the verification process if welcome email fails
      }

      return res.status(200).json({ 
        success: true,
        message: 'Email address verified successfully',
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          emailVerified: true
        }
      });

    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError);
      return res.status(400).json({ 
        error: 'Invalid or expired token',
        message: 'The verification link is invalid or has expired. Please request a new verification email.' 
      });
    }

  } catch (error) {
    console.error('❌ Email verification error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Email verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Resend verification email
 * POST /api/email-verification/resend
 */
emailVerificationRouter.post('/resend', authRateLimit, async (req: Request, res: Response) => {
  try {
    console.log('🔍 Resend verification email request received');
    
    const parsed = resendVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('❌ Schema validation failed:', parsed.error.flatten());
      return res.status(400).json({ 
        error: 'Invalid input',
        details: parsed.error.flatten() 
      });
    }

    const { email } = parsed.data;

    // Check if user exists
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not configured');
      return res.status(500).json({ 
        error: 'Database not available',
        message: 'Email verification is currently unavailable' 
      });
    }

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      console.log('❌ User not found for email:', email);
      // Don't reveal if user exists or not for security
      return res.status(200).json({ 
        success: true,
        message: 'If an account with this email exists, a verification email has been sent.' 
      });
    }

    // Check if email is already verified
    if (user.email_verified) {
      console.log('✅ Email already verified for user:', email);
      return res.status(200).json({ 
        success: true,
        message: 'Email address is already verified' 
      });
    }

    // Generate new verification token
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
    const emailSent = await emailService.sendVerificationEmail(email, user.displayName, verificationToken);
    
    if (!emailSent) {
      console.error('❌ Failed to send verification email');
      return res.status(500).json({ 
        error: 'Failed to send email',
        message: 'Could not send verification email. Please try again later.' 
      });
    }

    console.log('✅ Verification email resent successfully for user:', email);

    return res.status(200).json({ 
      success: true,
      message: 'Verification email sent successfully' 
    });

  } catch (error) {
    console.error('❌ Resend verification error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to resend verification email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Request password reset
 * POST /api/email-verification/request-password-reset
 */
emailVerificationRouter.post('/request-password-reset', authRateLimit, async (req: Request, res: Response) => {
  try {
    console.log('🔍 Password reset request received');
    
    const parsed = requestPasswordResetSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('❌ Schema validation failed:', parsed.error.flatten());
      return res.status(400).json({ 
        error: 'Invalid input',
        details: parsed.error.flatten() 
      });
    }

    const { email } = parsed.data;

    // Check if user exists
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not configured');
      return res.status(500).json({ 
        error: 'Database not available',
        message: 'Password reset is currently unavailable' 
      });
    }

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      console.log('❌ User not found for email:', email);
      // Don't reveal if user exists or not for security
      return res.status(200).json({ 
        success: true,
        message: 'If an account with this email exists, a password reset email has been sent.' 
      });
    }

    // Generate password reset token
    const resetToken = jwt.sign({
      userId: user.id,
      email: user.email,
      type: 'password_reset'
    }, process.env.JWT_SECRET!, {
      expiresIn: '1h', // Token expires in 1 hour
      issuer: 'sportskalendar',
      audience: 'sportskalendar-users'
    });

    // Send password reset email
    const emailSent = await emailService.sendPasswordResetEmail(email, user.displayName, resetToken);
    
    if (!emailSent) {
      console.error('❌ Failed to send password reset email');
      return res.status(500).json({ 
        error: 'Failed to send email',
        message: 'Could not send password reset email. Please try again later.' 
      });
    }

    console.log('✅ Password reset email sent successfully for user:', email);

    return res.status(200).json({ 
      success: true,
      message: 'If an account with this email exists, a password reset email has been sent.' 
    });

  } catch (error) {
    console.error('❌ Password reset request error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process password reset request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Reset password with token
 * POST /api/email-verification/reset-password
 */
emailVerificationRouter.post('/reset-password', authRateLimit, async (req: Request, res: Response) => {
  try {
    console.log('🔍 Password reset confirmation received');
    
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('❌ Schema validation failed:', parsed.error.flatten());
      return res.status(400).json({ 
        error: 'Invalid input',
        details: parsed.error.flatten() 
      });
    }

    const { token, password } = parsed.data;

    // Verify JWT secret
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'dev_secret_change_me') {
      console.error('❌ JWT_SECRET not properly configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Password reset service unavailable' 
      });
    }

    try {
      // Verify the token
      const payload = jwt.verify(token, secret, {
        issuer: 'sportskalendar',
        audience: 'sportskalendar-users'
      }) as { 
        userId: string; 
        email: string; 
        type: string; 
        exp: number;
        iat: number;
      };

      console.log('✅ Reset token verified successfully:', { 
        userId: payload.userId, 
        email: payload.email, 
        type: payload.type 
      });

      // Check if it's a password reset token
      if (payload.type !== 'password_reset') {
        console.log('❌ Invalid token type:', payload.type);
        return res.status(400).json({ 
          error: 'Invalid token',
          message: 'This token is not for password reset' 
        });
      }

      // Check if token is not expired (additional check)
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        console.log('❌ Token expired');
        return res.status(400).json({ 
          error: 'Token expired',
          message: 'Password reset token has expired. Please request a new one.' 
        });
      }

      // Find user in database
      if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not configured');
        return res.status(500).json({ 
          error: 'Database not available',
          message: 'Password reset is currently unavailable' 
        });
      }

      const user = await UserRepository.findByEmail(payload.email);
      if (!user) {
        console.log('❌ User not found for email:', payload.email);
        return res.status(404).json({ 
          error: 'User not found',
          message: 'No account found with this email address' 
        });
      }

      // Hash new password
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash(password, 12);

      // Update user password
      await UserRepository.updateByEmail(payload.email, {
        passwordHash: passwordHash
      });

      console.log('✅ Password reset successfully for user:', payload.email);

      return res.status(200).json({ 
        success: true,
        message: 'Password has been reset successfully' 
      });

    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError);
      return res.status(400).json({ 
        error: 'Invalid or expired token',
        message: 'The password reset link is invalid or has expired. Please request a new password reset email.' 
      });
    }

  } catch (error) {
    console.error('❌ Password reset error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Password reset failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
