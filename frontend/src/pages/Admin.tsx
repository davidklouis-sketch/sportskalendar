import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type User = { id: string; email: string; displayName: string; role?: 'user' | 'admin' };

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der Benutzer');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function removeUser(id: string) {
    if (!confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?')) {
      return;
    }
    
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert('Fehler beim Löschen des Benutzers');
      console.error('Error deleting user:', err);
    }
  }

  async function promoteUser(id: string, email: string) {
    if (!confirm(`Sind Sie sicher, dass Sie ${email} zu einem Administrator befördern möchten?`)) {
      return;
    }
    
    try {
      const res = await api.post('/admin/promote-user', { userId: id });
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: 'admin' } : u));
      alert(res.data.message);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fehler beim Befördern des Benutzers');
      console.error('Error promoting user:', err);
    }
  }

  async function demoteUser(id: string, email: string) {
    if (!confirm(`Sind Sie sicher, dass Sie ${email} zu einem normalen Benutzer degradieren möchten?`)) {
      return;
    }
    
    try {
      const res = await api.post('/admin/demote-user', { userId: id });
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: 'user' } : u));
      alert(res.data.message);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fehler beim Degradieren des Benutzers');
      console.error('Error demoting user:', err);
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '16px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Lade Admin-Daten...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '16px 0' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #dc2626, #b91c1c)', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '12px', 
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>🛡️ Admin Portal</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>Benutzerverwaltung und Systemsteuerung</p>
      </div>

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

      <div style={{ 
        background: '#f8fafc', 
        padding: '16px', 
        borderRadius: '12px', 
        marginBottom: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#374151' }}>📊 Statistiken</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ 
            background: 'white', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
              {users.length}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Gesamt Benutzer</div>
          </div>
          <div style={{ 
            background: 'white', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
              {users.filter(u => u.role === 'admin').length}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Administratoren</div>
          </div>
          <div style={{ 
            background: 'white', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
              {users.filter(u => u.role === 'user').length}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Normale Benutzer</div>
          </div>
        </div>
      </div>

      <h2 style={{ color: '#374151', marginBottom: '16px' }}>👥 Benutzerverwaltung</h2>
      
      {users.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#6b7280',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Keine Benutzer gefunden</div>
        </div>
      ) : (
        <div className="cards">
          {users.map((u) => (
            <div key={u.id} className="card" style={{ 
              border: u.role === 'admin' ? '2px solid #dc2626' : '1px solid #e5e7eb',
              background: u.role === 'admin' ? '#fef2f2' : 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>
                  {u.role === 'admin' ? '🛡️' : '👤'}
                </span>
                <div>
                  <strong style={{ color: u.role === 'admin' ? '#dc2626' : '#374151' }}>
                    {u.displayName}
                  </strong>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>{u.email}</div>
                </div>
              </div>
              
              <div style={{ 
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                background: u.role === 'admin' ? '#dc2626' : '#3b82f6',
                color: 'white',
                marginBottom: '12px'
              }}>
                {u.role === 'admin' ? 'Administrator' : 'Benutzer'}
              </div>
              
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {u.role !== 'admin' && (
                  <>
                    <button 
                      className="btn secondary" 
                      onClick={() => promoteUser(u.id, u.email)}
                      style={{ 
                        background: 'linear-gradient(135deg, #059669, #047857)', 
                        color: 'white', 
                        border: '1px solid #059669',
                        fontSize: '12px',
                        padding: '6px 12px'
                      }}
                    >
                      ⬆️ Zu Admin befördern
                    </button>
                    <button 
                      className="btn secondary" 
                      onClick={() => removeUser(u.id)}
                      style={{ 
                        background: '#fee2e2', 
                        color: '#dc2626', 
                        border: '1px solid #fecaca',
                        fontSize: '12px',
                        padding: '6px 12px'
                      }}
                    >
                      🗑️ Löschen
                    </button>
                  </>
                )}
                {u.role === 'admin' && (
                  <>
                    <button 
                      className="btn secondary" 
                      onClick={() => demoteUser(u.id, u.email)}
                      style={{ 
                        background: 'linear-gradient(135deg, #dc2626, #b91c1c)', 
                        color: 'white', 
                        border: '1px solid #dc2626',
                        fontSize: '12px',
                        padding: '6px 12px'
                      }}
                    >
                      ⬇️ Zu User degradieren
                    </button>
                    <div style={{ 
                      color: '#dc2626', 
                      fontSize: '12px', 
                      fontStyle: 'italic',
                      padding: '8px',
                      background: '#fef2f2',
                      borderRadius: '6px',
                      border: '1px solid #fecaca',
                      flex: '1',
                      minWidth: '200px'
                    }}>
                      Admin-Benutzer können nicht gelöscht werden
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



