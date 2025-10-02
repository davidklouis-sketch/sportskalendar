import { useEffect, useState } from 'react';
import { api } from '../lib/api';

// Dark mode detection
const isDarkMode = document.documentElement.classList.contains('dark') || 
  window.matchMedia('(prefers-color-scheme: dark)').matches;

type Entry = { position: number; name: string; meta?: string; points?: number; info?: string };
type ApiResponse = { 
  entries: Entry[]; 
  message?: string; 
  error?: string; 
  nextEvent?: { name: string; date: string; teams?: string; circuit?: string } 
};

function Row({ e, isError }: { e: Entry; isError?: boolean }) {
  const textColor = isError ? '#dc2626' : e.meta === 'Fehler' ? '#dc2626' : (isDarkMode ? '#f9fafb' : 'inherit');
  const bgColor = e.meta === 'Kein Live-Spiel aktiv' || e.meta === 'Kein Live-Spiel' || e.meta === 'Kein Live-Rennen aktiv' 
    ? (isDarkMode ? '#374151' : '#f3f4f6') : 'transparent';
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 8, 
      padding: '6px 8px', 
      borderBottom: `1px solid ${isDarkMode ? '#374151' : 'var(--color-border)'}`,
      backgroundColor: bgColor,
      color: textColor
    }}>
      <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
      <div style={{ marginLeft: 'auto', color: isError ? '#dc2626' : (isDarkMode ? '#9ca3af' : 'var(--color-text-muted)'), fontSize: 12 }}>{e.info}</div>
    </div>
  );
}

function Table({ title, endpoint }: { title: string; endpoint: string }) {
  const [data, setData] = useState<ApiResponse>({ entries: [] });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = await api.get(endpoint);
        if (active) {
          setData(r.data);
          setLoading(false);
        }
      } catch (error) {
        if (active) {
          setData({
            entries: [{
              position: 1,
              name: 'Verbindungsfehler',
              info: 'Kann keine Daten laden',
              meta: 'Fehler'
            }],
            error: 'Verbindungsfehler'
          });
          setLoading(false);
        }
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => { active = false; clearInterval(id); };
  }, [endpoint]);

  const headerColor = data.error ? '#dc2626' : data.message ? '#059669' : 'inherit';
  const headerText = data.error || data.message || title;

  return (
    <div className="card" style={{ 
      padding: 0, 
      overflow: 'hidden',
      backgroundColor: isDarkMode ? '#1f2937' : 'white',
      border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
    }}>
      <div style={{ 
        padding: '8px 12px', 
        borderBottom: `1px solid ${isDarkMode ? '#374151' : 'var(--color-border)'}`, 
        fontWeight: 600,
        color: headerColor,
        backgroundColor: data.error ? (isDarkMode ? '#7f1d1d' : '#fef2f2') : data.message ? (isDarkMode ? '#14532d' : '#f0fdf4') : 'transparent'
      }}>
        {headerText}
      </div>
      <div className="hscroller" style={{ 
        display: 'block', 
        maxHeight: 280, 
        overflowY: 'auto',
        backgroundColor: isDarkMode ? '#111827' : 'white'
      }}>
        {loading ? (
          <div style={{ 
            padding: '16px', 
            textAlign: 'center', 
            color: isDarkMode ? '#9ca3af' : 'var(--color-text-muted)' 
          }}>
            Lade Daten...
          </div>
        ) : (
          data.entries.map((e) => (
            <Row key={e.position + e.name} e={e} isError={!!data.error} />
          ))
        )}
      </div>
    </div>
  );
}

export default function Scoreboard() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
      <Table title="F1 Live" endpoint="/live/f1" />
      <Table title="Fußball Live" endpoint="/live/soccer" />
      <Table title="NFL Live" endpoint="/live/nfl" />
    </div>
  );
}


