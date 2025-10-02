import { useState, useEffect } from 'react';
import { useAuth } from '../store/auth';
import { api } from '../lib/api';

type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  createdAt?: string;
};

export default function ProfilePage() {
  const { user, hydrate, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(user?.email ?? '');
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const response = await api.get('/user/me');
      const userData = response.data.user;
      setProfile(userData);
      setEmail(userData.email);
      setDisplayName(userData.displayName);
      setError('');
    } catch (err) {
      setError('Fehler beim Laden des Profils');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/user/change-email', { email });
      await hydrate();
      setMsg('E-Mail erfolgreich aktualisiert');
      setError('');
    } catch (err) {
      setError('Fehler beim Aktualisieren der E-Mail');
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/user/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setMsg('Passwort erfolgreich aktualisiert');
      setError('');
    } catch (err) {
      setError('Fehler beim Aktualisieren des Passworts');
    }
  }

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '16px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Lade Profil...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '16px 0' }}>
      {/* Profile Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
        color: 'white', 
        padding: '24px', 
        borderRadius: '12px', 
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>
          {profile?.role === 'admin' ? '🛡️' : '👤'}
        </div>
        <h1 style={{ margin: 0, fontSize: '28px' }}>Mein Profil</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
          Willkommen zurück, {profile?.displayName || user?.displayName}!
        </p>
      </div>

      {/* Profile Info */}
      <div style={{ 
        background: '#f8fafc', 
        padding: '20px', 
        borderRadius: '12px', 
        marginBottom: '24px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>📋 Profil-Informationen</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px',
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <span style={{ fontWeight: '500', color: '#374151' }}>E-Mail:</span>
            <span style={{ color: '#6b7280' }}>{profile?.email || user?.email}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px',
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <span style={{ fontWeight: '500', color: '#374151' }}>Anzeigename:</span>
            <span style={{ color: '#6b7280' }}>{profile?.displayName || user?.displayName}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px',
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <span style={{ fontWeight: '500', color: '#374151' }}>Rolle:</span>
            <span style={{ 
              color: profile?.role === 'admin' ? '#dc2626' : '#059669',
              fontWeight: '600',
              background: profile?.role === 'admin' ? '#fef2f2' : '#f0fdf4',
              padding: '4px 8px',
              borderRadius: '6px',
              border: `1px solid ${profile?.role === 'admin' ? '#fecaca' : '#bbf7d0'}`
            }}>
              {profile?.role === 'admin' ? '🛡️ Administrator' : '👤 Benutzer'}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px',
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <span style={{ fontWeight: '500', color: '#374151' }}>Benutzer-ID:</span>
            <span style={{ 
              color: '#6b7280', 
              fontFamily: 'monospace',
              fontSize: '12px',
              background: '#f3f4f6',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>{profile?.id || user?.id}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      {msg && (
        <div style={{ 
          background: '#d1fae5', 
          color: '#059669', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: '1px solid #a7f3d0'
        }}>
          ✅ {msg}
        </div>
      )}
      
      {error && (
        <div style={{ 
          background: '#fee2e2', 
          color: '#dc2626', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: '1px solid #fecaca'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Settings Forms */}
      <div style={{ display: 'grid', gap: '20px' }}>
        <form onSubmit={changeEmail} className="card" style={{ padding: '20px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>✉️ E-Mail ändern</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              type="email" 
              placeholder="Neue E-Mail-Adresse"
              required 
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <button className="btn" type="submit" style={{ justifySelf: 'start' }}>
              E-Mail aktualisieren
            </button>
          </div>
        </form>

        <form onSubmit={changePassword} className="card" style={{ padding: '20px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>🔒 Passwort ändern</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <input 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              type="password" 
              placeholder="Aktuelles Passwort" 
              required 
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <input 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              type="password" 
              placeholder="Neues Passwort (mindestens 8 Zeichen)" 
              required 
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <button className="btn" type="submit" style={{ justifySelf: 'start' }}>
              Passwort aktualisieren
            </button>
          </div>
        </form>
      </div>

      {/* Logout Section */}
      <div style={{ 
        marginTop: '32px', 
        padding: '20px', 
        background: '#fef2f2', 
        borderRadius: '12px', 
        border: '1px solid #fecaca',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#dc2626' }}>🚪 Abmelden</h3>
        <p style={{ margin: '0 0 16px 0', color: '#991b1b', fontSize: '14px' }}>
          Sie können sich hier von Ihrem Konto abmelden.
        </p>
        <button 
          onClick={handleLogout}
          style={{
            background: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#b91c1c';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#dc2626';
          }}
        >
          Abmelden
        </button>
      </div>
    </div>
  );
}



