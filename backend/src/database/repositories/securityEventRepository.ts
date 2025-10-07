import { pool } from '../connection';

export interface SecurityEvent {
  id: string;
  userId?: string;
  eventType: SecurityEventType;
  eventData?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  REGISTRATION = 'registration',
  PASSWORD_CHANGE = 'password_change',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  TWO_FACTOR_VERIFIED = 'two_factor_verified',
  TWO_FACTOR_FAILED = 'two_factor_failed',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_TOKEN = 'invalid_token',
  TOKEN_REVOKED = 'token_revoked',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  CSRF_VIOLATION = 'csrf_violation',
  XSS_ATTEMPT = 'xss_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt'
}

export interface SecurityEventFilters {
  userId?: string;
  eventType?: SecurityEventType;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  limit?: number;
  offset?: number;
}

export class SecurityEventRepository {
  // Log a security event
  static async logEvent(eventData: Omit<SecurityEvent, 'id' | 'createdAt'>): Promise<SecurityEvent> {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO security_events (user_id, event_type, event_data, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const values = [
        eventData.userId || null,
        eventData.eventType,
        eventData.eventData ? JSON.stringify(eventData.eventData) : null,
        eventData.ipAddress || null,
        eventData.userAgent || null
      ];

      const result = await client.query(query, values);
      return this.mapRowToEvent(result.rows[0]);
    } finally {
      client.release();
    }
  }

  // Get security events with filters
  static async getEvents(filters: SecurityEventFilters = {}): Promise<SecurityEvent[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM security_events WHERE 1=1';
      const values: any[] = [];
      let paramCount = 1;

      if (filters.userId) {
        query += ` AND user_id = $${paramCount++}`;
        values.push(filters.userId);
      }

      if (filters.eventType) {
        query += ` AND event_type = $${paramCount++}`;
        values.push(filters.eventType);
      }

      if (filters.startDate) {
        query += ` AND created_at >= $${paramCount++}`;
        values.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ` AND created_at <= $${paramCount++}`;
        values.push(filters.endDate);
      }

      if (filters.ipAddress) {
        query += ` AND ip_address = $${paramCount++}`;
        values.push(filters.ipAddress);
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ` LIMIT $${paramCount++}`;
        values.push(filters.limit);
      }

      if (filters.offset) {
        query += ` OFFSET $${paramCount++}`;
        values.push(filters.offset);
      }

      const result = await client.query(query, values);
      return result.rows.map(row => this.mapRowToEvent(row));
    } finally {
      client.release();
    }
  }

  // Get security events by user
  static async getEventsByUser(userId: string, limit: number = 50): Promise<SecurityEvent[]> {
    return this.getEvents({ userId, limit });
  }

  // Get recent security events
  static async getRecentEvents(hours: number = 24, limit: number = 100): Promise<SecurityEvent[]> {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.getEvents({ startDate, limit });
  }

  // Get failed login attempts
  static async getFailedLoginAttempts(ipAddress?: string, hours: number = 24): Promise<SecurityEvent[]> {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    const filters: SecurityEventFilters = {
      eventType: SecurityEventType.LOGIN_FAILED,
      startDate,
      limit: 100
    };

    if (ipAddress) {
      filters.ipAddress = ipAddress;
    }

    return this.getEvents(filters);
  }

  // Get suspicious activity
  static async getSuspiciousActivity(hours: number = 24): Promise<SecurityEvent[]> {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.getEvents({
      eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
      startDate,
      limit: 100
    });
  }

  // Count events by type
  static async countEventsByType(eventType: SecurityEventType, hours: number = 24): Promise<number> {
    const client = await pool.connect();
    try {
      const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
      const query = `
        SELECT COUNT(*) as count 
        FROM security_events 
        WHERE event_type = $1 AND created_at >= $2
      `;
      const result = await client.query(query, [eventType, startDate]);
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  // Get security statistics
  static async getSecurityStats(hours: number = 24): Promise<{
    totalEvents: number;
    failedLogins: number;
    suspiciousActivity: number;
    rateLimitExceeded: number;
    uniqueIPs: number;
  }> {
    const client = await pool.connect();
    try {
      const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const query = `
        SELECT 
          COUNT(*) as total_events,
          COUNT(CASE WHEN event_type = 'login_failed' THEN 1 END) as failed_logins,
          COUNT(CASE WHEN event_type = 'suspicious_activity' THEN 1 END) as suspicious_activity,
          COUNT(CASE WHEN event_type = 'rate_limit_exceeded' THEN 1 END) as rate_limit_exceeded,
          COUNT(DISTINCT ip_address) as unique_ips
        FROM security_events 
        WHERE created_at >= $1
      `;

      const result = await client.query(query, [startDate]);
      const row = result.rows[0];

      return {
        totalEvents: parseInt(row.total_events),
        failedLogins: parseInt(row.failed_logins),
        suspiciousActivity: parseInt(row.suspicious_activity),
        rateLimitExceeded: parseInt(row.rate_limit_exceeded),
        uniqueIPs: parseInt(row.unique_ips)
      };
    } finally {
      client.release();
    }
  }

  // Clean old events (for maintenance)
  static async cleanOldEvents(daysToKeep: number = 90): Promise<number> {
    const client = await pool.connect();
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      const query = 'DELETE FROM security_events WHERE created_at < $1';
      const result = await client.query(query, [cutoffDate]);
      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  // Map database row to SecurityEvent
  private static mapRowToEvent(row: any): SecurityEvent {
    return {
      id: row.id,
      userId: row.user_id,
      eventType: row.event_type,
      eventData: row.event_data ? JSON.parse(row.event_data) : undefined,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at
    };
  }
}






