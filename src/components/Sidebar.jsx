import { Upload, MapPin, Key, Clock, Settings, Play, ChevronDown } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({
  csvData, setCsvData,
  apiKey, setApiKey,
  startAddr, setStartAddr,
  endAddr, setEndAddr,
  startTime, setStartTime,
  endTime, setEndTime,
  defaultStayMin, setDefaultStayMin,
  latePenalty, setLatePenalty,
  waitPenalty, setWaitPenalty,
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
          <p>By ZaboChris</p>
        </div>
      </div>

      <div className="sidebar-scrollable">
        <details className="glass-panel mb-4 sidebar-section" name="sidebar-accordion">
          <summary className="section-title p-4 m-0">
            <div className="flex items-center gap-2"><Key size={16} /> OpenRouteService API</div>
            <ChevronDown size={16} className="chevron-icon" />
          </summary>
          <div className="px-4 pb-4">
            <p className="text-xs text-muted mb-2">Für echte Fahrstrecken & Zeiten</p>
            <input 
              type="password" 
              placeholder="API Schlüssel (optional)" 
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <a href="https://openrouteservice.org/dev/#/signup" target="_blank" rel="noreferrer" className="text-xs text-accent mt-2 inline-block">API-Key hier kostenlos erhalten</a>
          </div>
        </details>

        <details className="glass-panel mb-4 sidebar-section" name="sidebar-accordion">
          <summary className="section-title p-4 m-0">
            <div className="flex items-center gap-2"><MapPin size={16} /> Start & Ende</div>
            <ChevronDown size={16} className="chevron-icon" />
          </summary>
          <div className="px-4 pb-4 flex flex-col gap-3">
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
              <div className="flex gap-2">
                <input 
                  placeholder="z.B. München, Marienplatz" 
                  value={endAddr}
                  onChange={e => setEndAddr(e.target.value)}
                />
                <button 
                  className="btn-secondary" 
                  style={{ padding: '0 0.5rem' }}
                  onClick={() => setEndAddr(startAddr)}
                  title="Als Rundreise setzen (Endpunkt = Startpunkt)"
                  disabled={!startAddr}
                >
                  <Clock size={16} style={{transform: 'rotate(180deg)'}}/>
                </button>
              </div>
            </div>
          </div>
        </details>

        <details className="glass-panel mb-4 sidebar-section" name="sidebar-accordion">
          <summary className="section-title p-4 m-0">
            <div className="flex items-center gap-2"><Clock size={16} /> Zeitplanung</div>
            <ChevronDown size={16} className="chevron-icon" />
          </summary>
          <div className="px-4 pb-4 flex flex-col gap-3">
            <div>
              <label>Tour-Startzeit</label>
              <input 
                type="time" 
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label>Feierabend (Tour-Ende)</label>
              <input 
                type="time" 
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
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
        </details>

        <details className="glass-panel mb-4 sidebar-section" name="sidebar-accordion">
          <summary className="section-title p-4 m-0">
            <div className="flex items-center gap-2"><Settings size={16} /> Algorithmus-Strafen</div>
            <ChevronDown size={16} className="chevron-icon" />
          </summary>
          <div className="px-4 pb-4">
            <p className="text-xs text-muted mb-3">Wie stark sollen Zeitabweichungen bestraft werden? (1 Punkt = 1 km Umweg)</p>
            <div className="flex flex-col gap-3">
              <div>
                <label>Strafe pro Min. Verspätung</label>
                <input 
                  type="number"
                  min="0"
                  value={latePenalty}
                  onChange={e => setLatePenalty(e.target.value)}
                />
              </div>
              <div>
                <label>Strafe pro Min. Wartezeit</label>
                <input 
                  type="number"
                  min="0"
                  value={waitPenalty}
                  onChange={e => setWaitPenalty(e.target.value)}
                />
              </div>
            </div>
          </div>
        </details>

        <details className="glass-panel mb-4 sidebar-section" name="sidebar-accordion">
          <summary className="section-title p-4 m-0">
            <div className="flex items-center gap-2"><Upload size={16} /> Händlerdaten (CSV)</div>
            <ChevronDown size={16} className="chevron-icon" />
          </summary>
          <div className="px-4 pb-4">
            <p className="text-xs text-muted mb-2">Format: Debitor; Name; Adresse; [Zeit HH:MM]; [Dauer Min]</p>
            <textarea 
              rows="6"
              placeholder="1001; Test GmbH; Musterstraße 1, 12345 Berlin; 10:30; 45&#10;1002; Demo AG; Hauptmarkt 1, Nürnberg; ; 60"
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
              className="btn-primary w-full mt-2 shadow-lg"
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
          </div>
        </details>
      </div>
    </aside>
  );
}
