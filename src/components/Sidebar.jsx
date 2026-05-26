import { Upload, MapPin, Key, Clock, Settings, Play } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({
  csvData, setCsvData,
  apiKey, setApiKey,
  startAddr, setStartAddr,
  endAddr, setEndAddr,
  startTime, setStartTime,
  defaultStayMin, setDefaultStayMin,
  onOptimize, isOptimizing, routeData, exportToCsv
}) {
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setCsvData(evt.target.result);
    reader.readAsText(file);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">
          <MapPin size={24} color="white" />
        </div>
        <div>
          <h2>Planungsapp</h2>
          <p>Außendienst Optimierung</p>
        </div>
      </div>

      <div className="sidebar-scrollable">
        <section className="glass-panel p-4 mb-4">
          <h3 className="section-title"><Key size={16} /> OpenRouteService API</h3>
          <p className="text-xs text-muted mb-2">Für echte Fahrstrecken & Zeiten</p>
          <input 
            type="password" 
            placeholder="API Schlüssel (optional)" 
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
        </section>

        <section className="glass-panel p-4 mb-4">
          <h3 className="section-title"><MapPin size={16} /> Start & Ende</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label>Startpunkt</label>
              <input 
                placeholder="z.B. Berlin, Alexanderplatz" 
                value={startAddr}
                onChange={e => setStartAddr(e.target.value)}
              />
            </div>
            <div>
              <label>Endpunkt</label>
              <input 
                placeholder="z.B. München, Marienplatz" 
                value={endAddr}
                onChange={e => setEndAddr(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="glass-panel p-4 mb-4">
          <h3 className="section-title"><Clock size={16} /> Zeitplanung</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label>Tour-Startzeit</label>
              <input 
                type="time" 
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label>Standard-Aufenthalt (Min.)</label>
              <input 
                type="number"
                min="0"
                step="5"
                value={defaultStayMin}
                onChange={e => setDefaultStayMin(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="glass-panel p-4 mb-4">
          <h3 className="section-title"><Upload size={16} /> Händlerdaten (CSV)</h3>
          <p className="text-xs text-muted mb-2">Format: Debitor; Name; Adresse; [Zeit]; [Dauer]</p>
          <textarea 
            rows="5"
            placeholder="1001; Test GmbH; Musterstraße 1, 12345 Berlin"
            value={csvData}
            onChange={e => setCsvData(e.target.value)}
          />
          <input 
            type="file" 
            id="csvFile" 
            accept=".csv,.txt" 
            style={{ display: 'none' }} 
            onChange={handleFileUpload} 
          />
          <button 
            className="btn-secondary w-full mt-2 mb-3"
            onClick={() => document.getElementById('csvFile').click()}
          >
            <Upload size={16} /> Datei hochladen
          </button>
          <button 
            className="btn-primary w-full mt-2"
            onClick={onOptimize}
            disabled={isOptimizing}
          >
            {isOptimizing ? 'Berechne...' : <><Play size={18} /> Route optimieren</>}
          </button>
          
          <button 
            className="btn-secondary w-full mt-2"
            onClick={exportToCsv}
            disabled={!routeData || !routeData.optimized || routeData.optimized.length === 0}
          >
            Route als CSV exportieren
          </button>
        </section>
      </div>
    </aside>
  );
}
