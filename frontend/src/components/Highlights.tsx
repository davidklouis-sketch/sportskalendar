import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type Item = { id: string; title: string; url: string; sport: string; thumbnail?: string; date?: string };

export default function Highlights() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
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
          } as Item;
        });
        if (!cancelled) setItems(list);
      } catch (e) {
        try {
          // Fallback to backend static highlights
          const res = await api.get('/highlights');
          const arr = (Array.isArray(res.data) ? res.data : res.data.items) as any[];
          if (!cancelled) setItems(arr);
        } catch (err) {
          if (!cancelled) setError('Keine Highlights verfügbar');
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="hscroller">
      {error && <div className="card" style={{ padding: 12 }}>{error}</div>}
      {items.map((h) => (
        <a key={h.id} href={h.url} target="_blank" rel="noreferrer" className="card hcard" style={{ textDecoration: 'none', color: 'inherit' }}>
          {h.thumbnail && (
            <img src={h.thumbnail} alt="thumbnail" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
          )}
          <strong style={{ display: 'block', marginBottom: 4 }}>{h.title}</strong>
          <div style={{ color: '#666', fontSize: 12 }}>{h.sport}{h.date ? ` · ${new Date(h.date).toLocaleString()}` : ''}</div>
        </a>
      ))}
    </div>
  );
}

function extractSrcFromEmbed(embedHtml: string): string {
  const m = embedHtml.match(/src=\"([^\"]+)\"/);
  return m ? m[1] : '#';
}


