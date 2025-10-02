import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type Post = { id: string; user: string; text: string; createdAt: string; hashtags: string[] };

export default function CommunityStream() {
  const [items, setItems] = useState<Post[]>([]);
  const [text, setText] = useState('');
  useEffect(() => {
    api.get('/community/stream').then((res) => setItems(res.data));
  }, []);
  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await api.post('/community/post', { text });
    setItems((prev) => [res.data, ...prev]);
    setText('');
  }
  return (
    <div style={{ display: 'grid', gap: '.75rem' }}>
      <form onSubmit={submitPost} style={{ display: 'flex', gap: '.5rem' }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Dein Kommentar..." />
        <button type="submit">Posten</button>
      </form>
      {items.map((p) => (
        <div key={p.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '.5rem .75rem' }}>
          <div style={{ fontSize: 12, color: '#666' }}>{new Date(p.createdAt).toLocaleString()} · {p.user}</div>
          <div>{p.text}</div>
          <div style={{ color: '#888', fontSize: 12 }}>{p.hashtags.join(' ')}</div>
        </div>
      ))}
    </div>
  );
}



