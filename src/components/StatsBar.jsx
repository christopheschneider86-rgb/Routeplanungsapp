import { Map, Clock, Navigation, TrendingDown, ChevronDown } from 'lucide-react';
import { fmtDur } from '../utils/format';
import './StatsBar.css';

export default function StatsBar({ routeData }) {
  const { optimized, totalDist, totalDur, inputDistHaversine, optimalDistHaversine, currentDistHaversine, start, end } = routeData;
  const stops = optimized.length;
  
  let savingsLabel = "durch Optimierung";
  let saving = 0;
  let savingColor = 'var(--success)';
  let savingBg = 'rgba(64, 192, 87, 0.15)';
  
  if (inputDistHaversine > 0 && optimalDistHaversine > 0 && currentDistHaversine > 0) {
    if (currentDistHaversine > optimalDistHaversine + 0.01) {
       // manually edited and worse
       saving = ((currentDistHaversine - optimalDistHaversine) / optimalDistHaversine * 100);
       savingsLabel = "Abweichung v. Optimum";
       savingColor = 'var(--error)';
       savingBg = 'rgba(250, 82, 82, 0.15)';
    } else {
       saving = ((inputDistHaversine - currentDistHaversine) / inputDistHaversine * 100);
       savingsLabel = "zur Eingabe-Reihenfolge";
    }
  }

  return (
    <details className="stats-details" open>
      <summary className="stats-summary" title="Statistiken ein-/ausblenden">
        Übersicht
        <ChevronDown size={16} className="chevron-icon" />
      </summary>
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon"><Map size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Stopps</div>
            <div className="stat-value">{stops}</div>
            <div className="stat-sub">Geplant + {start ? 1 : 0} Start, {end ? 1 : 0} Ende</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{color: 'var(--accent-primary)', background: 'var(--accent-light)'}}>
            <Navigation size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Gesamtstrecke</div>
            <div className="stat-value">{totalDist > 0 ? `${totalDist.toFixed(1)} km` : '—'}</div>
            <div className="stat-sub">Fahrstrecke</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{color: 'var(--warning)', background: 'rgba(250, 176, 5, 0.15)'}}>
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Fahrzeit</div>
            <div className="stat-value">{routeData.legs?.length > 0 ? fmtDur(routeData.legs.reduce((acc, leg) => acc + leg.dur/60, 0)) : '—'}</div>
            <div className="stat-sub">Reine Fahrzeit</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{color: savingColor, background: savingBg}}>
            <TrendingDown size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Einsparung</div>
            <div className="stat-value" style={{color: savingColor}}>{saving > 0 ? (currentDistHaversine > optimalDistHaversine + 0.01 ? `+${saving.toFixed(1)} %` : `${saving.toFixed(1)} %`) : '0 %'}</div>
            <div className="stat-sub">{savingsLabel}</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{color: '#a855f7', background: 'rgba(168, 85, 247, 0.15)'}}>
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Gesamtdauer</div>
            <div className="stat-value">{totalDur > 0 ? fmtDur(totalDur) : '—'}</div>
            <div className="stat-sub">inkl. Aufenthalte</div>
          </div>
        </div>
      </div>
    </details>
  );
}
