import { lazy, Suspense, useState } from 'react';
import { AlertCircle, ExternalLink, Loader2, MapPin, Route } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MapCanvas = lazy(() => import('./MapCanvas'));

function formatDistance(meters) {
  if (!Number.isFinite(Number(meters))) return null;
  const distance = Number(meters);
  return distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(Number(seconds))) return null;
  const minutes = Math.round(Number(seconds) / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}

function placeKey(place) {
  return String(place.id || `${place.lat},${place.lon}`);
}

export default function MapResultCard({ mapData, darkMode = false, compact = false, onShareLocation, onDismissLocation }) {
  const { t } = useTranslation();
  const [sharingLocation, setSharingLocation] = useState(false);
  const [shareError, setShareError] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const locations = mapData.locations || [];
  const places = locations.filter((location) => location.id !== mapData.center?.id && !location.isCurrentLocation);
  const cardClass = darkMode ? 'border-[#2a2a2a] bg-[#171717] text-gray-200' : 'border-gray-200 bg-white text-gray-800';
  const secondaryText = darkMode ? 'text-gray-400' : 'text-gray-600';
  const selectedPlace = places.find((place) => placeKey(place) === String(selectedPlaceId));
  const routeOrigin = mapData.origin?.address || mapData.origin?.name || (mapData.origin ? `${mapData.origin.lat},${mapData.origin.lon}` : '');
  const routeDestination = mapData.destination?.address || mapData.destination?.name || (mapData.destination ? `${mapData.destination.lat},${mapData.destination.lon}` : '');
  const mapTarget = mapData.type === 'route' && routeOrigin && routeDestination
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(routeOrigin)}&destination=${encodeURIComponent(routeDestination)}&travelmode=${({ drive: 'driving', walk: 'walking', bicycle: 'bicycling' })[mapData.mode] || 'driving'}`
    : (() => {
      const target = selectedPlace || places[0] || mapData.center || locations[0];
      if (!target) return '';
      const query = target.lat != null && target.lon != null ? `${target.lat},${target.lon}` : target.address || target.name;
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    })();

  async function shareLocation() {
    if (!onShareLocation) return;
    setSharingLocation(true);
    setShareError('');
    try {
      await onShareLocation();
    } catch (error) {
      setShareError(error.message);
    } finally {
      setSharingLocation(false);
    }
  }

  async function dismissLocation() {
    if (!onDismissLocation) return;
    setShareError('');
    try {
      await onDismissLocation();
    } catch (error) {
      setShareError(error.message);
    }
  }

  return (
    <section className={`mt-3 overflow-hidden rounded-2xl border ${cardClass}`} aria-label={mapData.title || 'Map results'}>
      <div className="flex items-center gap-2 px-4 py-3">
        {mapData.type === 'route' ? <Route className="h-4 w-4 text-blue-500" /> : <MapPin className="h-4 w-4 text-blue-500" />}
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{mapData.title || 'Map results'}</h3>
        {mapData.distanceMeters != null && (
          <span className="shrink-0 text-xs text-gray-500">
            {[formatDistance(mapData.distanceMeters), formatDuration(mapData.durationSeconds)].filter(Boolean).join(' · ')}
          </span>
        )}
        {mapTarget && (
          <a href={mapTarget} target="_blank" rel="noreferrer" className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold ${darkMode ? 'bg-blue-500/10 text-blue-300 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('maps.openInGoogleMaps')}</span>
          </a>
        )}
      </div>

      {mapData.needsLocation ? (
        <div className={`border-t px-4 py-4 ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
          <p className="text-sm font-semibold">{t('maps.shareLocationTitle')}</p>
          <p className={`mt-1 text-xs ${secondaryText}`}>{t('maps.shareLocationDescription')}</p>
          {shareError && <p role="alert" className="mt-2 text-xs text-red-500">{shareError}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={shareLocation} disabled={sharingLocation || !onShareLocation} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {sharingLocation && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t(sharingLocation ? 'maps.locating' : 'maps.shareLocation')}
            </button>
            {onDismissLocation && (
              <button type="button" onClick={dismissLocation} disabled={sharingLocation} className={`rounded-full border px-4 py-2 text-xs font-medium ${darkMode ? 'border-[#333] text-gray-300 hover:bg-[#222]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {t('maps.notNow')}
              </button>
            )}
          </div>
        </div>
      ) : mapData.error ? (
        <div className={`flex items-start gap-2 border-t px-4 py-3 text-sm ${darkMode ? 'border-[#2a2a2a] text-amber-300' : 'border-gray-100 text-amber-700'}`}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{mapData.error}</span>
        </div>
      ) : locations.length > 0 ? (
        <>
          <Suspense fallback={<div className={`animate-pulse ${darkMode ? 'bg-[#111]' : 'bg-gray-100'}`} style={{ height: compact ? 240 : 340 }} />}>
            <MapCanvas
              locations={locations}
              routeCoordinates={mapData.routeCoordinates}
              height={compact ? 240 : 340}
              darkMode={darkMode}
              selectedLocationId={selectedPlaceId}
              onSelectLocation={setSelectedPlaceId}
            />
          </Suspense>
          {mapData.center?.address && mapData.isCurrentLocation && (
            <p className={`border-t px-4 py-2 text-xs ${darkMode ? 'border-[#2a2a2a] text-gray-400' : 'border-gray-100 text-gray-600'}`}>
              {t('maps.currentLocation')}: {mapData.center.address}
            </p>
          )}
          {mapData.type === 'places' && places.length > 0 && (
            <div className={`border-t px-4 py-3 ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
              <h4 className="mb-2 text-xs font-semibold">{t('maps.nearbyRecommendations')}</h4>
              <ol className="space-y-2">
                {places.slice(0, 10).map((place, index) => (
                  <li key={placeKey(place) || `${place.name}-${index}`} className={`rounded-lg border ${String(selectedPlaceId) === placeKey(place) ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-transparent'} ${darkMode ? 'bg-[#111]' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3 px-2 py-2">
                      <button type="button" onClick={() => setSelectedPlaceId(String(place.id || `${place.lat},${place.lon}`))} aria-label={`${t('maps.showOnMap')}: ${place.name}`} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-semibold text-blue-500">{index + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold">{place.name}</span>
                          {place.address && <span className={`mt-0.5 block truncate text-[11px] ${secondaryText}`}>{place.address}</span>}
                        </span>
                        {place.distanceMeters != null && <span className={`shrink-0 text-[10px] ${secondaryText}`}>{formatDistance(place.distanceMeters)}</span>}
                      </button>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.lat},${place.lon}`)}`} target="_blank" rel="noreferrer" aria-label={`${t('maps.openInGoogleMaps')}: ${place.name}`} title={t('maps.openInGoogleMaps')} className={`rounded-md p-1.5 ${darkMode ? 'text-gray-400 hover:bg-[#222] hover:text-white' : 'text-gray-500 hover:bg-white hover:text-blue-700'}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {mapData.steps?.length > 0 && (
            <ol className={`max-h-36 space-y-1 overflow-y-auto px-4 py-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {mapData.steps.slice(0, 8).map((step, index) => <li key={`${step}-${index}`}>{index + 1}. {step}</li>)}
            </ol>
          )}
        </>
      ) : mapData.dismissed ? (
        <div className={`border-t px-4 py-3 text-sm ${darkMode ? 'border-[#2a2a2a] text-gray-400' : 'border-gray-100 text-gray-500'}`}>
          {t('maps.locationNotShared')}
        </div>
      ) : (
        <div className={`border-t px-4 py-3 text-sm ${darkMode ? 'border-[#2a2a2a] text-gray-400' : 'border-gray-100 text-gray-500'}`}>
          No map results found. Try adding a city or country to your search.
        </div>
      )}
    </section>
  );
}
