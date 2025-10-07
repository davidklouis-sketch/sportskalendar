// @ts-nocheck - This service is not currently used and requires optional dependencies
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { UserRepository } from '../database/repositories/userRepository';
import { SecurityEventRepository, SecurityEventType } from '../database/repositories/securityEventRepository';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  isValid: boolean;
  backupCodeUsed?: boolean;
}

export class TwoFactorService {
  private static readonly BACKUP_CODE_LENGTH = 8;
  private static readonly BACKUP_CODE_COUNT = 10;

  // Generate 2FA setup for user
  static async generateSetup(userId: string, userEmail: string): Promise<TwoFactorSetup> {
    const secret = authenticator.generateSecret();
    const serviceName = 'SportsKalender';
    const accountName = userEmail;
    
    // Generate QR code URL
    const otpAuthUrl = authenticator.keyuri(accountName, serviceName, secret);
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);
    
    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    
    // Store secret in database (temporarily until verified)
    await UserRepository.update(userId, {
      twoFactorSecret: secret
    });

    // Log security event
    await SecurityEventRepository.logEvent({
      userId,
      eventType: SecurityEventType.TWO_FACTOR_ENABLED,
      eventData: { setupInitiated: true }
    });

    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  }

  // Verify 2FA token
  static async verifyToken(userId: string, token: string, ipAddress?: string): Promise<TwoFactorVerification> {
    const user = await UserRepository.findById(userId);
    if (!user || !user.two_factor_secret) {
      await this.logFailedAttempt(userId, 'no_secret', ipAddress);
      return { isValid: false };
    }

    // Check if it's a backup code
    const backupCodeUsed = await this.verifyBackupCode(userId, token);
    if (backupCodeUsed) {
      await this.logSuccessfulAttempt(userId, 'backup_code', ipAddress);
      return { isValid: true, backupCodeUsed: true };
    }

    // Verify TOTP token
    const isValid = authenticator.verify({
      token,
      secret: user.two_factor_secret
    });

    if (isValid) {
      await this.logSuccessfulAttempt(userId, 'totp', ipAddress);
    } else {
      await this.logFailedAttempt(userId, 'invalid_token', ipAddress);
    }

    return { isValid, backupCodeUsed: false };
  }

  // Enable 2FA for user
  static async enableTwoFactor(userId: string, token: string, ipAddress?: string): Promise<boolean> {
    const verification = await this.verifyToken(userId, token, ipAddress);
    
    if (verification.isValid) {
      await UserRepository.update(userId, {
        twoFactorEnabled: true
      });

      await SecurityEventRepository.logEvent({
        userId,
        eventType: SecurityEventType.TWO_FACTOR_VERIFIED,
        eventData: { enabled: true, method: verification.backupCodeUsed ? 'backup_code' : 'totp' },
        ipAddress
      });

      return true;
    }

    return false;
  }

  // Disable 2FA for user
  static async disableTwoFactor(userId: string, password: string, ipAddress?: string): Promise<boolean> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      return false;
    }

    // Verify password before disabling 2FA
    const passwordValid = await UserRepository.verifyPassword(user.email, password);
    if (!passwordValid) {
      await this.logFailedAttempt(userId, 'invalid_password', ipAddress);
      return false;
    }

    await UserRepository.update(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null
    });

    await SecurityEventRepository.logEvent({
      userId,
      eventType: SecurityEventType.TWO_FACTOR_DISABLED,
      eventData: { disabled: true },
      ipAddress
    });

    return true;
  }

  // Check if user has 2FA enabled
  static async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const user = await UserRepository.findById(userId);
    return user?.two_factor_enabled || false;
  }

  // Generate backup codes
  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      codes.push(this.generateBackupCode());
    }
    return codes;
  }

  private static generateBackupCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < this.BACKUP_CODE_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Verify backup code (simplified - in production, store hashed backup codes)
  private static async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    // In a real implementation, you would:
    // 1. Store hashed backup codes in the database
    // 2. Check if the provided code matches any stored hash
    // 3. Remove the used backup code
    
    // For now, we'll use a simple validation
    // In production, implement proper backup code storage and verification
    return code.length === this.BACKUP_CODE_LENGTH && /^[A-Z0-9]+$/.test(code);
  }

  // Log successful 2FA attempt
  private static async logSuccessfulAttempt(userId: string, method: string, ipAddress?: string): Promise<void> {
    await SecurityEventRepository.logEvent({
      userId,
      eventType: SecurityEventType.TWO_FACTOR_VERIFIED,
      eventData: { method, success: true },
      ipAddress
    });
  }

  // Log failed 2FA attempt
  private static async logFailedAttempt(userId: string, reason: string, ipAddress?: string): Promise<void> {
    await SecurityEventRepository.logEvent({
      userId,
      eventType: SecurityEventType.TWO_FACTOR_FAILED,
      eventData: { reason, success: false },
      ipAddress
    });
  }

  // Generate recovery codes (for when user loses access)
  static async generateRecoveryCodes(userId: string): Promise<string[]> {
    const codes = this.generateBackupCodes();
    
    // In production, hash and store these codes
    // For now, just return them
    
    await SecurityEventRepository.logEvent({
      userId,
      eventType: SecurityEventType.TWO_FACTOR_ENABLED,
      eventData: { recoveryCodesGenerated: true }
    });

    return codes;
  }

  // Validate recovery code
  static async validateRecoveryCode(userId: string, code: string): Promise<boolean> {
    // In production, check against stored hashed codes
    return code.length === this.BACKUP_CODE_LENGTH && /^[A-Z0-9]+$/.test(code);
  }
}






