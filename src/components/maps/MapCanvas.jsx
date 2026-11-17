import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

let googleMapsPromise;
const EMPTY_ARRAY = [];

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (googleMapsPromise) return googleMapsPromise;
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject(new Error('Set VITE_GOOGLE_MAPS_API_KEY to display Google Maps.'));
  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-maps]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google Maps could not be loaded.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.dataset.googleMaps = 'true';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
    script.async = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error('Google Maps could not be loaded. Check the browser key and API settings.'));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

export default function MapCanvas({ locations = EMPTY_ARRAY, routeCoordinates = EMPTY_ARRAY, height = 320, darkMode = false, selectedLocationId, onSelectLocation }) {
  const { t } = useTranslation();
  const mapNode = useRef(null);
  const mapRef = useRef(null);
  const markerRefs = useRef(new Map());
  const infoRefs = useRef(new Map());
  const routeMarkerRef = useRef(null);
  const progressRef = useRef(0);
  const [error, setError] = useState('');
  const [routeProgress, setRouteProgress] = useState(0);
  const [playingRoute, setPlayingRoute] = useState(false);
  const validLocations = locations.filter((location) => Number.isFinite(location.lat) && Number.isFinite(location.lon));
  const validRoute = routeCoordinates.filter((point) => Array.isArray(point) && point.length === 2);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then((maps) => {
      if (cancelled || !mapNode.current) return;
      setError('');
      routeMarkerRef.current = null;
      const points = [...validLocations.map(({ lat, lon }) => ({ lat, lng: lon })), ...validRoute.map(([lat, lng]) => ({ lat, lng }))];
      const center = points[0] || { lat: 20, lng: 0 };
      const map = new maps.Map(mapNode.current, { center, zoom: points.length ? 11 : 2, mapTypeControl: false, streetViewControl: false, fullscreenControl: true, colorScheme: darkMode ? 'DARK' : 'LIGHT' });
      mapRef.current = map;
      const bounds = new maps.LatLngBounds();
      points.forEach((point) => bounds.extend(point));
      if (points.length === 1) map.setCenter(points[0]);
      else if (points.length > 1) map.fitBounds(bounds, 28);
      markerRefs.current.clear();
      infoRefs.current.clear();
      validLocations.forEach((location, index) => {
        const marker = new maps.Marker({ position: { lat: location.lat, lng: location.lon }, map, title: location.name, label: validLocations.length > 1 ? String(index + 1) : undefined });
        const locationId = String(location.id || `${location.lat},${location.lon}`);
        markerRefs.current.set(locationId, marker);
        if (location.address || location.name) {
          const info = new maps.InfoWindow({ content: `<strong>${escapeHtml(location.isCurrentLocation ? 'Your location' : location.name)}</strong>${location.address ? `<div>${escapeHtml(location.address)}</div>` : ''}` });
          infoRefs.current.set(locationId, info);
          marker.addListener('click', () => {
            onSelectLocation?.(locationId);
            info.open({ map, anchor: marker });
          });
        }
      });
      if (validRoute.length > 1) {
        const path = validRoute.map(([lat, lng]) => ({ lat, lng }));
        new maps.Polyline({ path, geodesic: true, strokeColor: '#2563eb', strokeOpacity: 0.9, strokeWeight: 5, map });
        routeMarkerRef.current = new maps.Marker({
          map,
          position: pointAlongRoute(validRoute, progressRef.current),
          title: t('maps.routeReplayMarker'),
          zIndex: 1000,
          icon: { path: maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#f97316', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
        });
      }
    }).catch((loadError) => { if (!cancelled) setError(loadError.message); });
    return () => {
      cancelled = true;
      routeMarkerRef.current?.setMap(null);
      routeMarkerRef.current = null;
      mapRef.current = null;
    };
  }, [locations, routeCoordinates, darkMode]);

  useEffect(() => {
    setRouteProgress(0);
    progressRef.current = 0;
    setPlayingRoute(false);
  }, [routeCoordinates]);

  useEffect(() => {
    progressRef.current = routeProgress;
    if (!routeMarkerRef.current || validRoute.length < 2) return;
    routeMarkerRef.current.setPosition(pointAlongRoute(validRoute, routeProgress));
  }, [routeProgress, routeCoordinates]);

  useEffect(() => {
    if (!playingRoute) return undefined;
    const timer = window.setInterval(() => {
      const nextProgress = Math.min(1, progressRef.current + 1 / 300);
      progressRef.current = nextProgress;
      setRouteProgress(nextProgress);
      if (nextProgress >= 1) setPlayingRoute(false);
    }, 40);
    return () => window.clearInterval(timer);
  }, [playingRoute]);

  function toggleRoutePlayback() {
    if (routeProgress >= 1) {
      progressRef.current = 0;
      setRouteProgress(0);
    }
    setPlayingRoute((isPlaying) => !isPlaying);
  }

  function resetRoutePlayback() {
    setPlayingRoute(false);
    progressRef.current = 0;
    setRouteProgress(0);
  }

  useEffect(() => {
    if (!selectedLocationId || !mapRef.current) return;
    const marker = markerRefs.current.get(String(selectedLocationId));
    if (!marker) return;
    mapRef.current.panTo(marker.getPosition());
    mapRef.current.setZoom(Math.max(mapRef.current.getZoom() || 0, 15));
    infoRefs.current.get(String(selectedLocationId))?.open({ map: mapRef.current, anchor: marker });
  }, [selectedLocationId]);

  return <div className={`relative overflow-hidden rounded-xl border ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
    <div ref={mapNode} style={{ height, width: '100%' }} aria-label="Google Map" />
    {validRoute.length > 1 && (
      <div className={`absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-xl border px-3 py-2 shadow-lg backdrop-blur ${darkMode ? 'border-[#333] bg-[#111]/95 text-gray-200' : 'border-white bg-white/95 text-gray-800'}`}>
        <span className="hidden shrink-0 text-[11px] font-semibold sm:inline">{t('maps.routeReplay')}</span>
        <button type="button" onClick={toggleRoutePlayback} aria-label={t(playingRoute ? 'maps.pauseRoute' : 'maps.playRoute')} title={t(playingRoute ? 'maps.pauseRoute' : 'maps.playRoute')} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700">
          {playingRoute ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
        <button type="button" onClick={resetRoutePlayback} aria-label={t('maps.resetRoute')} title={t('maps.resetRoute')} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${darkMode ? 'text-gray-300 hover:bg-[#292929]' : 'text-gray-600 hover:bg-gray-100'}`}>
          <RotateCcw className="h-4 w-4" />
        </button>
        <input type="range" min="0" max="1" step="0.001" value={routeProgress} aria-label={t('maps.routeProgress')} onChange={(event) => { setPlayingRoute(false); setRouteProgress(Number(event.target.value)); }} className="min-w-0 flex-1 accent-blue-600" />
        <span className="w-9 shrink-0 text-right text-[10px] tabular-nums text-gray-500">{Math.round(routeProgress * 100)}%</span>
      </div>
    )}
    {error && <div role="alert" className="absolute inset-x-3 bottom-3 rounded-lg bg-white/95 px-3 py-2 text-xs text-red-700 shadow">{error}</div>}
  </div>;
}

function pointAlongRoute(route, progress) {
  const segmentDistances = [];
  let totalDistance = 0;
  for (let index = 1; index < route.length; index += 1) {
    const distance = haversineDistance(route[index - 1], route[index]);
    segmentDistances.push(distance);
    totalDistance += distance;
  }
  if (!totalDistance) return { lat: route[0][0], lng: route[0][1] };
  let remainingDistance = totalDistance * Math.max(0, Math.min(1, progress));
  for (let index = 0; index < segmentDistances.length; index += 1) {
    const segmentDistance = segmentDistances[index];
    if (remainingDistance <= segmentDistance || index === segmentDistances.length - 1) {
      const fraction = segmentDistance ? remainingDistance / segmentDistance : 0;
      const start = route[index];
      const end = route[index + 1];
      return { lat: start[0] + (end[0] - start[0]) * fraction, lng: start[1] + (end[1] - start[1]) * fraction };
    }
    remainingDistance -= segmentDistance;
  }
  const last = route[route.length - 1];
  return { lat: last[0], lng: last[1] };
}

function haversineDistance([firstLat, firstLng], [secondLat, secondLng]) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = radians(secondLat - firstLat);
  const longitudeDelta = radians(secondLng - firstLng);
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(firstLat)) * Math.cos(radians(secondLat)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}
