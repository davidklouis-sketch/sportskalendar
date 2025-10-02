import { useEffect, useState } from 'react';
import { api } from '../lib/api';

// Dark mode detection
const isDarkMode = document.documentElement.classList.contains('dark') || 
  window.matchMedia('(prefers-color-scheme: dark)').matches;

type Entry = { 
  position: number; 
  name: string; 
  meta?: string; 
  points?: number; 
  info?: string;
  score?: string;
  minute?: number;
  lap?: number;
  totalLaps?: number;
  gapSec?: number;
  league?: string;
};

type ApiResponse = { 
  entries: Entry[]; 
  message?: string; 
  error?: string; 
  nextEvent?: { name: string; date: string; teams?: string; circuit?: string } 
};

// Sport-specific configurations
const sportConfigs = {
  f1: {
    emoji: '🏎️',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    bgGradient: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    darkBgGradient: 'linear-gradient(135deg, #451a03, #78350f)'
  },
  soccer: {
    emoji: '⚽',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    bgGradient: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
    darkBgGradient: 'linear-gradient(135deg, #064e3b, #065f46)'
  },
  nfl: {
    emoji: '🏈',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    bgGradient: 'linear-gradient(135deg, #fee2e2, #fecaca)',
    darkBgGradient: 'linear-gradient(135deg, #7f1d1d, #991b1b)'
  }
};

function ModernRow({ entry, sport, isError, isLive }: { entry: Entry; sport: keyof typeof sportConfigs; isError: boolean; isLive: boolean }) {
  const config = sportConfigs[sport];
  const isErrorState = isError || entry.meta === 'Fehler';
  const isNoLiveState = entry.meta === 'Kein Live-Spiel aktiv' || entry.meta === 'Kein Live-Spiel' || entry.meta === 'Kein Live-Rennen aktiv';
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '16px 20px',
      margin: '8px 0',
      borderRadius: '12px',
      background: isNoLiveState 
        ? (isDarkMode ? '#374151' : '#f3f4f6')
        : isLive 
        ? (isDarkMode ? config.darkBgGradient : config.bgGradient)
        : (isDarkMode ? '#1f2937' : 'white'),
      border: isLive 
        ? `2px solid ${config.color}40`
        : `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
      boxShadow: isLive 
        ? `0 4px 20px ${config.color}20`
        : isDarkMode 
        ? '0 2px 8px rgba(0,0,0,0.3)'
        : '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Live indicator */}
      {isLive && (
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
      
      {/* Position badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        background: isErrorState 
          ? '#ef4444'
          : entry.position <= 3 
          ? config.gradient
          : (isDarkMode ? '#374151' : '#f3f4f6'),
        color: entry.position <= 3 ? 'white' : (isDarkMode ? '#f9fafb' : '#374151'),
        fontWeight: '700',
        fontSize: '14px',
        marginRight: '16px',
        boxShadow: entry.position <= 3 ? `0 2px 8px ${config.color}40` : 'none'
      }}>
        {entry.position}
      </div>
      
      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px'
        }}>
          <span style={{ fontSize: '20px' }}>{config.emoji}</span>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: isErrorState ? '#ef4444' : (isDarkMode ? '#f9fafb' : '#111827'),
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {entry.name}
          </h3>
        </div>
        
        {entry.meta && (
          <div style={{
            fontSize: '14px',
            color: isErrorState ? '#ef4444' : (isDarkMode ? '#9ca3af' : '#6b7280'),
            fontWeight: '500',
            marginBottom: '4px'
          }}>
            {entry.meta}
          </div>
        )}
        
        {/* Sport-specific info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          color: isDarkMode ? '#9ca3af' : '#6b7280'
        }}>
          {entry.score && (
            <span style={{
              background: isDarkMode ? '#374151' : '#f3f4f6',
              padding: '4px 8px',
              borderRadius: '6px',
              fontWeight: '600',
              color: config.color
            }}>
              {entry.score}
            </span>
          )}
          
          {entry.minute && (
            <span style={{
              background: '#3b82f6',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              {entry.minute}'
            </span>
          )}
          
          {entry.lap && entry.totalLaps && (
            <span style={{
              background: '#8b5cf6',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              Runde {entry.lap}/{entry.totalLaps}
            </span>
          )}
          
          {entry.gapSec && entry.gapSec > 0 && (
            <span style={{
              background: '#f59e0b',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              +{entry.gapSec.toFixed(1)}s
            </span>
          )}
        </div>
      </div>
      
      {/* Additional info */}
      {entry.info && (
        <div style={{
          textAlign: 'right',
          fontSize: '12px',
          color: isErrorState ? '#ef4444' : (isDarkMode ? '#9ca3af' : '#6b7280'),
          fontWeight: '500',
          maxWidth: '120px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {entry.info}
        </div>
      )}
    </div>
  );
}

function ModernTable({ title, endpoint, sport }: { title: string; endpoint: string; sport: keyof typeof sportConfigs }) {
  const [data, setData] = useState<ApiResponse>({ entries: [] });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = await api.get(endpoint);
        if (active) {
          setData(r.data);
          setLastUpdate(new Date());
          setLoading(false);
        }
      } catch (error) {
        if (active) {
          setData({ 
            entries: [{ 
              position: 1, 
              name: 'Verbindungsfehler', 
              meta: 'Fehler', 
              info: 'Netzwerkfehler' 
            }] 
          });
          setLoading(false);
        }
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => { active = false; clearInterval(interval); };
  }, [endpoint]);
  
  const config = sportConfigs[sport];
  const isError = !!data.error;
  const hasMessage = !!data.message;
  const hasNextEvent = !!data.nextEvent;
  const isLive = data.entries.some(entry => 
    entry.meta && !entry.meta.includes('Kein Live') && !entry.meta.includes('Fehler')
  );
  
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
      {/* Header with gradient */}
      <div style={{
        background: isError 
          ? 'linear-gradient(135deg, #ef4444, #dc2626)'
          : hasMessage 
          ? 'linear-gradient(135deg, #10b981, #059669)'
          : config.gradient,
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
            <span style={{ fontSize: '24px' }}>{config.emoji}</span>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '700',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {title}
              </h2>
              {hasMessage && (
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '14px',
                  opacity: 0.9,
                  fontWeight: '500'
                }}>
                  {data.message}
                </p>
              )}
              {hasNextEvent && (
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '14px',
                  opacity: 0.9,
                  fontWeight: '500'
                }}>
                  Nächstes Event: {data.nextEvent?.name}
                </p>
              )}
            </div>
          </div>
          
          {/* Live indicator and last update */}
          <div style={{ textAlign: 'right' }}>
            {isLive && (
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
                  background: '#ef4444',
                  animation: 'pulse 2s infinite'
                }} />
                LIVE
              </div>
            )}
            {lastUpdate && (
              <div style={{
                fontSize: '11px',
                opacity: 0.8,
                fontWeight: '500'
              }}>
                Aktualisiert: {lastUpdate.toLocaleTimeString('de-DE', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ 
        padding: '20px 24px',
        maxHeight: '400px',
        overflowY: 'auto',
        background: isDarkMode ? '#111827' : '#fafafa'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            color: isDarkMode ? '#9ca3af' : '#6b7280'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: `3px solid ${config.color}20`,
              borderTop: `3px solid ${config.color}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px'
            }} />
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
              Lade Live-Daten...
            </div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              Verbinde mit {sport.toUpperCase()} API
            </div>
          </div>
        ) : data.entries.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: isDarkMode ? '#9ca3af' : '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
              {config.emoji}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              Keine Daten verfügbar
            </div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              Versuche es später erneut
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {data.entries.map((entry, i) => (
              <ModernRow 
                key={i} 
                entry={entry} 
                sport={sport} 
                isError={isError} 
                isLive={isLive && !isError}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function HeaderScoreboard() {
  return (
    <section id="scoreboard" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '24px',
      marginBottom: '32px'
    }}>
      <ModernTable title="Formel 1 Live" endpoint="/live/f1" sport="f1" />
      <ModernTable title="Fußball Live" endpoint="/live/soccer" sport="soccer" />
      <ModernTable title="NFL Live" endpoint="/live/nfl" sport="nfl" />
    </section>
  );
}

// CSS Animations
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);