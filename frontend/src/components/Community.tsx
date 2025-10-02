import { useEffect, useState } from 'react';
import { api } from '../lib/api';

// Dark mode detection
const isDarkMode = document.documentElement.classList.contains('dark') || 
  window.matchMedia('(prefers-color-scheme: dark)').matches;

type Post = { 
  id: string; 
  user: string; 
  text: string; 
  createdAt: string; 
  hashtags: string[];
  likes?: number;
  replies?: number;
  avatar?: string;
  verified?: boolean;
  sport?: string;
};

// Sport-specific configurations
const sportConfigs = {
  'Fußball': { emoji: '⚽', color: '#10b981', bgColor: '#d1fae5' },
  'F1': { emoji: '🏎️', color: '#f59e0b', bgColor: '#fef3c7' },
  'NFL': { emoji: '🏈', color: '#ef4444', bgColor: '#fee2e2' },
  'Basketball': { emoji: '🏀', color: '#8b5cf6', bgColor: '#ede9fe' },
  'Tennis': { emoji: '🎾', color: '#06b6d4', bgColor: '#cffafe' },
  'default': { emoji: '💬', color: '#6b7280', bgColor: '#f3f4f6' }
};

function getSportConfig(sport?: string) {
  if (!sport) return sportConfigs.default;
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

function generateAvatar(name: string) {
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4'];
  const color = colors[name.length % colors.length];
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return { color, initials };
}

function ModernPost({ post }: { post: Post }) {
  const config = getSportConfig(post.sport);
  const avatar = generateAvatar(post.user);
  const timeAgo = Math.floor((Date.now() - new Date(post.createdAt).getTime()) / 1000);
  const isNew = timeAgo < 300; // Less than 5 minutes old
  
  const getTimeDisplay = () => {
    if (timeAgo < 60) return 'Gerade eben';
    if (timeAgo < 3600) return `${Math.floor(timeAgo / 60)}m`;
    if (timeAgo < 86400) return `${Math.floor(timeAgo / 3600)}h`;
    return `${Math.floor(timeAgo / 86400)}d`;
  };

  return (
    <div style={{
      background: isDarkMode ? '#1f2937' : 'white',
      borderRadius: '16px',
      border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
      padding: '20px',
      margin: '12px 0',
      boxShadow: isDarkMode 
        ? '0 2px 8px rgba(0,0,0,0.3)'
        : '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = isDarkMode 
        ? '0 4px 20px rgba(0,0,0,0.4)'
        : '0 4px 20px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = isDarkMode 
        ? '0 2px 8px rgba(0,0,0,0.3)'
        : '0 2px 8px rgba(0,0,0,0.1)';
    }}
    >
      {/* New indicator */}
      {isNew && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: '#ef4444',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          NEU
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Avatar */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: avatar.color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: '700',
          flexShrink: 0
        }}>
          {avatar.initials}
        </div>
        
        {/* User info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px'
          }}>
            <span style={{
              fontSize: '16px',
              fontWeight: '600',
              color: isDarkMode ? '#f9fafb' : '#111827'
            }}>
              {post.user}
            </span>
            {post.verified && (
              <span style={{ fontSize: '16px', color: '#3b82f6' }}>✓</span>
            )}
            {post.sport && (
              <span style={{
                background: config.bgColor,
                color: config.color,
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>{config.emoji}</span>
                {post.sport}
              </span>
            )}
          </div>
          <div style={{
            fontSize: '12px',
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            fontWeight: '500'
          }}>
            {getTimeDisplay()}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div style={{
        fontSize: '15px',
        lineHeight: '1.5',
        color: isDarkMode ? '#f9fafb' : '#111827',
        marginBottom: '16px',
        wordWrap: 'break-word'
      }}>
        {post.text}
      </div>
      
      {/* Hashtags */}
      {post.hashtags.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '16px'
        }}>
          {post.hashtags.map((tag, index) => (
            <span
              key={index}
              style={{
                background: isDarkMode ? '#374151' : '#f3f4f6',
                color: '#3b82f6',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3b82f6';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDarkMode ? '#374151' : '#f3f4f6';
                e.currentTarget.style.color = '#3b82f6';
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      {/* Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        paddingTop: '16px',
        borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
      }}>
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: '8px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isDarkMode ? '#374151' : '#f3f4f6';
          e.currentTarget.style.color = '#ef4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'none';
          e.currentTarget.style.color = isDarkMode ? '#9ca3af' : '#6b7280';
        }}
        >
          <span>❤️</span>
          {post.likes || Math.floor(Math.random() * 50)}
        </button>
        
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: '8px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isDarkMode ? '#374151' : '#f3f4f6';
          e.currentTarget.style.color = '#3b82f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'none';
          e.currentTarget.style.color = isDarkMode ? '#9ca3af' : '#6b7280';
        }}
        >
          <span>💬</span>
          {post.replies || Math.floor(Math.random() * 10)}
        </button>
        
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: '8px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isDarkMode ? '#374151' : '#f3f4f6';
          e.currentTarget.style.color = '#10b981';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'none';
          e.currentTarget.style.color = isDarkMode ? '#9ca3af' : '#6b7280';
        }}
        >
          <span>🔄</span>
          Teilen
        </button>
      </div>
    </div>
  );
}

export default function CommunityStream() {
  const [items, setItems] = useState<Post[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      setLoading(true);
      const res = await api.get('/community/stream');
      setItems(res.data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    
    try {
      setSubmitting(true);
      const res = await api.post('/community/post', { text });
      
      // Add mock data for the new post
      const newPost = {
        ...res.data,
        likes: 0,
        replies: 0,
        verified: Math.random() > 0.7, // 30% chance of being verified
        sport: detectSportFromText(text)
      };
      
      setItems((prev) => [newPost, ...prev]);
      setText('');
    } catch (error) {
      console.error('Error submitting post:', error);
    } finally {
      setSubmitting(false);
    }
  }

  function detectSportFromText(text: string): string | undefined {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('fußball') || lowerText.includes('soccer') || lowerText.includes('tor')) {
      return 'Fußball';
    }
    if (lowerText.includes('f1') || lowerText.includes('formel') || lowerText.includes('rennen')) {
      return 'F1';
    }
    if (lowerText.includes('nfl') || lowerText.includes('touchdown') || lowerText.includes('super bowl')) {
      return 'NFL';
    }
    if (lowerText.includes('basketball') || lowerText.includes('nba')) {
      return 'Basketball';
    }
    if (lowerText.includes('tennis') || lowerText.includes('wimbledon')) {
      return 'Tennis';
    }
    return undefined;
  }

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
        background: 'linear-gradient(135deg, #10b981, #059669)',
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
            <span style={{ fontSize: '24px' }}>💬</span>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '700',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                Community Stream
              </h2>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '14px',
                opacity: 0.9,
                fontWeight: '500'
              }}>
                Diskutiere mit anderen Sportfans
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
              {loading ? 'LÄDT...' : `${items.length} Posts`}
            </div>
            <div style={{
              fontSize: '11px',
              opacity: 0.8,
              fontWeight: '500'
            }}>
              Live Diskussionen
            </div>
          </div>
        </div>
      </div>
      
      {/* Post Form */}
      <div style={{
        padding: '24px',
        borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
        background: isDarkMode ? '#111827' : '#fafafa'
      }}>
        <form onSubmit={submitPost} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            background: isDarkMode ? '#1f2937' : 'white',
            borderRadius: '12px',
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            padding: '16px',
            position: 'relative'
          }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Was denkst du über das Spiel? Teile deine Gedanken mit der Community..."
              style={{
                width: '100%',
                minHeight: '80px',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: isDarkMode ? '#f9fafb' : '#111827',
                fontSize: '15px',
                lineHeight: '1.5',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              disabled={submitting}
            />
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              fontSize: '12px',
              color: isDarkMode ? '#9ca3af' : '#6b7280'
            }}>
              {text.length}/500
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              fontSize: '12px',
              color: isDarkMode ? '#9ca3af' : '#6b7280'
            }}>
              💡 Tipp: Verwende Hashtags wie #Fußball #F1 #NFL für bessere Sichtbarkeit
            </div>
            
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              style={{
                background: text.trim() && !submitting 
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : (isDarkMode ? '#374151' : '#f3f4f6'),
                color: text.trim() && !submitting ? 'white' : (isDarkMode ? '#6b7280' : '#9ca3af'),
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: text.trim() && !submitting ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {submitting ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Posten...
                </>
              ) : (
                <>
                  <span>📝</span>
                  Posten
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Posts */}
      <div style={{ 
        padding: '24px',
        background: isDarkMode ? '#111827' : '#fafafa',
        maxHeight: '600px',
        overflowY: 'auto'
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
              border: '3px solid #10b98120',
              borderTop: '3px solid #10b981',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px'
            }} />
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
              Lade Community-Posts...
            </div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              Verbinde mit anderen Sportfans
            </div>
          </div>
        ) : items.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: isDarkMode ? '#9ca3af' : '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
              💬
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              Noch keine Posts
            </div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              Sei der Erste, der einen Post erstellt!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((post) => (
              <ModernPost key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}