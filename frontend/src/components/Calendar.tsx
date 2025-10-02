import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';

type EventItem = { id: string; title: string; sport: string; startsAt: string };

export default function CalendarWidget() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]); // Store all events for filtering
  const [reminders, setReminders] = useState<string[]>([]);
  const { user } = useAuth();
  const [sport, setSport] = useState<'football' | 'nfl' | 'f1'>('football');
  const [leagues, setLeagues] = useState<number[]>([39, 78, 2, 4]);
  const [sportFilter, setSportFilter] = useState<'all' | 'football' | 'nfl' | 'f1'>('all');
  const leaguesParam = useMemo(() => (sport === 'football' ? leagues.join(',') : ''), [sport, leagues]);
  const [newTitle, setNewTitle] = useState('');
  const [newWhen, setNewWhen] = useState(''); // datetime-local
  
  // Dark mode detection
  const isDarkMode = document.documentElement.classList.contains('dark') || 
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  // Load all sports data
  useEffect(() => {
    const loadAllSports = async () => {
      try {
        const [footballRes, nflRes, f1Res] = await Promise.all([
          api.get(`/calendar?sport=football&leagues=${leagues.join(',')}`),
          api.get('/calendar?sport=nfl'),
          api.get('/calendar?sport=f1')
        ]);
        
        // Create a Map to deduplicate events by ID
        const eventMap = new Map();
        
        // Add all events to the map (this will automatically deduplicate by ID)
        [...footballRes.data, ...nflRes.data, ...f1Res.data].forEach(event => {
          eventMap.set(event.id, event);
        });
        
        const allSportsEvents = Array.from(eventMap.values());
        
        console.log('Loaded sports data:', {
          football: footballRes.data.length,
          nfl: nflRes.data.length,
          f1: f1Res.data.length,
          totalBeforeDedup: footballRes.data.length + nflRes.data.length + f1Res.data.length,
          totalAfterDedup: allSportsEvents.length,
          f1Events: f1Res.data.map(e => ({ id: e.id, title: e.title })),
          allEvents: allSportsEvents.map(e => ({ id: e.id, title: e.title, sport: e.sport }))
        });
        
        setAllEvents(allSportsEvents);
      } catch (error) {
        console.error('Error loading sports data:', error);
      }
    };

    loadAllSports();
    
    if (user) {
      api.get('/calendar/reminder').then((r) => setReminders(r.data.reminders));
    } else {
      setReminders([]);
    }
  }, [user, leagues]);

  // Filter events based on sport filter
  useEffect(() => {
    console.log('Filtering events:', { 
      sportFilter, 
      allEventsCount: allEvents.length,
      allEventsSports: allEvents.map(e => e.sport)
    });
    
    let filteredEvents;
    if (sportFilter === 'all') {
      filteredEvents = allEvents;
    } else {
      filteredEvents = allEvents.filter(event => {
        if (sportFilter === 'football') return event.sport === 'Fußball';
        if (sportFilter === 'nfl') return event.sport === 'NFL';
        if (sportFilter === 'f1') return event.sport === 'F1';
        return true;
      });
    }
    
    // Sort events by date (earliest first)
    const sortedEvents = filteredEvents.sort((a, b) => 
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
    
    console.log('Filtered events:', { 
      filter: sportFilter, 
      filteredCount: sortedEvents.length,
      filteredEvents: sortedEvents.slice(0, 5).map(e => ({ title: e.title, sport: e.sport, date: e.startsAt }))
    });
    
    setEvents(sortedEvents);
  }, [allEvents, sportFilter]);

  async function toggleReminder(id: string) {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    const isSet = reminders.includes(id);
    if (isSet) {
      await api.delete('/calendar/reminder', { data: { eventId: id } });
    } else {
      await api.post('/calendar/reminder', new URLSearchParams({ eventId: id }));
    }
    const r = await api.get('/calendar/reminder');
    setReminders(r.data.reminders);
  }

  function onLeagueToggle(value: number) {
    setLeagues((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  return (
    <div style={{ 
      display: 'grid', 
      gap: '1.5rem',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '1rem',
      backgroundColor: isDarkMode ? '#1f2937' : 'transparent',
      color: isDarkMode ? '#f9fafb' : '#111827'
    }}>
      
      {/* Sport Filter Section */}
      <div className="card" style={{ 
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '600' }}>
          🗓️ Sports Kalender
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: '🌟 Alle Sportarten', color: '#8b5cf6' },
            { key: 'football', label: '⚽ Fußball', color: '#10b981' },
            { key: 'f1', label: '🏎️ Formel 1', color: '#f59e0b' },
            { key: 'nfl', label: '🏈 NFL', color: '#ef4444' }
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setSportFilter(key as any)}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: sportFilter === key ? 'white' : 'rgba(255,255,255,0.2)',
                color: sportFilter === key ? color : 'white',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: sportFilter === key ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* League Selection for Football */}
      {sport === 'football' && (
        <div className="card" style={{ padding: '1rem', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', color: '#374151', fontSize: '1.1rem' }}>
            ⚽ Fußball Ligen auswählen
          </h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { id: 39, name: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League', color: '#3b1f8b' },
              { id: 78, name: '🇩🇪 Bundesliga', color: '#d70909' },
              { id: 2, name: '🏆 Champions League', color: '#00326e' },
              { id: 4, name: '🇪🇺 EM 2024', color: '#003d82' }
            ].map(({ id, name, color }) => (
              <label
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: `2px solid ${leagues.includes(id) ? color : '#e5e7eb'}`,
                  background: leagues.includes(id) ? `${color}15` : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={leagues.includes(id)}
                  onChange={() => onLeagueToggle(id)}
                  style={{ margin: 0 }}
                />
                <span style={{ 
                  fontWeight: leagues.includes(id) ? '600' : '400',
                  color: leagues.includes(id) ? color : '#6b7280'
                }}>
                  {name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Event */}
      <div className="card" style={{ padding: '1.5rem', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1.1rem' }}>
          ➕ Eigenes Event hinzufügen
        </h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                Event Titel
              </label>
              <input
                placeholder="z.B. Mein Fußballspiel"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                Datum & Zeit
              </label>
              <input
                type="datetime-local"
                value={newWhen}
                onChange={(e) => setNewWhen(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>
            <button
              onClick={async () => {
                if (!newTitle || !newWhen) return;
                const iso = new Date(newWhen).toISOString();
                await api.post('/calendar/custom', { title: newTitle, sport, startsAt: iso });
                setNewTitle(''); setNewWhen('');
                
                // Reload all sports data
                const [footballRes, nflRes, f1Res] = await Promise.all([
                  api.get(`/calendar?sport=football&leagues=${leagues.join(',')}`),
                  api.get('/calendar?sport=nfl'),
                  api.get('/calendar?sport=f1')
                ]);
                
                // Create a Map to deduplicate events by ID
                const eventMap = new Map();
                
                // Add all events to the map (this will automatically deduplicate by ID)
                [...footballRes.data, ...nflRes.data, ...f1Res.data].forEach(event => {
                  eventMap.set(event.id, event);
                });
                
                const allSportsEvents = Array.from(eventMap.values());
                setAllEvents(allSportsEvents);
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '1rem',
                height: 'fit-content'
              }}
            >
              💾 Speichern
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="card" style={{ padding: '1.5rem', borderRadius: '8px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '2px solid #f3f4f6'
        }}>
          <h3 style={{ margin: 0, color: '#111827', fontSize: '1.25rem', fontWeight: '700' }}>
            📅 Kommende Events ({events.length})
          </h3>
          {sportFilter !== 'all' && (
            <span style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280',
              background: '#f3f4f6',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontWeight: '500'
            }}>
              Filter: {sportFilter === 'football' ? '⚽ Fußball' : sportFilter === 'f1' ? '🏎️ F1' : '🏈 NFL'}
            </span>
          )}
        </div>
        
        <div style={{ 
          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`, 
          borderRadius: '8px', 
          overflow: 'hidden',
          maxHeight: '500px',
          overflowY: 'auto',
          backgroundColor: isDarkMode ? '#111827' : 'white'
        }}>
          {events.slice(0, 50).map((e, index) => {
            const isSet = reminders.includes(e.id);
            const eventDate = new Date(e.startsAt);
            const isToday = eventDate.toDateString() === new Date().toDateString();
            const isThisWeek = eventDate.getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;
            
            const sportEmoji = e.sport === 'F1' ? '🏎️' : e.sport === 'NFL' ? '🏈' : '⚽';
            const sportColor = e.sport === 'F1' ? '#f59e0b' : e.sport === 'NFL' ? '#ef4444' : '#10b981';
            
            return (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderBottom: index < events.slice(0, 50).length - 1 ? `1px solid ${isDarkMode ? '#374151' : '#f3f4f6'}` : 'none',
                  backgroundColor: isToday 
                    ? `${sportColor}10` 
                    : isThisWeek 
                    ? (isDarkMode ? '#1f2937' : '#f8fafc')
                    : (isDarkMode ? '#111827' : 'white'),
                  transition: 'background-color 0.2s ease',
                  cursor: 'pointer',
                  color: isDarkMode ? '#f9fafb' : '#111827'
                }}
                onMouseEnter={(e) => {
                  if (!isToday && !isThisWeek) {
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#1f2937' : '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isToday && !isThisWeek) {
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#111827' : 'white';
                  }
                }}
              >
                <div style={{ 
                  fontSize: '1.5rem',
                  color: sportColor,
                  minWidth: '2rem',
                  textAlign: 'center'
                }}>
                  {sportEmoji}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    color: isDarkMode ? '#f9fafb' : '#111827',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: '2px'
                  }}>
                    {e.title}
                    {isToday && (
                      <span style={{ 
                        marginLeft: '8px',
                        padding: '2px 6px',
                        background: sportColor,
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '700'
                      }}>
                        HEUTE
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    color: isDarkMode ? '#9ca3af' : '#6b7280', 
                    fontSize: '0.875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {eventDate.toLocaleDateString('de-DE', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                
                <button
                  onClick={() => toggleReminder(e.id)}
                  style={{
                    padding: '6px 12px',
                    background: isSet 
                      ? '#ef4444' 
                      : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: '500',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    minWidth: '80px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {isSet ? '🔕 Entfernen' : '🔔 Reminder'}
                </button>
              </div>
            );
          })}
          
          {events.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem 1rem',
              color: '#9ca3af',
              fontSize: '1.1rem'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                Keine Events gefunden
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                {sportFilter === 'all' 
                  ? 'Versuche andere Sport-/Liga-Einstellungen' 
                  : `Keine ${sportFilter === 'football' ? 'Fußball' : sportFilter === 'f1' ? 'F1' : 'NFL'}-Events verfügbar`
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


