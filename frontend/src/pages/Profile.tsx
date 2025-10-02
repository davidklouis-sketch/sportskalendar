import { useState } from 'react';
import { useAuth } from '../store/auth';
import { api } from '../lib/api';

export default function ProfilePage() {
  const { user, hydrate } = useAuth();
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    await api.post('/user/change-email', { email });
    await hydrate();
    setMsg('E-Mail aktualisiert');
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    await api.post('/user/change-password', { currentPassword, newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setMsg('Passwort aktualisiert');
  }

  return (
    <div className="container" style={{ padding: '16px 0', display: 'grid', gap: 16 }}>
      <h2>Profil</h2>
      {msg && <div className="card" style={{ padding: 12 }}>{msg}</div>}
      <form onSubmit={changeEmail} className="card" style={{ padding: 12, display: 'grid', gap: 8 }}>
        <strong>E-Mail ändern</strong>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <button className="btn" type="submit">E-Mail speichern</button>
      </form>
      <form onSubmit={changePassword} className="card" style={{ padding: 12, display: 'grid', gap: 8 }}>
        <strong>Passwort ändern</strong>
        <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" placeholder="Aktuelles Passwort" required />
        <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="Neues Passwort (min 6)" required />
        <button className="btn" type="submit">Passwort speichern</button>
      </form>
    </div>
  );
}



