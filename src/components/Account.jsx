import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Trash2, User as UserIcon, Lock, Mail, ExternalLink, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Account({ session }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!supabase || !session?.user) return;
    
    async function fetchMyRoutes() {
      const { data, error } = await supabase
        .from('routes')
        .select(`id, name, route_data, created_at`)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching routes:', error);
      } else {
        setRoutes(data || []);
      }
      setLoading(false);
    }
    
    fetchMyRoutes();
  }, [session]);

  const handleDelete = async (id) => {
    if (!window.confirm('Diese Route wirklich löschen?')) return;
    try {
      const { error } = await supabase.from('routes').delete().eq('id', id);
      if (error) throw error;
      setRoutes(routes.filter(r => r.id !== id));
    } catch (err) {
      alert('Fehler beim Löschen: ' + err.message);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!password) return;
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPasswordMsg('Passwort erfolgreich geändert.');
      setPassword('');
      setTimeout(() => setPasswordMsg(''), 3000);
    } catch (err) {
      setPasswordMsg('Fehler: ' + err.message);
    }
  };

  const handleRecommend = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Planungsapp by ZaboChris',
        text: 'Schau dir diesen genialen Routenplaner an!',
        url: window.location.origin
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.origin);
      alert('Link in die Zwischenablage kopiert!');
    }
  };

  const handleResetSettings = () => {
    if (!window.confirm('Möchten Sie alle lokalen Einstellungen (Start, Ziel, Arbeitszeiten, Pausen) wirklich auf die Standardwerte zurücksetzen?\n\nIhr API-Key bleibt erhalten.')) return;
    
    localStorage.removeItem('startAddr');
    localStorage.removeItem('endAddr');
    localStorage.removeItem('startTime');
    localStorage.removeItem('endTime');
    localStorage.removeItem('defaultStayMin');
    localStorage.removeItem('latePenalty');
    localStorage.removeItem('waitPenalty');
    
    window.location.reload();
  };

  const handleSaveToCloud = async () => {
    if (!supabase || !session?.user) return;
    try {
      const settings = {
        apiKey: localStorage.getItem('apiKey') || '',
        startAddr: localStorage.getItem('startAddr') || '',
        endAddr: localStorage.getItem('endAddr') || '',
        startTime: localStorage.getItem('startTime') || '08:00',
        endTime: localStorage.getItem('endTime') || '17:00',
        defaultStayMin: parseInt(localStorage.getItem('defaultStayMin')) || 30,
        latePenalty: parseInt(localStorage.getItem('latePenalty')) || 50,
        waitPenalty: parseInt(localStorage.getItem('waitPenalty')) || 1
      };
      const { error } = await supabase.from('profiles').update({ settings }).eq('id', session.user.id);
      if (error) throw error;
      alert('Einstellungen (API-Key, Zeiten etc.) erfolgreich in der Cloud gespeichert!\nSie werden nun bei jedem Login auf einem neuen Gerät automatisch geladen.');
    } catch (err) {
      alert('Fehler beim Speichern in der Cloud: ' + err.message);
    }
  };

  if (!supabase) return <div className="p-8">Supabase nicht verbunden.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto animate-slide-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><UserIcon /> Mein Account</h2>
        <Link to="/" className="btn-secondary">Zurück zur App</Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="glass-panel p-6">
            <h3 className="text-xl mb-4 font-semibold text-accent">Meine gespeicherten Routen</h3>
            {loading ? (
              <p>Lade Routen...</p>
            ) : routes.length === 0 ? (
              <p className="text-muted">Sie haben noch keine Routen gespeichert.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700 text-sm text-muted">
                    <th className="py-2 font-normal">Name</th>
                    <th className="py-2 font-normal">Datum</th>
                    <th className="py-2 font-normal text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map(r => (
                    <tr key={r.id} className="border-b border-gray-800">
                      <td className="py-3 font-medium text-accent">{r.name}</td>
                      <td className="py-3 text-sm text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="py-3 text-right">
                        <Link 
                          to="/"
                          state={{ loadedRoute: r.route_data }}
                          className="p-2 text-accent hover:bg-accent/20 rounded transition-colors mr-2 inline-block"
                          title="In Planer laden"
                        >
                          <ExternalLink size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(r.id)}
                          className="p-2 text-error hover:bg-red-900/20 rounded transition-colors"
                          title="Löschen"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6">
            <h3 className="text-lg mb-4 font-semibold text-accent flex items-center gap-2"><Lock size={18} /> Sicherheit</h3>
            <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
              <input 
                type="password" 
                placeholder="Neues Passwort" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button type="submit" className="btn-secondary w-full">Passwort ändern</button>
              {passwordMsg && <p className="text-xs text-accent mt-1">{passwordMsg}</p>}
            </form>
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-lg mb-4 font-semibold text-accent flex items-center gap-2"><RefreshCw size={18} /> App-Einstellungen</h3>
            <p className="text-sm text-muted mb-4">Sichern Sie Ihre aktuellen Eingaben (API-Key, Adressen, Zeiten) dauerhaft in der Cloud oder setzen Sie die Werte zurück.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleSaveToCloud} className="btn-primary w-full shadow-lg">
                Einstellungen in der Cloud sichern
              </button>
              <button onClick={handleResetSettings} className="btn-secondary w-full text-warning border-warning hover:bg-warning hover:text-black transition-colors">
                Lokale Werte zurücksetzen
              </button>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-lg mb-4 font-semibold text-accent flex items-center gap-2"><Mail size={18} /> Support</h3>
            <a href="mailto:support@zabochris.de?subject=Supportanfrage: Routenplaner" className="btn-secondary w-full mb-3 text-center inline-block">
              Entwickler kontaktieren
            </a>
            <button onClick={handleRecommend} className="btn-secondary w-full flex justify-center items-center gap-2">
              <RefreshCw size={16} /> App weiterempfehlen
            </button>
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-lg mb-4 font-semibold text-accent flex items-center gap-2">Rechtliches</h3>
            <Link to="/terms" className="btn-secondary w-full text-center inline-block">
              Nutzungsbedingungen (AGB)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
