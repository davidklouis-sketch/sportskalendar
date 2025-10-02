import { useEffect, useState } from 'react';
import { api } from '../lib/api';

// Dark mode detection
const isDarkMode = document.documentElement.classList.contains('dark') || 
  window.matchMedia('(prefers-color-scheme: dark)').matches;

type Item = { 
  id: string; 
  title: string; 
  url: string; 
  sport: string; 
  thumbnail?: string; 
  date?: string;
  duration?: string;
  views?: number;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  source?: string;
};

// Sport-specific configurations
const sportConfigs = {
  'Fußball': { emoji: '⚽', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  'F1': { emoji: '🏎️', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  'NFL': { emoji: '🏈', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  'Basketball': { emoji: '🏀', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
  'Tennis': { emoji: '🎾', color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
  'default': { emoji: '🎥', color: '#6b7280', gradient: 'linear-gradient(135deg, #6b7280, #4b5563)' }
};

function getSportConfig(sport: string) {
  const normalizedSport = sport.toLowerCase();
  if (normalizedSport.includes('football') || normalizedSport.includes('soccer') || normalizedSport.includes('fußball')) {
    return sportConfigs['Fußball'];
  }
  if (normalizedSport.includes('f1') || normalizedSport.includes('formula') || normalizedSport.includes('formel')) {
    return sportConfigs['F1'];
  }
  if (normalizedSport.includes('nfl') || normalizedSport.includes('american football')) {
    return sportConfigs['NFL'];
  }
  if (normalizedSport.includes('basketball')) {
    return sportConfigs['Basketball'];
  }
  if (normalizedSport.includes('tennis')) {
    return sportConfigs['Tennis'];
  }
  return sportConfigs.default;
}

function ModernHighlightCard({ item }: { item: Item }) {
  const config = getSportConfig(item.sport);
  const isNew = item.date && (Date.now() - new Date(item.date).getTime()) < 24 * 60 * 60 * 1000; // Less than 24 hours old
  const isHighPriority = item.priority === 'high';

  return (
    <a 
      href={item.url} 
      target="_blank" 
      rel="noreferrer" 
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        position: 'relative'
      }}
    >
      <div style={{
        background: isDarkMode ? '#1f2937' : 'white',
        borderRadius: '16px',
        border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
        overflow: 'hidden',
        boxShadow: isDarkMode 
          ? '0 4px 20px rgba(0,0,0,0.3)'
          : '0 4px 20px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = isDarkMode 
          ? '0 8px 30px rgba(0,0,0,0.4)'
          : '0 8px 30px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isDarkMode 
          ? '0 4px 20px rgba(0,0,0,0.3)'
          : '0 4px 20px rgba(0,0,0,0.1)';
      }}
      >
        {/* Priority and New badges */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          gap: '8px',
          zIndex: 2
        }}>
          {isHighPriority && (
            <div style={{
              background: '#f59e0b',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ⭐ TOP
            </div>
          )}
          {isNew && (
            <div style={{
              background: '#ef4444',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              NEU
            </div>
          )}
        </div>

        {/* Thumbnail */}
        <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
          {item.thumbnail ? (
            <img 
              src={item.thumbnail} 
              alt="Highlight thumbnail" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              background: config.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              color: 'white'
            }}>
              {config.emoji}
            </div>
          )}
          
          {/* Play button overlay */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60px',
            height: '60px',
            background: 'rgba(0,0,0,0.7)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: 'white',
            transition: 'all 0.3s ease'
          }}>
            ▶️
          </div>
          
          {/* Sport badge */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: config.gradient,
            color: 'white',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>{config.emoji}</span>
            {item.sport}
          </div>
        </div>
        
        {/* Content */}
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: isDarkMode ? '#f9fafb' : '#111827',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {item.title}
          </h3>
          
          {item.description && (
            <p style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {item.description}
            </p>
          )}
          
          {/* Meta info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            fontSize: '12px',
            color: isDarkMode ? '#9ca3af' : '#6b7280'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {item.source && (
                <span style={{
                  background: isDarkMode ? '#374151' : '#f3f4f6',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  {item.source}
                </span>
              )}
              {item.date && (
                <span style={{ fontWeight: '500' }}>
                  {new Date(item.date).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                  })}
                </span>
              )}
              {item.duration && (
                <span style={{
                  background: isDarkMode ? '#374151' : '#f3f4f6',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: '500'
                }}>
                  {item.duration}
                </span>
              )}
            </div>
            
            {item.views && (
              <span style={{ fontWeight: '500' }}>
                👁️ {item.views.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

export default function Highlights() {
  const [items, setItems] = useState<Item[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sportFilter, setSportFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    
    async function load() {
      try {
        setLoading(true);
        setError('');
        
        // Try Scorebat (Fußball Highlights, no API key required)
        const r = await fetch('https://www.scorebat.com/video-api/v3/');
        if (!r.ok) throw new Error('Scorebat request failed');
        const data = await r.json();
        const list = (data.response || []).slice(0, 12).map((it: any) => {
          const vid = (it.videos && it.videos[0]) || {};
          return {
            id: it.title + (it.date || ''),
            title: it.title,
            url: it.matchviewUrl || (vid?.embed ? extractSrcFromEmbed(vid.embed) : '#'),
            sport: it.competition || 'Fußball',
            thumbnail: it.thumbnail || undefined,
            date: it.date,
            duration: vid?.title || '2:30', // Default duration
            views: Math.floor(Math.random() * 100000) + 10000, // Mock views
            description: it.title // Use title as description for now
          } as Item;
        });
        
        if (!cancelled) {
          setAllItems(list);
          setItems(list);
          setLoading(false);
        }
      } catch (e) {
        try {
          // Fallback to backend static highlights
          const res = await api.get('/highlights');
          const arr = (Array.isArray(res.data) ? res.data : res.data.items) as any[];
          if (!cancelled) {
            setAllItems(arr);
            setItems(arr);
            setLoading(false);
          }
        } catch (err) {
          if (!cancelled) {
            setError('Keine Highlights verfügbar');
            setLoading(false);
          }
        }
      }
    }
    
    load();
    return () => { cancelled = true; };
  }, []);

  // Filter items based on sport selection
  useEffect(() => {
    if (sportFilter === 'all') {
      setItems(allItems);
    } else {
      setItems(allItems.filter(item => 
        item.sport.toLowerCase() === sportFilter.toLowerCase()
      ));
    }
  }, [sportFilter, allItems]);

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
        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
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
            <span style={{ fontSize: '24px' }}>🎥</span>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '700',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                Highlights
              </h2>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '14px',
                opacity: 0.9,
                fontWeight: '500'
              }}>
                Die besten Momente aus der Sportwelt
              </p>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px'
            }}>
              {loading ? 'LÄDT...' : `${items.length} Videos`}
            </div>
            <div style={{
              fontSize: '11px',
              opacity: 0.8,
              fontWeight: '500'
            }}>
              Täglich aktualisiert
            </div>
          </div>
        </div>
      </div>
      
      {/* Sport Filter */}
      <div style={{
        padding: '16px 24px 0 24px',
        borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {['all', 'Fußball', 'F1', 'NFL', 'Basketball', 'Tennis'].map((sport) => (
            <button
              key={sport}
              onClick={() => setSportFilter(sport)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: sportFilter === sport 
                  ? (sport === 'all' ? '#8b5cf6' : getSportConfig(sport).color)
                  : (isDarkMode ? '#374151' : '#f3f4f6'),
                color: sportFilter === sport 
                  ? 'white' 
                  : (isDarkMode ? '#d1d5db' : '#6b7280'),
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'capitalize'
              }}
              onMouseEnter={(e) => {
                if (sportFilter !== sport) {
                  e.currentTarget.style.background = isDarkMode ? '#4b5563' : '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                if (sportFilter !== sport) {
                  e.currentTarget.style.background = isDarkMode ? '#374151' : '#f3f4f6';
                }
              }}
            >
              {sport === 'all' ? 'Alle' : sport}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div style={{ 
        padding: '24px',
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
              border: '3px solid #8b5cf620',
              borderTop: '3px solid #8b5cf6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px'
            }} />
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
              Lade Highlights...
            </div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              Sammle die besten Sportmomente
            </div>
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: isDarkMode ? '#9ca3af' : '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
              🎥
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              {error}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              Versuche es später erneut
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {items.map((item) => (
              <ModernHighlightCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function extractSrcFromEmbed(embedHtml: string): string {
  const m = embedHtml.match(/src=\"([^\"]+)\"/);
  return m ? m[1] : '#';
}