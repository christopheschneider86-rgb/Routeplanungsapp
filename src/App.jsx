import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MapDisplay from './components/MapDisplay';
import RouteResults from './components/RouteResults';
import StatsBar from './components/StatsBar';
import { geocodeAll, geocodeAddress } from './utils/geocoding';
import { nearestNeighbor, twoOpt, routeDist, fetchORSRoute } from './utils/routing';
import { parseCSV } from './utils/csv';
import { calculateTimes, exportRouteToCsv } from './utils/time';
import { Moon, Sun, Save, User as UserIcon, LogOut } from 'lucide-react';
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './utils/supabase';
import Auth from './components/Auth';
import Admin from './components/Admin';
import './App.css';

function MainApp({ userRole }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const [csvData, setCsvData] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [startAddr, setStartAddr] = useState('');
  const [endAddr, setEndAddr] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [defaultStayMin, setDefaultStayMin] = useState(30);
  const [latePenalty, setLatePenalty] = useState(50);
  const [waitPenalty, setWaitPenalty] = useState(1);
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [geoProgress, setGeoProgress] = useState({ done: 0, total: 0 });
  const [cancelGeo, setCancelGeo] = useState(false);
  
  const [routeData, setRouteData] = useState({
    optimized: [],
    start: null,
    end: null,
    legs: [],
    geometry: [],
    totalDist: 0,
    totalDur: 0,
    initDist: 0,
    isORS: false
  });
  const location = useLocation();

  useEffect(() => {
    if (location.state?.loadedRoute) {
      setRouteData(location.state.loadedRoute);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleOptimize = async () => {
    if (!csvData.trim()) {
      alert("Bitte Händlerdaten eingeben.");
      return;
    }

    const rawPoints = parseCSV(csvData);
    if (!rawPoints.length) {
      alert("Keine gültigen Zeilen erkannt.");
      return;
    }

    setIsOptimizing(true);
    setCancelGeo(false);
    
    try {
      // 1. Geocode Merchants
      const { items: points, failed } = await geocodeAll(
        rawPoints, 
        (done, total) => setGeoProgress({ done, total }),
        () => cancelGeo
      );

      if (cancelGeo) throw new Error("Geocodierung abgebrochen.");
      if (!points.length) throw new Error("Keine Adressen geocodiert.");

      // 2. Geocode Start/End
      let start = null;
      if (startAddr.trim()) {
        const r = await geocodeAddress(startAddr);
        if (r) start = { ...r, address: startAddr, isStart: true };
      }

      let end = null;
      if (endAddr.trim()) {
        const r = await geocodeAddress(endAddr);
        if (r) end = { ...r, address: endAddr, isEnd: true };
      }

      // 3. Optimize (Nearest Neighbor + 2-opt) with Time Windows
      const initRoute = nearestNeighbor(points, start, startTime, defaultStayMin, latePenalty, waitPenalty);
      const optimized = twoOpt(initRoute, start, end, startTime, defaultStayMin, latePenalty, waitPenalty);
      const initDist = routeDist(initRoute, start, end);
      
      let finalData = {
        optimized,
        start,
        end,
        initDist,
        legs: [],
        geometry: [],
        totalDist: routeDist(optimized, start, end),
        totalDur: 0,
        isORS: false
      };

      // 4. Try ORS
      if (apiKey.trim()) {
        try {
          const waypoints = [...(start ? [start] : []), ...optimized, ...(end ? [end] : [])];
          if (waypoints.length > 1) {
            const orsResult = await fetchORSRoute(waypoints, apiKey.trim());
            finalData = { ...finalData, ...orsResult, isORS: true };
          }
        } catch (e) {
          console.warn("ORS Fehlschlag, falle auf Luftlinie zurück", e);
        }
      }

      // 5. Calculate Times
      finalData.optimized = calculateTimes(finalData.optimized, finalData.legs, startTime, endTime, defaultStayMin, finalData.start, finalData.isORS);
      
      // Calculate End arrival time
      if (finalData.end && finalData.optimized.length > 0) {
        const lastStop = finalData.optimized[finalData.optimized.length - 1];
        let endTimeMin = 0;
        
        // Parse last departure time
        const m = String(lastStop._depTime || '').match(/^(\d{1,2}):(\d{2})$/);
        if (m) endTimeMin = +m[1] * 60 + +m[2];
        
        // Add travel time to end
        const lastLegOffset = finalData.start ? finalData.optimized.length : finalData.optimized.length - 1;
        const lastLeg = finalData.legs && finalData.legs[lastLegOffset] ? finalData.legs[lastLegOffset] : null;
        
        if (lastLeg) {
          endTimeMin += Math.round(lastLeg.dur / 60);
        } else if (!finalData.isORS) {
          const distToEnd = Math.round(routeDist([lastStop], null, finalData.end));
          endTimeMin += distToEnd;
        }
        
        // Format to HH:MM
        if (endTimeMin > 0) {
          const d = ((endTimeMin % 1440) + 1440) % 1440;
          finalData.end._arrTime = String(Math.floor(d / 60)).padStart(2, '0') + ':' + String(d % 60).padStart(2, '0');
        }
      }

      setRouteData(finalData);
      
      if (failed.length) {
        alert(`${failed.length} Adressen nicht gefunden: ${failed.slice(0, 3).join(', ')}`);
      }
      
    } catch (err) {
      alert(err.message);
    } finally {
      setIsOptimizing(false);
      setGeoProgress({ done: 0, total: 0 });
    }
  };

  const handleSaveRoute = async () => {
    if (!supabase) return alert('Supabase nicht konfiguriert.');
    if (!routeData.optimized.length) return alert('Keine Route zum Speichern.');
    
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return alert('Bitte erst einloggen.');

    const name = prompt('Name für diese Route:');
    if (!name) return;

    try {
      const { error } = await supabase.from('routes').insert([{
        user_id: session.session.user.id,
        name,
        route_data: routeData
      }]);
      if (error) throw error;
      alert('Route erfolgreich gespeichert!');
    } catch (err) {
      alert('Fehler beim Speichern: ' + err.message);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        csvData={csvData} setCsvData={setCsvData}
        apiKey={apiKey} setApiKey={setApiKey}
        startAddr={startAddr} setStartAddr={setStartAddr}
        endAddr={endAddr} setEndAddr={setEndAddr}
        startTime={startTime} setStartTime={setStartTime}
        endTime={endTime} setEndTime={setEndTime}
        defaultStayMin={defaultStayMin} setDefaultStayMin={setDefaultStayMin}
        latePenalty={latePenalty} setLatePenalty={setLatePenalty}
        waitPenalty={waitPenalty} setWaitPenalty={setWaitPenalty}
        onOptimize={handleOptimize}
        isOptimizing={isOptimizing}
        routeData={routeData}
        exportToCsv={() => exportRouteToCsv(routeData)}
      />
      
      <main className="main-content">
        <header className="topbar">
          <div className="brand flex items-center gap-4">
            <h1>Händler-Routenoptimierung</h1>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs p-1" onClick={handleSaveRoute} title="Route speichern">
                <Save size={16} />
              </button>
              {(userRole === 'admin' || userRole === 'superadmin') && (
                <Link to="/admin" className="btn-secondary text-xs p-1" title="Admin Dashboard">
                  <UserIcon size={16} />
                </Link>
              )}
              <button className="btn-secondary text-xs p-1 text-error" onClick={handleLogout} title="Ausloggen">
                <LogOut size={16} />
              </button>
            </div>
            <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          <StatsBar routeData={routeData} />
        </header>

        <div className="content-grid">
          <MapDisplay routeData={routeData} />
          <RouteResults routeData={routeData} />
        </div>
      </main>

      {/* Geocoding Overlay */}
      {isOptimizing && geoProgress.total > 0 && (
        <div className="geocoding-overlay">
          <div className="glass-panel geo-box">
            <h3>Geocodierung läuft...</h3>
            <p>{geoProgress.done} von {geoProgress.total}</p>
            <button className="btn-secondary" onClick={() => setCancelGeo(true)}>Abbrechen</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
          if (data) setUserRole(data.role);
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        if (session?.user) {
          const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
          if (data) setUserRole(data.role);
        } else {
          setUserRole('user');
        }
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Lade...</div>;
  }

  // If supabase is not configured, we allow access to MainApp but warn them in Auth
  const requireAuth = (Component) => {
    if (!supabase) return Component;
    return session ? Component : <Navigate to="/login" />;
  };

  const requireAdmin = (Component) => {
    if (!supabase) return Component;
    if (!session) return <Navigate to="/login" />;
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <h2>Zugriff verweigert</h2>
          <p>Sie benötigen Admin-Rechte für diesen Bereich.</p>
          <Link to="/" className="btn-primary">Zurück zur App</Link>
        </div>
      );
    }
    return Component;
  };

  return (
    <Routes>
      <Route path="/" element={requireAuth(<MainApp userRole={userRole} />)} />
      <Route path="/login" element={session ? <Navigate to="/" /> : <Auth />} />
      <Route path="/admin" element={requireAdmin(<Admin userRole={userRole} />)} />
    </Routes>
  );
}
