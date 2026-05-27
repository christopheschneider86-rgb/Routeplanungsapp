import { useState } from 'react';
import { supabase } from '../utils/supabase';
import { Key, AlertCircle, X } from 'lucide-react';

export default function Auth({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState('login'); // login, register, reset
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  if (!supabase) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="glass-panel p-8 w-full max-w-md relative text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-white"><X size={20}/></button>
          <Key size={48} className="mx-auto mb-4 text-error" />
          <h2 className="text-2xl font-bold mb-2">Setup fehlt</h2>
          <p className="text-muted">Die Supabase Keys wurden nicht in der .env.local konfiguriert.</p>
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
          redirectTo: window.location.origin,
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
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-md bg-[var(--bg-secondary)] border-l border-[var(--border-color)] shadow-2xl p-8 overflow-y-auto animate-slide-in-right flex flex-col">
        
        {/* Decorative gradient blob */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--accent-primary)] opacity-20 rounded-full blur-3xl pointer-events-none"></div>

        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-light)] rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

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
            <label className="block mb-1 text-sm font-medium">E-Mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ihre@email.de"
            />
          </div>
          
          {view !== 'reset' && (
            <div>
              <label className="block mb-1 text-sm font-medium">Passwort</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          )}

          {view === 'register' && (
            <div className="flex items-start gap-3 mt-2 p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
              <input 
                type="checkbox" 
                id="terms" 
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 shrink-0 w-4 h-4 cursor-pointer"
                style={{ width: 'auto' }}
              />
              <label htmlFor="terms" className="text-xs text-[var(--text-secondary)] leading-relaxed cursor-pointer">
                Ich akzeptiere die Nutzungsbedingungen. Mir ist bewusst, dass meine Routendaten in der Cloud verarbeitet und gespeichert werden.
              </label>
            </div>
          )}

          <button type="submit" className="btn-primary w-full py-2.5 mt-2 font-medium" disabled={loading}>
            {loading ? 'Lädt...' : getTitle()}
          </button>
        </form>
        
        <div className="mt-8 flex flex-col gap-3 text-center text-sm">
          {view === 'login' ? (
            <>
              <button 
                type="button"
                className="text-[var(--accent-primary)] hover:underline font-medium" 
                onClick={() => setView('register')}
              >
                Noch keinen Account? Registrieren
              </button>
              <button 
                type="button"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline" 
                onClick={() => setView('reset')}
              >
                Passwort vergessen?
              </button>
            </>
          ) : (
            <button 
              type="button"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline" 
              onClick={() => setView('login')}
            >
              Zurück zum Login
            </button>
          )}
        </div>
      </div>
    </>
  );
}
