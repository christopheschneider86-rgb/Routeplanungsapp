import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapDisplay.css';

// Fix Leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createSvgIcon = (color, label) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42"><path d="M16 0C7.164 0 0 7.163 0 16c0 8.836 14 26 16 26s16-17.164 16-26C32 7.163 24.836 0 16 0z" fill="${color}"/><circle cx="16" cy="16" r="8" fill="white" fill-opacity="0.9"/><text x="16" y="20" text-anchor="middle" font-family="Outfit,sans-serif" font-size="10" font-weight="700" fill="${color}">${label}</text></svg>`;
  return L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))),
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -40]
  });
};

function MapUpdater({ routeData }) {
  const map = useMap();
  
  useEffect(() => {
    const { optimized, start, end } = routeData;
    const allPoints = [...(start ? [start] : []), ...optimized, ...(end ? [end] : [])];
    
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints.map(p => [p.lat, p.lon]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routeData, map]);

  return null;
}

export default function MapDisplay({ routeData }) {
  const { optimized, start, end, geometry, isORS } = routeData;
  const allPoints = [...(start ? [start] : []), ...optimized, ...(end ? [end] : [])];

  const routePositions = geometry.length > 0 
    ? geometry 
    : allPoints.map(p => [p.lat, p.lon]);

  return (
    <div className="glass-panel map-container animate-slide-in">
      <div className="panel-header">
        <h3>Routenkarte</h3>
        <span className="badge">{isORS ? 'Straßennetz' : 'Luftlinie'}</span>
      </div>
      <div className="map-wrapper">
        <MapContainer center={[51.1657, 10.4515]} zoom={6} style={{ height: '100%', width: '100%', zIndex: 1 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapUpdater routeData={routeData} />

          {routePositions.length > 1 && (
            <Polyline 
              positions={routePositions} 
              color="var(--accent-primary)" 
              weight={5} 
              opacity={0.8}
              dashArray={isORS ? undefined : '10, 10'}
            />
          )}

          {start && (
            <Marker position={[start.lat, start.lon]} icon={createSvgIcon('var(--success)', 'S')}>
              <Popup><strong>Startpunkt</strong><br/>{start.address}</Popup>
            </Marker>
          )}

          {optimized.map((stop, i) => (
            <Marker key={stop.id || i} position={[stop.lat, stop.lon]} icon={createSvgIcon('var(--accent-primary)', String(i + 1))}>
              <Popup>
                <strong>{i + 1}. {stop.name}</strong><br/>
                {stop.debitor && <small>Deb. {stop.debitor}<br/></small>}
                {stop.address}
              </Popup>
            </Marker>
          ))}

          {end && (
            <Marker position={[end.lat, end.lon]} icon={createSvgIcon('var(--warning)', 'E')}>
              <Popup><strong>Endpunkt</strong><br/>{end.address}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
