import { useState } from 'react';
import { supabase } from '../utils/supabase';
import { Key, AlertCircle } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState('login'); // login, register, reset
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  if (!supabase) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="glass-panel p-8 max-w-md text-center">
          <Key size={48} className="mx-auto mb-4 text-warning" />
          <h2 className="mb-2">Supabase nicht verbunden</h2>
          <p className="text-muted">
            Um die Cloud-Funktionen (Login, Speichern) zu nutzen, erstellen Sie eine Datei 
            <code>.env.local</code> und tragen Sie Ihre Supabase-Keys ein.
          </p>
        </div>
      </div>
    );
  }

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (view === 'register') {
        if (!acceptedTerms) throw new Error("Bitte akzeptieren Sie die Nutzungsbedingungen.");
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg('Registrierung erfolgreich! Bitte prüfen Sie Ihre E-Mails, um den Account zu bestätigen.');
      } else if (view === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/login',
        });
        if (error) throw error;
        setSuccessMsg('Passwort-Reset-Link wurde an Ihre E-Mail gesendet.');
      }
    } catch (error) {
      if (error.message.includes('Invalid login credentials')) {
        setErrorMsg('E-Mail oder Passwort ist falsch.');
      } else if (error.message.includes('Email not confirmed')) {
        setErrorMsg('Bitte bestätigen Sie erst Ihre E-Mail Adresse.');
      } else {
        setErrorMsg(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (view === 'login') return 'Login';
    if (view === 'register') return 'Registrieren';
    return 'Passwort zurücksetzen';
  };

  return (
    <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg-secondary)' }}>
      <div className="glass-panel p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">{getTitle()}</h2>
        
        {errorMsg && (
          <div className="mb-4 p-3 rounded text-sm flex items-start gap-2" style={{ background: 'rgba(250, 82, 82, 0.1)', color: 'var(--error)', border: '1px solid var(--error)' }}>
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        
        {successMsg && (
          <div className="mb-4 p-3 rounded text-sm text-green-700 bg-green-50 border border-green-200">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 text-sm">E-Mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 rounded border border-gray-300 bg-white text-black"
            />
          </div>
          
          {view !== 'reset' && (
            <div>
              <label className="block mb-1 text-sm">Passwort</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 rounded border border-gray-300 bg-white text-black"
              />
            </div>
          )}

          {view === 'register' && (
            <div className="flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                id="terms" 
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <label htmlFor="terms" className="text-sm">
                Ich akzeptiere die Nutzungsbedingungen (Terms and Conditions).
              </label>
            </div>
          )}

          <button type="submit" className="btn-primary w-full py-2 mt-2" disabled={loading}>
            {loading ? 'Lädt...' : getTitle()}
          </button>
        </form>
        
        <div className="mt-6 flex flex-col gap-2 text-center text-sm">
          {view === 'login' ? (
            <>
              <button className="text-accent hover:underline" onClick={() => setView('register')}>
                Noch keinen Account? Registrieren
              </button>
              <button className="text-accent hover:underline" onClick={() => setView('reset')}>
                Passwort vergessen?
              </button>
            </>
          ) : (
            <button className="text-accent hover:underline" onClick={() => setView('login')}>
              Zurück zum Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
