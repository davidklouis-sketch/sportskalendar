import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';

type EventItem = { id: string; title: string; sport: string; startsAt: string };

export default function CalendarWidget() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);
  const { user } = useAuth();
  const [sport, setSport] = useState<'football' | 'nfl' | 'f1'>('football');
  const [leagues, setLeagues] = useState<number[]>([39, 78, 2, 4]);
  const leaguesParam = useMemo(() => (sport === 'football' ? leagues.join(',') : ''), [sport, leagues]);
  const [newTitle, setNewTitle] = useState('');
  const [newWhen, setNewWhen] = useState(''); // datetime-local
  const [icsText, setIcsText] = useState('');
  const [icsUrl, setIcsUrl] = useState('');
  useEffect(() => {
    const params = sport === 'football' ? `?sport=${sport}&leagues=${leaguesParam}` : `?sport=${sport}`;
    api.get(`/calendar${params}`).then((res) => setEvents(res.data));
    if (user) {
      api.get('/calendar/reminder').then((r) => setReminders(r.data.reminders));
    } else {
      setReminders([]);
    }
  }, [user, sport, leaguesParam]);

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
    <div style={{ display: 'grid', gap: '.5rem' }}>
      <div className="card" style={{ padding: '.5rem .75rem', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong>Sport:</strong>
          <button className="btn secondary" onClick={() => setSport('football')} aria-pressed={sport==='football'}>Fußball</button>
          <button className="btn secondary" onClick={() => setSport('nfl')} aria-pressed={sport==='nfl'}>NFL</button>
          <button className="btn secondary" onClick={() => setSport('f1')} aria-pressed={sport==='f1'}>F1</button>
        </div>
        {sport === 'football' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <strong>Ligen:</strong>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={leagues.includes(39)} onChange={() => onLeagueToggle(39)} /> PL
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={leagues.includes(78)} onChange={() => onLeagueToggle(78)} /> BL
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={leagues.includes(2)} onChange={() => onLeagueToggle(2)} /> UCL
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={leagues.includes(4)} onChange={() => onLeagueToggle(4)} /> EURO
            </label>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '.75rem', display: 'grid', gap: 8 }}>
        <strong>Eigenes Event hinzufügen</strong>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input placeholder="Titel" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ flex: '1 1 220px', padding: '.5rem', border: '1px solid #e5e7eb', borderRadius: 6 }} />
          <input type="datetime-local" value={newWhen} onChange={(e) => setNewWhen(e.target.value)} style={{ flex: '0 0 220px', padding: '.5rem', border: '1px solid #e5e7eb', borderRadius: 6 }} />
          <button className="btn" onClick={async () => {
            if (!newTitle || !newWhen) return;
            const iso = new Date(newWhen).toISOString();
            await api.post('/calendar/custom', { title: newTitle, sport, startsAt: iso });
            setNewTitle(''); setNewWhen('');
            const params = sport === 'football' ? `?sport=${sport}&leagues=${leaguesParam}` : `?sport=${sport}`;
            const r = await api.get(`/calendar${params}`);
            setEvents(r.data);
          }}>Speichern</button>
        </div>
        <details>
          <summary>ICS importieren (optional)</summary>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            <input placeholder="ICS URL (optional)" value={icsUrl} onChange={(e)=>setIcsUrl(e.target.value)} style={{ padding: '.5rem', border: '1px solid #e5e7eb', borderRadius: 6 }} />
            <textarea placeholder="ICS Inhalt hier einfügen (BEGIN:VCALENDAR...)" value={icsText} onChange={(e)=>setIcsText(e.target.value)} rows={4} style={{ padding: '.5rem', border: '1px solid #e5e7eb', borderRadius: 6 }} />
            <button className="btn secondary" onClick={async ()=>{
              if (!icsUrl && !icsText) return;
              await api.post('/calendar/import-ics', { sport, url: icsUrl || undefined, ics: icsText || undefined });
              setIcsUrl(''); setIcsText('');
              const params = sport === 'football' ? `?sport=${sport}&leagues=${leaguesParam}` : `?sport=${sport}`;
              const r = await api.get(`/calendar${params}`);
              setEvents(r.data);
            }}>Importieren</button>
          </div>
        </details>
      </div>

      <div style={{ display: 'grid', gap: '.5rem', maxHeight: 300, overflowY: 'auto' }}>
      {events.slice(0, 5).map((e) => {
        const isSet = reminders.includes(e.id);
        return (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #eee', borderRadius: 8, padding: '.5rem .75rem' }}>
            <div>
              <strong>{e.title}</strong>
              <div style={{ color: '#666', fontSize: 12 }}>{new Date(e.startsAt).toLocaleString()} · {e.sport}</div>
            </div>
            <button onClick={() => toggleReminder(e.id)}>{isSet ? 'Reminder entfernen' : 'Reminder setzen'}</button>
          </div>
        );
      })}
        {events.length === 0 && (
          <div style={{ color: '#666', fontSize: 14 }}>Keine Termine gefunden. Bitte Sport/Ligen anpassen.</div>
        )}
      </div>
    </div>
  );
}


