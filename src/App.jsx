import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MapDisplay from './components/MapDisplay';
import RouteResults from './components/RouteResults';
import StatsBar from './components/StatsBar';
import { geocodeAll, geocodeAddress } from './utils/geocoding';
import { nearestNeighbor, twoOpt, routeDist, fetchORSRoute } from './utils/routing';
import { parseCSV } from './utils/csv';
import { calculateTimes, exportRouteToCsv } from './utils/time';
import { Moon, Sun } from 'lucide-react';
import './App.css';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const [csvData, setCsvData] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [startAddr, setStartAddr] = useState('');
  const [endAddr, setEndAddr] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [defaultStayMin, setDefaultStayMin] = useState(30);
  
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

      // 3. Optimize (Nearest Neighbor + 2-opt)
      const initRoute = nearestNeighbor(points, start);
      const optimized = twoOpt(initRoute, start, end);
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
      finalData.optimized = calculateTimes(finalData.optimized, finalData.legs, startTime, defaultStayMin, finalData.start, finalData.isORS);

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

  return (
    <div className="app-container">
      <Sidebar 
        csvData={csvData} setCsvData={setCsvData}
        apiKey={apiKey} setApiKey={setApiKey}
        startAddr={startAddr} setStartAddr={setStartAddr}
        endAddr={endAddr} setEndAddr={setEndAddr}
        startTime={startTime} setStartTime={setStartTime}
        defaultStayMin={defaultStayMin} setDefaultStayMin={setDefaultStayMin}
        onOptimize={handleOptimize}
        isOptimizing={isOptimizing}
        routeData={routeData}
        exportToCsv={() => exportRouteToCsv(routeData)}
      />
      
      <main className="main-content">
        <header className="topbar">
          <div className="brand">
            <h1>Händler-Routenoptimierung</h1>
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

export default App;
