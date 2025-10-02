import { useEffect, useRef, useState } from 'react';

type Item = { type: string; message: string; ts: number; id?: string; url?: string; source?: string };

export default function LiveTickerWidget() {
  const [items, setItems] = useState<Item[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const windowStartRef = useRef<number>(Date.now());
  useEffect(() => {
    const url = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/ticker/stream';
    let ev: EventSource | null = null;

    const attach = () => {
      if (ev) ev.close();
      ev = new EventSource(url);
      ev.onmessage = (e) => {
        const data = JSON.parse(e.data) as Item;
        const id = `${data.ts}-${data.message}`;
        if (Date.now() - windowStartRef.current > 120000) {
          seenRef.current.clear();
          windowStartRef.current = Date.now();
        }
        if (seenRef.current.has(id)) return;
        seenRef.current.add(id);
        setItems((prev) => [{ ...data, id }, ...prev].slice(0, 15));
      };
      ev.onerror = () => {
        // Let EventSource auto-retry; ensure we don't spam attach()
      };
    };

    attach();

    return () => {
      if (ev) ev.close();
    };
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem', maxHeight: 300, overflowY: 'auto' }}>
      {items.map((it) => (
        <div key={it.id || `${it.ts}-${it.message}`}>
          {new Date(it.ts).toLocaleTimeString()} – {it.url ? (
            <a href={it.url} target="_blank" rel="noopener noreferrer">{it.message}</a>
          ) : (
            it.message
          )}
          {it.source ? ` · ${it.source}` : ''}
        </div>
      ))}
    </div>
  );
}


