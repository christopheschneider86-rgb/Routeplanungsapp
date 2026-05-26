import { Map, Clock, Navigation, TrendingDown } from 'lucide-react';
import { fmtDur } from '../utils/format';
import './StatsBar.css';

export default function StatsBar({ routeData }) {
  const { optimized, totalDist, totalDur, initDist, start, end } = routeData;
  const stops = optimized.length;
  const saving = initDist > 0 ? ((initDist - totalDist) / initDist * 100) : 0;

  return (
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
          <div className="stat-value">{totalDur > 0 ? fmtDur(totalDur) : '—'}</div>
          <div className="stat-sub">Reine Fahrzeit</div>
        </div>
      </div>

      <div className="glass-panel stat-card">
        <div className="stat-icon" style={{color: 'var(--success)', background: 'rgba(64, 192, 87, 0.15)'}}>
          <TrendingDown size={20} />
        </div>
        <div className="stat-info">
          <div className="stat-label">Einsparung</div>
          <div className="stat-value">{saving > 0 ? `${saving.toFixed(1)} %` : '0 %'}</div>
          <div className="stat-sub">durch Optimierung</div>
        </div>
      </div>
    </div>
  );
}
