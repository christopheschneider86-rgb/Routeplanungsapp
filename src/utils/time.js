import { timeToMin, minToTime } from './format';
import { routeDist } from './routing';

export function calculateTimes(route, legs, startTimeStr, endTimeStr, defaultStayMin, startPoint, isORS) {
  let currentTime = timeToMin(startTimeStr) || 480; // Default 08:00
  let endTime = timeToMin(endTimeStr) || 1020; // Default 17:00
  let currentDay = 1;
  
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
    
    // Check if End of Day reached
    stop._isEndOfDay = false;
    if (currentTime >= endTime) {
      stop._isEndOfDay = true;
      // Reset for next day
      currentDay++;
      currentTime = timeToMin(startTimeStr) || 480;
    }
    stop._day = currentDay;
    
    // Departure Time
    stop._depTime = minToTime(currentTime);
    
    return stop;
  });
}

export function exportRouteToCsv(routeData) {
  const { optimized, start, end, legs, isORS } = routeData;
  if (!optimized || !optimized.length) return;
  
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Debitor;Name;Adresse;Termin;Ankunft;Abfahrt;Wartezeit_Min;Verspaetung_Min;Distanz_zum_naechsten_km;Fahrzeit_zum_naechsten_Min;Lat;Lon\n';
  
  optimized.forEach((stop, i) => {
    // Finde die Distanz/Dauer zum nächsten Stopp
    const legOffset = start ? i + 1 : i; // Der leg zum nächsten Stop
    let nextDist = '';
    let nextDur = '';
    
    if (legs && legs[legOffset]) {
      nextDist = legs[legOffset].dist.toFixed(2);
      nextDur = Math.round(legs[legOffset].dur / 60);
    } else if (!isORS) {
      if (i < optimized.length - 1) {
         nextDist = routeDist([stop], null, optimized[i+1]).toFixed(2);
         nextDur = Math.round(routeDist([stop], null, optimized[i+1]));
      } else if (end) {
         nextDist = routeDist([stop], null, end).toFixed(2);
         nextDur = Math.round(routeDist([stop], null, end));
      }
    }
    
    const row = [
      stop.debitor || '',
      stop.name || '',
      stop.address || '',
      stop.visitTime || '',
      stop._arrTime || '',
      stop._depTime || '',
      stop._waitMin || '0',
      stop._lateMin || '0',
      nextDist,
      nextDur,
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
