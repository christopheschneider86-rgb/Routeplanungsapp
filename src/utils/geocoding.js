export async function geocodeAddress(address) {
  // Check if it's already coordinates
  const coordMatch = address.match(/^\s*(-?\d+\.?\d*)\s*[,;]\s*(-?\d+\.?\d*)\s*$/);
  if (coordMatch) return { lat: parseFloat(coordMatch[1]), lon: parseFloat(coordMatch[2]) };

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=0&countrycodes=de,at,ch`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'HaendlerRoutenoptimierung/1.0 (internal-tool)', 'Accept-Language': 'de' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch { return null; }
}

export async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function geocodeAll(items, onProgress, checkCancel) {
  const total = items.length;
  let done = 0;
  const failed = [];
  const processedItems = [...items];

  for (let i = 0; i < processedItems.length; i++) {
    if (checkCancel && checkCancel()) break;
    
    const item = processedItems[i];
    if (item.lat !== null && item.lon !== null) { 
      done++; 
      continue; 
    }
    
    const result = await geocodeAddress(item.address);
    if (result) { 
      processedItems[i] = { ...item, lat: result.lat, lon: result.lon }; 
    } else { 
      failed.push(item.name || item.address); 
    }
    
    done++;
    if (onProgress) onProgress(done, total);
    
    await sleep(1100); // respect 1 req/sec limit from Nominatim
  }

  return {
    items: processedItems.filter(i => i.lat !== null && i.lon !== null),
    failed
  };
}
