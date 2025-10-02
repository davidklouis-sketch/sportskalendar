import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type Entry = { position: number; name: string; meta?: string; points?: number; info?: string };

function Row({ e }: { e: Entry }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
      <div style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: 12 }}>{e.info}</div>
    </div>
  );
}

function Table({ title, endpoint }: { title: string; endpoint: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  useEffect(() => {
    let active = true;
    const load = async () => {
      const r = await api.get(endpoint);
      if (active) setEntries(r.data.entries);
    };
    load();
    const id = setInterval(load, 5000);
    return () => { active = false; clearInterval(id); };
  }, [endpoint]);
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', fontWeight: 600 }}>{title}</div>
      <div className="hscroller" style={{ display: 'block', maxHeight: 280, overflowY: 'auto' }}>
        {entries.map((e) => (
          <Row key={e.position + e.name} e={e} />
        ))}
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


