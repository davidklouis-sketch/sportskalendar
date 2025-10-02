import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type User = { id: string; email: string; displayName: string; role?: 'user' | 'admin' };

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);

  async function load() {
    const res = await api.get('/admin/users');
    setUsers(res.data.users);
  }
  useEffect(() => { load(); }, []);

  async function removeUser(id: string) {
    await api.delete(`/admin/users/${id}`);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div className="container" style={{ padding: '16px 0' }}>
      <h2>Admin · Nutzerverwaltung</h2>
      <div className="cards">
        {users.map((u) => (
          <div key={u.id} className="card">
            <div><strong>{u.displayName}</strong> ({u.email})</div>
            <div style={{ color: '#666', fontSize: 12 }}>Rolle: {u.role}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button className="btn secondary" onClick={() => removeUser(u.id)}>Löschen</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



