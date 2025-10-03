import { useEffect, useRef, useState } from 'react';

// Dark mode detection
const isDarkMode = document.documentElement.classList.contains('dark') || 
  window.matchMedia('(prefers-color-scheme: dark)').matches;

type Item = { 
  type: 'highlight' | 'score' | 'info' | 'news' | 'goal' | 'update'; 
  message: string; 
  ts: number; 
  id?: string; 
  url?: string; 
  source?: string;
  sport?: string;
  priority?: 'high' | 'medium' | 'low';
};

// Sport-specific configurations
const sportConfigs = {
  'Fußball': { emoji: '⚽', color: '#10b981', bgColor: '#d1fae5' },
  'F1': { emoji: '🏎️', color: '#f59e0b', bgColor: '#fef3c7' },
  'NFL': { emoji: '🏈', color: '#ef4444', bgColor: '#fee2e2' },
  'Basketball': { emoji: '🏀', color: '#8b5cf6', bgColor: '#ede9fe' },
  'Tennis': { emoji: '🎾', color: '#06b6d4', bgColor: '#cffafe' },
  'Allgemein': { emoji: '📰', color: '#6b7280', bgColor: '#f3f4f6' },
  'default': { emoji: '📰', color: '#6b7280', bgColor: '#f3f4f6' }
};

// Event type configurations
const eventTypeConfigs = {
  goal: { emoji: '⚽', color: '#ef4444', bgColor: '#fee2e2', priority: 'high' },
  update: { emoji: '🔄', color: '#f59e0b', bgColor: '#fef3c7', priority: 'high' },
  news: { emoji: '📰', color: '#3b82f6', bgColor: '#dbeafe', priority: 'medium' },
  info: { emoji: 'ℹ️', color: '#06b6d4', bgColor: '#cffafe', priority: 'medium' },
  highlight: { emoji: '⭐', color: '#8b5cf6', bgColor: '#ede9fe', priority: 'high' },
  score: { emoji: '📊', color: '#10b981', bgColor: '#d1fae5', priority: 'high' }
};

function getSportConfig(sport?: string) {
  if (!sport) return sportConfigs.default;
  return sportConfigs[sport as keyof typeof sportConfigs] || sportConfigs.default;
}

function getEventTypeConfig(type: Item['type']) {
  return eventTypeConfigs[type] || eventTypeConfigs.news;
}

function ModernTickerItem({ item }: { item: Item }) {
  const sportConfig = getSportConfig(item.sport);
  const eventConfig = getEventTypeConfig(item.type);
  const isHighPriority = item.priority === 'high' || eventConfig.priority === 'high';
  const timeAgo = Math.floor((Date.now() - item.ts) / 1000);
  
  const getTimeDisplay = () => {
    if (timeAgo < 60) return 'Gerade eben';
    if (timeAgo < 3600) return `${Math.floor(timeAgo / 60)}m`;
    return `${Math.floor(timeAgo / 3600)}h`;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '16px 20px',
      margin: '8px 0',
      borderRadius: '12px',
      background: isHighPriority 
        ? (isDarkMode ? '#1f2937' : 'white')
        : (isDarkMode ? '#111827' : '#fafafa'),
      border: isHighPriority 
        ? `2px solid ${eventConfig.color}40`
        : `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
      boxShadow: isHighPriority 
        ? `0 4px 20px ${eventConfig.color}20`
        : isDarkMode 
        ? '0 2px 8px rgba(0,0,0,0.3)'
        : '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Live indicator for high priority */}
      {isHighPriority && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '12px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#ef4444',
          animation: 'pulse 2s infinite'
        }} />
      )}
      
      {/* Event type icon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: isDarkMode ? eventConfig.bgColor + '20' : eventConfig.bgColor,
        color: eventConfig.color,
        fontSize: '20px',
        flexShrink: 0
      }}>
        {eventConfig.emoji}
      </div>
      
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px'
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            color: sportConfig.color,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {item.sport || 'Sport'}
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: eventConfig.color,
            background: isDarkMode ? eventConfig.bgColor + '20' : eventConfig.bgColor,
            padding: '2px 6px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {item.type}
          </span>
          <span style={{
            fontSize: '11px',
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            fontWeight: '500'
          }}>
            {getTimeDisplay()}
          </span>
        </div>
        
        <div style={{
          fontSize: '14px',
          fontWeight: isHighPriority ? '600' : '500',
          color: isDarkMode ? '#f9fafb' : '#111827',
          lineHeight: '1.4',
          marginBottom: '4px'
        }}>
          {item.url ? (
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                color: 'inherit',
                textDecoration: 'none',
                borderBottom: `1px solid ${eventConfig.color}40`,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderBottomColor = eventConfig.color;
                e.currentTarget.style.color = eventConfig.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderBottomColor = eventConfig.color + '40';
                e.currentTarget.style.color = 'inherit';
              }}
            >
              {item.message}
            </a>
          ) : (
            item.message
          )}
        </div>
        
        {item.source && (
          <div style={{
            fontSize: '12px',
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            fontWeight: '500'
          }}>
            Quelle: {item.source}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LiveTickerWidget() {
  const [items, setItems] = useState<Item[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const seenRef = useRef<Set<string>>(new Set());
  const windowStartRef = useRef<number>(Date.now());

  useEffect(() => {
    const url = (import.meta.env.VITE_API_URL || 'https://api.dlouis.ddnss.de/api') + '/ticker/stream';
    let ev: EventSource | null = null;

    const attach = () => {
      if (ev) ev.close();
      setConnectionError(false);
      
      try {
        ev = new EventSource(url);
        
        ev.onopen = () => {
          setIsConnected(true);
          setConnectionError(false);
        };
        
        ev.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data) as Item;
            const id = `${data.ts}-${data.message}`;
            
            if (Date.now() - windowStartRef.current > 120000) {
              seenRef.current.clear();
              windowStartRef.current = Date.now();
            }
            
            if (seenRef.current.has(id)) return;
            seenRef.current.add(id);
            
            // Add sport detection based on message content
            if (!data.sport) {
              if (data.message.toLowerCase().includes('tor') || data.message.toLowerCase().includes('goal')) {
                data.sport = 'Fußball';
              } else if (data.message.toLowerCase().includes('f1') || data.message.toLowerCase().includes('formel')) {
                data.sport = 'F1';
              } else if (data.message.toLowerCase().includes('nfl') || data.message.toLowerCase().includes('touchdown')) {
                data.sport = 'NFL';
              } else if (data.message.toLowerCase().includes('basketball') || data.message.toLowerCase().includes('nba')) {
                data.sport = 'Basketball';
              } else if (data.message.toLowerCase().includes('tennis') || data.message.toLowerCase().includes('wimbledon')) {
                data.sport = 'Tennis';
              } else {
                data.sport = 'Allgemein';
              }
            }
            
            // Add priority based on type
            if (data.type === 'goal' || data.type === 'score' || data.type === 'highlight') {
              data.priority = 'high';
            } else if (data.type === 'update' || data.type === 'info') {
              data.priority = 'medium';
            } else if (data.type === 'news') {
              data.priority = 'low';
            } else {
              data.priority = 'medium';
            }
            
            setItems((prev) => [{ ...data, id }, ...prev].slice(0, 20));
          } catch (error) {
            console.error('Error parsing ticker data:', error);
          }
        };
        
        ev.onerror = (error) => {
          console.error('EventSource error:', error);
          setIsConnected(false);
          setConnectionError(true);
          // Let EventSource auto-retry
        };
      } catch (error) {
        console.error('Error creating EventSource:', error);
        setConnectionError(true);
      }
    };

    attach();

    return () => {
      if (ev) {
        ev.close();
      }
    };
  }, []);

  return (
    <div style={{
      background: isDarkMode ? '#1f2937' : 'white',
      borderRadius: '16px',
      border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
      overflow: 'hidden',
      boxShadow: isDarkMode 
        ? '0 4px 20px rgba(0,0,0,0.3)'
        : '0 4px 20px rgba(0,0,0,0.1)',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        padding: '20px 24px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background pattern */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          opacity: 0.3
        }} />
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>📰</span>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '700',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                Live-Stat-Ticker
              </h2>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '14px',
                opacity: 0.9,
                fontWeight: '500'
              }}>
                Echtzeit-Updates aus der Sportwelt
              </p>
            </div>
          </div>
          
          {/* Connection status */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isConnected ? '#10b981' : connectionError ? '#ef4444' : '#f59e0b',
                animation: isConnected ? 'pulse 2s infinite' : 'none'
              }} />
              {isConnected ? 'LIVE' : connectionError ? 'FEHLER' : 'VERBINDE'}
            </div>
            <div style={{
              fontSize: '11px',
              opacity: 0.8,
              fontWeight: '500'
            }}>
              {items.length} Updates
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ 
        padding: '20px 24px',
        maxHeight: '500px',
        overflowY: 'auto',
        background: isDarkMode ? '#111827' : '#fafafa'
      }}>
        {items.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: isDarkMode ? '#9ca3af' : '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
              📰
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              {connectionError ? 'Verbindungsfehler' : 'Warte auf Updates...'}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              {connectionError ? 'Versuche erneut zu verbinden' : 'Live-Updates werden hier angezeigt'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {items.map((item) => (
              <ModernTickerItem key={item.id || `${item.ts}-${item.message}`} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}