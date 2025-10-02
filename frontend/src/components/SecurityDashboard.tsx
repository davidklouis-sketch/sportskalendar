import { useState, useEffect } from 'react';
import { SecureAPI } from '../utils/security';

interface SecurityEvent {
  id: string;
  userId?: string;
  eventType: string;
  eventData?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface SecurityStats {
  totalEvents: number;
  failedLogins: number;
  suspiciousActivity: number;
  rateLimitExceeded: number;
  uniqueIPs: number;
}

export function SecurityDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    eventType: '',
    startDate: '',
    endDate: '',
    ipAddress: ''
  });

  useEffect(() => {
    loadSecurityData();
  }, [filters]);

  const loadSecurityData = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.eventType) queryParams.append('eventType', filters.eventType);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.ipAddress) queryParams.append('ipAddress', filters.ipAddress);

      const response = await SecureAPI.request(`/auth/security/events?${queryParams.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
        setStats(data.stats);
      } else {
        setError('Failed to load security data');
      }
    } catch (error) {
      console.error('Security dashboard error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'login_success':
        return '#10b981';
      case 'login_failed':
        return '#ef4444';
      case 'suspicious_activity':
        return '#f59e0b';
      case 'rate_limit_exceeded':
        return '#8b5cf6';
      case 'two_factor_enabled':
        return '#06b6d4';
      default:
        return '#6b7280';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'login_success':
        return '✅';
      case 'login_failed':
        return '❌';
      case 'suspicious_activity':
        return '⚠️';
      case 'rate_limit_exceeded':
        return '🚫';
      case 'two_factor_enabled':
        return '🔐';
      case 'logout':
        return '🚪';
      case 'registration':
        return '👤';
      default:
        return '📝';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px'
      }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>
          Loading security data...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      <h1 style={{ marginBottom: '2rem' }}>Security Dashboard</h1>

      {error && (
        <div style={{
          background: '#fee2e2',
          color: '#dc2626',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '2rem'
        }}>
          {error}
        </div>
      )}

      {/* Security Stats */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {stats.totalEvents}
            </div>
            <div style={{ color: '#6b7280' }}>Total Events (24h)</div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
              {stats.failedLogins}
            </div>
            <div style={{ color: '#6b7280' }}>Failed Logins</div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {stats.suspiciousActivity}
            </div>
            <div style={{ color: '#6b7280' }}>Suspicious Activity</div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
              {stats.rateLimitExceeded}
            </div>
            <div style={{ color: '#6b7280' }}>Rate Limit Exceeded</div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#06b6d4' }}>
              {stats.uniqueIPs}
            </div>
            <div style={{ color: '#6b7280' }}>Unique IPs</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Filters</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Event Type
            </label>
            <select
              value={filters.eventType}
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            >
              <option value="">All Events</option>
              <option value="login_success">Login Success</option>
              <option value="login_failed">Login Failed</option>
              <option value="suspicious_activity">Suspicious Activity</option>
              <option value="rate_limit_exceeded">Rate Limit Exceeded</option>
              <option value="two_factor_enabled">2FA Enabled</option>
              <option value="logout">Logout</option>
              <option value="registration">Registration</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Start Date
            </label>
            <input
              type="datetime-local"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              End Date
            </label>
            <input
              type="datetime-local"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              IP Address
            </label>
            <input
              type="text"
              value={filters.ipAddress}
              onChange={(e) => setFilters({ ...filters, ipAddress: e.target.value })}
              placeholder="192.168.1.1"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Security Events */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <h3 style={{ margin: 0 }}>Security Events</h3>
        </div>

        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {events.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              No security events found
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{ fontSize: '1.5rem' }}>
                  {getEventTypeIcon(event.eventType)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{
                      color: getEventTypeColor(event.eventType),
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {event.eventType.replace(/_/g, ' ')}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      {formatDate(event.createdAt)}
                    </span>
                  </div>
                  
                  {event.eventData && (
                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      {JSON.stringify(event.eventData, null, 2)}
                    </div>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    {event.ipAddress && (
                      <span>IP: {event.ipAddress}</span>
                    )}
                    {event.userAgent && (
                      <span>UA: {event.userAgent.substring(0, 50)}...</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

