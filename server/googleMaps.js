const GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const PLACES_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

const PLACE_TYPES = {
    'catering.restaurant': ['restaurant'], 'catering.cafe': ['cafe'],
    'accommodation.hotel': ['hotel'], 'tourism.attraction': ['tourist_attraction'],
    'tourism.museum': ['museum'], 'leisure.park': ['park'],
    'commercial.supermarket': ['supermarket'], 'healthcare.pharmacy': ['pharmacy'],
};

function getApiKey() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        const error = new Error('Maps are not configured. Set GOOGLE_MAPS_API_KEY on the server.');
        error.statusCode = 503;
        throw error;
    }
    return apiKey;
}

async function googleRequest(url, options = {}) {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.error?.message || `Google Maps request failed (${response.status}).`);
        error.statusCode = 502;
        throw error;
    }
    return data;
}

function toLocation(result) {
    const lat = Number(result.geometry?.location?.lat ?? result.location?.latitude ?? result.lat);
    const lon = Number(result.geometry?.location?.lng ?? result.location?.longitude ?? result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const name = result.name || result.displayName?.text || result.formatted_address || result.formattedAddress || 'Location';
    return { id: result.place_id || result.id || `${lat},${lon}`, name,
        address: result.formatted_address || result.formattedAddress || result.vicinity || '', lat, lon,
        categories: result.types || result.primaryType ? (result.types || [result.primaryType]) : [] };
}

export async function geocode(query) {
    const url = new URL(GEOCODING_URL);
    url.search = new URLSearchParams({ address: query, key: getApiKey() }).toString();
    const data = await googleRequest(url);
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') throw new Error(data.error_message || `Google Geocoding failed (${data.status}).`);
    return (data.results || []).slice(0, 5).map(toLocation).filter(Boolean);
}

export async function reverseGeocode(lat, lon) {
    const url = new URL(GEOCODING_URL);
    url.search = new URLSearchParams({ latlng: `${lat},${lon}`, key: getApiKey() }).toString();
    const data = await googleRequest(url);
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') throw new Error(data.error_message || `Google Geocoding failed (${data.status}).`);
    return toLocation(data.results?.[0] || {});
}

function distanceBetweenMeters(first, second) {
    const radians = (degrees) => degrees * Math.PI / 180;
    const dLat = radians(second.lat - first.lat), dLon = radians(second.lon - first.lon);
    const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(first.lat)) * Math.cos(radians(second.lat)) * Math.sin(dLon / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

async function placesNearby(center, category) {
    const includedTypes = PLACE_TYPES[category] || Object.values(PLACE_TYPES).flat();
    const data = await googleRequest(PLACES_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': getApiKey(),
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType' },
        body: JSON.stringify({ includedTypes: [...new Set(includedTypes)], maxResultCount: 20, rankPreference: 'DISTANCE',
            locationRestriction: { circle: { center: { latitude: center.lat, longitude: center.lon }, radius: 5000 } } }),
    });
    return (data.places || []).map((place) => {
        const item = toLocation(place);
        return item ? { ...item, distanceMeters: Math.round(distanceBetweenMeters(center, item)) } : null;
    }).filter(Boolean).sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export async function searchPlaces(location, category, coordinates) {
    const hasCoordinates = Number.isFinite(coordinates?.lat) && Number.isFinite(coordinates?.lon);
    const found = hasCoordinates ? [] : await geocode(location);
    const center = hasCoordinates ? { id: 'current-location', name: 'Your location', address: '', lat: coordinates.lat, lon: coordinates.lon, categories: [], isCurrentLocation: true } : found[0];
    if (!center) return { center: null, locations: [] };
    const [locations, reverseLocation] = await Promise.all([placesNearby(center, category), hasCoordinates ? reverseGeocode(center.lat, center.lon) : null]);
    if (reverseLocation?.address) center.address = reverseLocation.address;
    return { center, locations };
}

function decodePolyline(encoded) {
    let index = 0, lat = 0, lon = 0;
    const points = [];
    while (index < encoded.length) {
        let result = 0, shift = 0, byte;
        do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        lat += result & 1 ? ~(result >> 1) : result >> 1;
        result = 0; shift = 0;
        do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        lon += result & 1 ? ~(result >> 1) : result >> 1;
        points.push([lat / 1e5, lon / 1e5]);
    }
    return points;
}

export async function calculateRoute(origin, destination, mode, languageCode = 'en') {
    const [starts, ends] = await Promise.all([geocode(origin), geocode(destination)]);
    const start = starts[0], end = ends[0];
    if (!start || !end) throw new Error('Could not find both route locations. Try adding a city or country.');
    const travelMode = { drive: 'DRIVE', walk: 'WALK', bicycle: 'BICYCLE' }[mode] || 'DRIVE';
    const data = await googleRequest(ROUTES_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': getApiKey(),
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction.instructions' },
        body: JSON.stringify({ origin: { location: { latLng: { latitude: start.lat, longitude: start.lon } } },
            destination: { location: { latLng: { latitude: end.lat, longitude: end.lon } } }, travelMode, units: 'METRIC', languageCode }) });
    const route = data.routes?.[0];
    if (!route?.polyline?.encodedPolyline) throw new Error('No route was found between these locations for the selected travel mode. Check the locations or try another travel mode.');
    return { origin: start, destination: end, locations: [start, end], routeCoordinates: decodePolyline(route.polyline.encodedPolyline),
        distanceMeters: route.distanceMeters, durationSeconds: Number.parseFloat(route.duration) || undefined,
        steps: (route.legs || []).flatMap((leg) => leg.steps || []).map((step) => step.navigationInstruction?.instructions).filter(Boolean), mode };
}

export function isCurrentLocationPrompt(prompt) {
    return /\b(?:near me|around me|current location|my location|where am i)\b/i.test(prompt)
        || (/\bnearby\b/i.test(prompt) && !/\b(?:in|near|around)\s+[\w]/i.test(prompt));
}

function getPlaceCategory(prompt) {
    const categories = [[/\b(?:restaurants?|food|eat|dining)\b/i, 'catering.restaurant'], [/\b(?:cafes?|coffee)\b/i, 'catering.cafe'],
        [/\bhotels?\b/i, 'accommodation.hotel'], [/\battractions?\b/i, 'tourism.attraction'], [/\bmuseums?\b/i, 'tourism.museum'],
        [/\bparks?\b/i, 'leisure.park'], [/\bsupermarkets?\b/i, 'commercial.supermarket'], [/\bpharmacies?\b/i, 'healthcare.pharmacy']];
    return categories.find(([pattern]) => pattern.test(prompt))?.[1] || 'all';
}

export async function createChatMap(prompt, coordinates, languageCode = 'en') {
    const routeMatch = prompt.match(/\b(?:directions?|route|distance|navigate|travel|drive|walk|cycle|how\s+(?:do\s+i|to)\s+get)\b.*?\bfrom\s+(.+?)\s+\bto\s+(.+?)(?:[?.!,]|$)/i);
    if (routeMatch) return { type: 'route', title: `${routeMatch[1].trim()} to ${routeMatch[2].trim()}`, ...(await calculateRoute(routeMatch[1].trim(), routeMatch[2].trim(), 'drive', languageCode)) };
    const placeMatch = prompt.match(/\b(?:places?|restaurant|restaurants|cafe|cafes|coffee|hotel|hotels|attraction|attractions|park|parks|museum|museums|supermarket|supermarkets|pharmacy|pharmacies)\b/i);
    const locationMatch = prompt.match(/\b(?:near|around|in|at)\s+(.+?)(?:[?.!,]|$)/i);
    if (isCurrentLocationPrompt(prompt) && Number.isFinite(coordinates?.lat) && Number.isFinite(coordinates?.lon)) {
        const nearby = await searchPlaces('', getPlaceCategory(prompt), coordinates);
        return { type: 'places', title: 'Your current location and nearby places', center: nearby.center, locations: [nearby.center, ...nearby.locations].filter(Boolean), isCurrentLocation: true };
    }
    if (isCurrentLocationPrompt(prompt)) return { type: 'places', title: 'Your current location and nearby places', needsLocation: true };
    if (placeMatch && !locationMatch) return { type: 'places', title: `${placeMatch[0]} near you`, error: 'Add a city or address to show nearby places.' };
    if (placeMatch && locationMatch) return { type: 'places', title: `${placeMatch[0]} near ${locationMatch[1].trim()}`, ...(await searchPlaces(locationMatch[1].trim(), getPlaceCategory(prompt))) };
    const query = prompt.replace(/\b(show|find|search for|map of|locate|where is|where are)\b/gi, '').replace(/\b(on a map|on the map|location)\b/gi, '').trim();
    return { type: 'search', title: 'Map results', locations: await geocode(query || prompt) };
}
