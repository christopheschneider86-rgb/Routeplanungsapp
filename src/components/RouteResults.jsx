import { MapPin, Navigation, Clock, User } from 'lucide-react';
import { fmtDur } from '../utils/format';
import { haversine } from '../utils/routing';
import './RouteResults.css';

export default function RouteResults({ routeData }) {
  const { optimized, start, end, legs, isORS } = routeData;

  if (!optimized.length) {
    return (
      <div className="glass-panel results-container empty-state animate-slide-in">
        <MapPin size={48} color="var(--text-muted)" opacity={0.5} />
        <p>Noch keine Route berechnet.<br/>Daten eingeben und Route berechnen.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel results-container animate-slide-in">
      <div className="panel-header">
        <h3>Besuchsreihenfolge</h3>
        <span className="badge">{optimized.length} Stopps</span>
      </div>
      
      <div className="route-list">
        {start && (
          <div className="stop-card start-card">
            <div className="stop-indicator">S</div>
            <div className="stop-content">
              <div className="stop-meta-top">Startpunkt</div>
              <h4>{start.address}</h4>
            </div>
          </div>
        )}

        {optimized.map((stop, i) => {
          const legOffset = start ? i : i - 1;
          const leg = legs && legs[legOffset] ? legs[legOffset] : null;
          
          let distStr = '—';
          if (leg) {
            distStr = `${leg.dist.toFixed(1)} km`;
          } else if (i === 0 && start) {
            distStr = `${haversine(start, stop).toFixed(1)} km`;
          } else if (i > 0) {
            distStr = `${haversine(optimized[i-1], stop).toFixed(1)} km`;
          }

          const durStr = leg ? fmtDur(leg.dur) : '';

          return (
            <div key={stop.id || i} className="stop-card">
              <div className="stop-indicator">{i + 1}</div>
              <div className="stop-content">
                {stop.debitor && <div className="stop-meta-top"><User size={12}/> Deb. {stop.debitor}</div>}
                <h4>{stop.name}</h4>
                <div className="stop-address">{stop.address}</div>
                
                <div className="stop-badges">
                  {distStr !== '—' && (
                    <span className="info-badge dist">
                      <Navigation size={12}/> {distStr} {!isORS && '*'}
                    </span>
                  )}
                  {durStr && (
                    <span className="info-badge time">
                      <Clock size={12}/> {durStr}
                    </span>
                  )}
                  {stop._arrTime && (
                    <span className="info-badge" style={{color: 'var(--text-muted)'}}>
                      <Clock size={12}/> An: {stop._arrTime}
                    </span>
                  )}
                  {stop.visitTime && (
                    <span className="info-badge" style={{color: 'var(--accent-primary)', background: 'var(--accent-light)'}}>
                      📅 Termin: {stop.visitTime}
                    </span>
                  )}
                  {stop._lateMin > 0 && (
                    <span className="info-badge" style={{color: 'var(--error)', background: 'rgba(250, 82, 82, 0.1)'}}>
                      ⚠ {stop._lateMin} Min. Verspätung
                    </span>
                  )}
                  {stop._waitMin > 0 && (
                    <span className="info-badge" style={{color: 'var(--warning)', background: 'rgba(250, 176, 5, 0.1)'}}>
                      ⏳ {stop._waitMin} Min. Wartezeit
                    </span>
                  )}
                  {stop._depTime && (
                    <span className="info-badge" style={{color: 'var(--text-muted)'}}>
                      Ab: {stop._depTime}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {end && (
          <div className="stop-card end-card">
            <div className="stop-indicator">E</div>
            <div className="stop-content">
              <div className="stop-meta-top">Endpunkt</div>
              <h4>{end.address}</h4>
              <div className="stop-badges mt-2">
                {legs && legs.length > 0 && (
                  <span className="info-badge dist">
                    <Navigation size={12}/> {legs[legs.length-1].dist.toFixed(1)} km
                  </span>
                )}
                {end._arrTime && (
                  <span className="info-badge" style={{color: 'var(--text-muted)'}}>
                    <Clock size={12}/> An: {end._arrTime}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {!isORS && (
          <div className="text-xs text-muted mt-4 text-center px-4">
            * Luftlinien-Distanz. Für echte Fahrstrecken ORS API-Key eingeben.
          </div>
        )}
      </div>
    </div>
  );
}
