// Frontend security utilities

export interface SecurityConfig {
  maxPasswordLength: number;
  minPasswordLength: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
}

export const securityConfig: SecurityConfig = {
  maxPasswordLength: 128,
  minPasswordLength: 8,
  sessionTimeout: 15 * 60 * 1000, // 15 minutes
  maxLoginAttempts: 5
};

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length < securityConfig.minPasswordLength) {
    feedback.push(`Password must be at least ${securityConfig.minPasswordLength} characters long`);
  } else {
    score += 1;
  }

  if (password.length > securityConfig.maxPasswordLength) {
    feedback.push(`Password must be no more than ${securityConfig.maxPasswordLength} characters long`);
  }

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one lowercase letter');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one uppercase letter');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one number');
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one special character');
  }

  // Common password check
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    '12345678', 'password1', 'qwerty123', 'admin123'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    feedback.push('Password is too common, please choose a stronger password');
    score = Math.max(0, score - 2);
  }

  // Sequential character check
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Password should not contain repeated characters');
    score = Math.max(0, score - 1);
  }

  return {
    isValid: score >= 4 && feedback.length === 0,
    score,
    feedback
  };
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

// XSS protection
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// CSRF token management
export class CSRFManager {
  private static token: string | null = null;

  static setToken(token: string): void {
    this.token = token;
  }

  static getToken(): string | null {
    return this.token;
  }

  static clearToken(): void {
    this.token = null;
  }

  static async fetchToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/csrf-token', {
        credentials: 'include',
        method: 'GET'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.setToken(data.token);
        return data.token;
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
    return null;
  }
}

// Session management
export class SessionManager {
  private static lastActivity: number = Date.now();
  private static sessionTimer: NodeJS.Timeout | null = null;

  static startSession(): void {
    this.lastActivity = Date.now();
    this.resetTimer();
  }

  static updateActivity(): void {
    this.lastActivity = Date.now();
    this.resetTimer();
  }

  private static resetTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, securityConfig.sessionTimeout);
  }

  private static handleSessionTimeout(): void {
    console.warn('Session timeout - user will be logged out');
    // Trigger logout
    window.dispatchEvent(new CustomEvent('session-timeout'));
  }

  static clearSession(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    this.lastActivity = 0;
  }

  static isSessionActive(): boolean {
    return Date.now() - this.lastActivity < securityConfig.sessionTimeout;
  }
}

// Secure API calls
export class SecureAPI {
  private static baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  static async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Add CSRF token if available
    const csrfToken = CSRFManager.getToken();
    if (csrfToken && options.method && options.method !== 'GET') {
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': csrfToken
      };
    }

    // Add credentials for authenticated requests
    options.credentials = 'include';

    try {
      const response = await fetch(url, options);
      
      // Update session activity on successful requests
      if (response.ok) {
        SessionManager.updateActivity();
      }
      
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
}

// Initialize security features
export function initializeSecurity(): void {
  // Start session management
  SessionManager.startSession();
  
  // Fetch CSRF token
  CSRFManager.fetchToken();
  
  // Set up activity tracking
  ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
    document.addEventListener(event, () => {
      SessionManager.updateActivity();
    }, { passive: true });
  });
  
  // Handle session timeout
  window.addEventListener('session-timeout', () => {
    // Redirect to login or show timeout message
    window.location.href = '/login?timeout=true';
  });
}






