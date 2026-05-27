import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Trash2, ExternalLink, Users, Route as RouteIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Admin({ userRole }) {
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('routes'); // 'routes' or 'users'
  
  useEffect(() => {
    if (!supabase) return;
    
    async function fetchAllRoutes() {
      // In a real app, you'd check if the current user has admin rights via RLS or a profiles table.
      // For now, we just fetch all routes (assuming RLS allows it for admins).
      const { data, error } = await supabase
        .from('routes')
        .select(`
          id, 
          user_id,
          name, 
          route_data,
          created_at
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching routes:', error);
      } else {
        setRoutes(data || []);
      }
      
      if (userRole === 'superadmin') {
        const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (usersData) setUsers(usersData);
      }
      
      setLoading(false);
    }
    
    fetchAllRoutes();
  }, [userRole]);

  const handleDelete = async (id) => {
    if (!window.confirm('Diese Route wirklich unwiderruflich löschen?')) return;
    
    try {
      const { error } = await supabase.from('routes').delete().eq('id', id);
      if (error) throw error;
      setRoutes(routes.filter(r => r.id !== id));
    } catch (err) {
      alert('Fehler beim Löschen: ' + err.message);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Fehler beim Ändern der Rolle: ' + err.message);
    }
  };

  if (!supabase) return <div className="p-8">Supabase nicht verbunden.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <Link to="/" className="btn-secondary">Zurück zur App</Link>
      </div>

      {userRole === 'superadmin' && (
        <div className="flex gap-4 mb-6">
          <button 
            className={`btn-secondary flex items-center gap-2 ${activeTab === 'routes' ? 'bg-accent/20 border-accent' : ''}`}
            onClick={() => setActiveTab('routes')}
          >
            <RouteIcon size={16} /> Routen-Verwaltung
          </button>
          <button 
            className={`btn-secondary flex items-center gap-2 ${activeTab === 'users' ? 'bg-accent/20 border-accent' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} /> Nutzer-Verwaltung
          </button>
        </div>
      )}
      
      <div className="glass-panel p-6">
        {activeTab === 'routes' ? (
          <>
            <h3 className="text-xl mb-4">Alle gespeicherten Routen im System</h3>
            {loading ? (
              <p>Lade Daten...</p>
            ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700 text-sm text-muted">
                <th className="py-2 font-normal">Nutzer</th>
                <th className="py-2 font-normal">Routen-Name</th>
                <th className="py-2 font-normal">Erstellt am</th>
                <th className="py-2 font-normal text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {routes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-muted">Keine Routen gefunden</td>
                </tr>
              ) : (
                routes.map(r => (
                  <tr key={r.id} className="border-b border-gray-800">
                    <td className="py-3 text-sm">{r.user_id?.substring(0, 8)}...</td>
                    <td className="py-3 font-medium text-accent">{r.name}</td>
                    <td className="py-3 text-sm text-muted">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <Link 
                        to="/"
                        state={{ loadedRoute: r.route_data }}
                        className="p-2 text-accent hover:bg-accent/20 rounded transition-colors mr-2 inline-block"
                        title="Route auf Karte ansehen"
                      >
                        <ExternalLink size={16} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(r.id)}
                        className="p-2 text-error hover:bg-red-900/20 rounded transition-colors"
                        title="Route löschen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
            )}
          </>
        ) : (
          <>
            <h3 className="text-xl mb-4">Nutzer-Verwaltung (Superadmin)</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700 text-sm text-muted">
                  <th className="py-2 font-normal">E-Mail</th>
                  <th className="py-2 font-normal">Registriert am</th>
                  <th className="py-2 font-normal">Rolle</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-800">
                    <td className="py-3 text-sm">{u.email}</td>
                    <td className="py-3 text-sm text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <select 
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.email === 'christophe.schneider86@googlemail.com'}
                        className="p-1 rounded bg-gray-800 border border-gray-600 text-sm"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
