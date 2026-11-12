import API_BASE from './api';

export async function requestMapsApi(path, body) {
  const response = await fetch(`${API_BASE.replace(/\/+$/, '')}/api/maps/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Map request failed (${response.status}).`);
    error.usage = data.usage;
    throw error;
  }
  return data;
}

export function getCurrentBrowserLocation() {
  if (!navigator.geolocation) {
    return Promise.reject(new Error('Location sharing is not available in this browser.'));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lon: coords.longitude }),
      (error) => {
        const messages = {
          1: 'Location permission was denied. Allow location access in your browser settings and try again.',
          2: 'Your location could not be determined. Check your device location settings and try again.',
          3: 'Finding your location timed out. Please try again.',
        };
        reject(new Error(messages[error.code] || 'Could not get your location. Please try again.'));
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 15000 },
    );
  });
}

export function needsCurrentLocation(prompt) {
  return /\b(?:near me|around me|current location|my location|where am i)\b/i.test(prompt)
    || (/\bnearby\b/i.test(prompt) && !/\b(?:in|near|around)\s+[\w]/i.test(prompt));
}

export function isMapPrompt(prompt) {
  if (needsCurrentLocation(prompt)) return true;
  const placeQuery = /\b(?:places?|restaurants?|cafes?|coffee|hotels?|attractions?|parks?|museums?|supermarkets?|pharmacies?)\b/i.test(prompt);
  return /\b(?:map|maps|directions?|route|routing|distance|nearby|near me)\b/i.test(prompt)
    || /\bwhere (?:is|are)\b/i.test(prompt)
    || /\b(?:get|travel|drive|walk|cycle|go)\b.{0,40}\bfrom\s+.+\bto\s+.+/i.test(prompt)
    || (placeQuery && /\b(?:near|around|in|by)\b/i.test(prompt))
    || (/\b(?:find|show|search|recommend)\b/i.test(prompt) && placeQuery);
}
