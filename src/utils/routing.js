import { timeToMin } from './format';

export function haversine(a, b) {
  const R = 6371;
  const r = d => d * Math.PI / 180;
  const dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function routeDist(route, start, end) {
  if (!route.length) return 0;
  const all = [...(start ? [start] : []), ...route, ...(end ? [end] : [])];
  let total = 0;
  for (let i = 1; i < all.length; i++) total += haversine(all[i - 1], all[i]);
  return total;
}

export function routeCost(route, start, end, startTimeStr, defaultStayMin, latePenalty, waitPenalty) {
  if (!route.length) return 0;
  const all = [...(start ? [start] : []), ...route, ...(end ? [end] : [])];
  
  let cost = 0;
  let currentTime = timeToMin(startTimeStr) || 480;
  const defStay = parseInt(defaultStayMin, 10) || 30;

  for (let i = 1; i < all.length; i++) {
    const prev = all[i - 1];
    const curr = all[i];
    
    const dist = haversine(prev, curr);
    cost += dist; // Distance cost
    
    // Time estimation: assume 60 km/h -> 1 min per km
    currentTime += Math.round(dist);
    
    if (curr.visitTime) {
      const vTime = timeToMin(curr.visitTime);
      if (vTime !== null) {
        if (currentTime < vTime) {
          // Waiting: minor penalty
          cost += (vTime - currentTime) * (waitPenalty !== undefined ? waitPenalty : 1.0);
          currentTime = vTime; // Wait until appointment
        } else if (currentTime > vTime) {
          // Late: heavy penalty
          cost += (currentTime - vTime) * (latePenalty !== undefined ? latePenalty : 50.0);
        }
      }
    }
    
    // Add stay time (skip for end point)
    if (i < all.length - 1 || !end) {
      const stay = curr.stayMin != null ? curr.stayMin : defStay;
      currentTime += stay;
    }
  }
  return cost;
}

export function nearestNeighbor(points, start, startTimeStr, defaultStayMin, latePenalty, waitPenalty) {
  const rem = [...points];
  const route = [];
  let cur = start || rem.shift();
  const first = start ? null : cur;
  if (first) route.push(first);
  
  while (rem.length) {
    let bi = 0, minCost = Infinity;
    rem.forEach((p, idx) => {
      const tempRoute = [...route, p];
      const cost = routeCost(tempRoute, start, null, startTimeStr, defaultStayMin, latePenalty, waitPenalty);
      if (cost < minCost) { minCost = cost; bi = idx; }
    });
    const next = rem.splice(bi, 1)[0]; 
    route.push(next); 
    cur = next;
  }
  return route;
}

export function twoOpt(route, start, end, startTimeStr, defaultStayMin, latePenalty, waitPenalty) {
  let best = route.slice(); 
  let improved = true;
  let currentCost = routeCost(best, start, end, startTimeStr, defaultStayMin, latePenalty, waitPenalty);
  
  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let k = i + 1; k < best.length; k++) {
        const newR = [...best.slice(0, i), ...best.slice(i, k + 1).reverse(), ...best.slice(k + 1)];
        const newCost = routeCost(newR, start, end, startTimeStr, defaultStayMin, latePenalty, waitPenalty);
        if (newCost < currentCost - 0.001) { 
          best = newR; 
          currentCost = newCost;
          improved = true; 
        }
      }
    }
  }
  return best;
}

export async function fetchORSRoute(waypoints, apiKey) {
  const coords = waypoints.map(p => [p.lon, p.lat]);
  const url = `https://api.openrouteservice.org/v2/directions/driving-car/geojson`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': apiKey },
      body: JSON.stringify({ coordinates: coords })
    });
    if (!res.ok) { const err = await res.text(); throw new Error(err); }
    const data = await res.json();
    const seg = data.features[0].properties.segments;
    const legs = seg.map(s => ({ dist: s.distance / 1000, dur: s.duration }));
    const totalDist = data.features[0].properties.summary.distance / 1000;
    const totalDur = data.features[0].properties.summary.duration;
    const geometry = data.features[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    return { legs, totalDist, totalDur, geometry };
  } catch (e) {
    throw new Error('ORS-Fehler: ' + e.message);
  }
}
