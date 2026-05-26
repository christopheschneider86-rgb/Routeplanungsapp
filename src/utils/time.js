import { timeToMin, minToTime } from './format';

export function calculateTimes(route, legs, startTimeStr, defaultStayMin, startPoint, isORS) {
  let currentTime = timeToMin(startTimeStr) || 480; // Default 08:00
  
  return route.map((stop, i) => {
    // Determine leg index depending on whether we have a start point
    const legOffset = startPoint ? i : i - 1;
    const leg = legs && legs[legOffset] ? legs[legOffset] : null;
    
    // Add travel time
    if (leg) {
      currentTime += Math.round(leg.dur / 60);
    } else if (!isORS && (i > 0 || startPoint)) {
      // Basic fallback if ORS failed but we still want times: assume 50 km/h average for haversine
      // However, we don't have haversine output easily here, let's just use 0 if no legs exist, or we can just not calculate times
    }
    
    // Arrival Time
    const arrTime = currentTime;
    stop._arrTime = minToTime(arrTime);
    
    // Check constraints
    stop._waitMin = 0;
    stop._lateMin = 0;
    
    if (stop.visitTime) {
      const vTime = timeToMin(stop.visitTime);
      if (vTime !== null) {
        if (arrTime < vTime) {
          stop._waitMin = vTime - arrTime;
          currentTime = vTime; // Wait until appointment
        } else if (arrTime > vTime) {
          stop._lateMin = arrTime - vTime;
        }
      }
    }
    
    // Stay duration
    const stay = stop.stayMin != null ? stop.stayMin : parseInt(defaultStayMin, 10) || 30;
    currentTime += stay;
    
    // Departure Time
    stop._depTime = minToTime(currentTime);
    
    return stop;
  });
}

export function exportRouteToCsv(routeData) {
  const { optimized } = routeData;
  if (!optimized || !optimized.length) return;
  
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Debitor;Name;Adresse;Ankunft;Verspaetung_Min;Abfahrt;Lat;Lon\n';
  
  optimized.forEach(stop => {
    const row = [
      stop.debitor || '',
      stop.name || '',
      stop.address || '',
      stop._arrTime || '',
      stop._lateMin || '0',
      stop._depTime || '',
      stop.lat || '',
      stop.lon || ''
    ];
    csvContent += row.join(';') + '\n';
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'optimierte_route.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
