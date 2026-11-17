import { useEffect, useState } from 'react';
import { Loader2, MapPin, Navigation, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import MapResultCard from '../components/maps/MapResultCard';
import { getCurrentBrowserLocation, requestMapsApi } from '../lib/mapsApi';

const DEFAULT_MAP_STATE = {
  mode: 'places',
  query: '',
  category: 'all',
  origin: '',
  destination: '',
  travelMode: 'drive',
  result: null,
};

function readMapState(storageKey) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    return saved && typeof saved === 'object'
      ? { ...DEFAULT_MAP_STATE, ...saved, result: saved.result && typeof saved.result === 'object' ? saved.result : null }
      : DEFAULT_MAP_STATE;
  } catch {
    return DEFAULT_MAP_STATE;
  }
}

const PLACE_CATEGORIES = [
  { value: 'all', label: 'maps.allPlaces' },
  { value: 'catering.restaurant', label: 'maps.restaurants' },
  { value: 'catering.cafe', label: 'maps.cafes' },
  { value: 'accommodation.hotel', label: 'maps.hotels' },
  { value: 'tourism.attraction', label: 'maps.attractions' },
  { value: 'tourism.museum', label: 'maps.museums' },
  { value: 'leisure.park', label: 'maps.parks' },
  { value: 'commercial.supermarket', label: 'maps.supermarkets' },
  { value: 'healthcare.pharmacy', label: 'maps.pharmacies' },
];

export default function MapsPage() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const storageKey = `netroot_maps_page:${user?.id || user?.email || 'guest'}`;
  const [persistedMapState, setPersistedMapState] = useState(() => ({ key: storageKey, data: readMapState(storageKey) }));
  const mapState = persistedMapState.key === storageKey ? persistedMapState.data : DEFAULT_MAP_STATE;
  const { mode, query, category, origin, destination, travelMode, result } = mapState;
  const updateMapState = (key, value) => {
    setPersistedMapState((current) => current.key === storageKey
      ? { ...current, data: { ...current.data, [key]: value } }
      : current);
  };
  const setMode = (value) => updateMapState('mode', value);
  const setQuery = (value) => updateMapState('query', value);
  const setCategory = (value) => updateMapState('category', value);
  const setOrigin = (value) => updateMapState('origin', value);
  const setDestination = (value) => updateMapState('destination', value);
  const setTravelMode = (value) => updateMapState('travelMode', value);
  const setResult = (value) => updateMapState('result', value);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (persistedMapState.key !== storageKey) {
      setPersistedMapState({ key: storageKey, data: readMapState(storageKey) });
      return;
    }
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(persistedMapState.data));
    } catch {
      // Keep the live result available if browser storage is disabled or full.
    }
  }, [authLoading, storageKey, persistedMapState]);

  const panelClass = darkMode ? 'border-[#222] bg-[#111]' : 'border-gray-200 bg-white';
  const inputClass = `w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${
    darkMode ? 'border-[#2a2a2a] bg-[#1a1a1a] text-white placeholder-gray-600' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
  }`;

  async function searchMaps(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const identity = { email: user?.email, userId: user?.id };
      let data;
      if (mode === 'route') {
        data = await requestMapsApi('route', {
          ...identity,
          origin: origin.trim(),
          destination: destination.trim(),
          mode: travelMode,
          languageCode: i18n.resolvedLanguage || i18n.language,
        });
        setResult({ ...data, type: 'route', title: `${origin.trim()} → ${destination.trim()}` });
      } else if (mode === 'places') {
        data = await requestMapsApi('places', {
          ...identity,
          location: query.trim(),
          category,
        });
        setResult({
          ...data,
          type: 'places',
          title: t('maps.resultsNear', { location: query.trim() }),
          locations: [...(data.center ? [data.center] : []), ...(data.locations || [])],
        });
      } else {
        data = await requestMapsApi('geocode', { ...identity, query: query.trim() });
        setResult({
          type: 'search',
          title: t('maps.searchResults'),
          locations: data.locations || [],
        });
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function searchNearby() {
    setLocating(true);
    setError('');
    setResult(null);
    try {
      const coordinates = await getCurrentBrowserLocation();
      const data = await requestMapsApi('places', {
        email: user?.email,
        userId: user?.id,
        category,
        coordinates,
      });
      setResult({
        ...data,
        type: 'places',
        title: t('maps.currentLocationResults'),
        locations: [...(data.center ? [data.center] : []), ...(data.locations || [])],
        isCurrentLocation: true,
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0e0e0e] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <MapPin className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('maps.title')}</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{t('maps.description')}</p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
          <section className={`h-fit rounded-2xl border p-4 sm:p-5 ${panelClass}`}>
            <div className="mb-5 grid grid-cols-3 gap-2">
              {['places', 'search', 'route'].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setMode(value); setError(''); }}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                    mode === value
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : darkMode ? 'border-[#2a2a2a] text-gray-400 hover:text-white' : 'border-gray-200 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t(`maps.${value}`)}
                </button>
              ))}
            </div>

            {mode === 'places' && (
              <button
                type="button"
                onClick={searchNearby}
                disabled={locating || loading}
                className={`mb-4 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  darkMode ? 'border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20' : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                {t(locating ? 'maps.locating' : 'maps.useMyLocation')}
              </button>
            )}

            <form onSubmit={searchMaps} className="space-y-4">
              {mode === 'route' ? (
                <>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium">{t('maps.origin')}</span>
                    <input required value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder={t('maps.originPlaceholder')} className={inputClass} />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium">{t('maps.destination')}</span>
                    <input required value={destination} onChange={(event) => setDestination(event.target.value)} placeholder={t('maps.destinationPlaceholder')} className={inputClass} />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium">{t('maps.travelMode')}</span>
                    <select value={travelMode} onChange={(event) => setTravelMode(event.target.value)} className={inputClass}>
                      {['drive', 'walk', 'bicycle'].map((value) => <option key={value} value={value}>{t(`maps.${value}`)}</option>)}
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium">{t(mode === 'places' ? 'maps.cityOrAddress' : 'maps.addressToFind')}</span>
                    <input required value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('maps.queryPlaceholder')} className={inputClass} />
                  </label>
                  {mode === 'places' && (
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium">{t('maps.placeType')}</span>
                      <select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}>
                        {PLACE_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{t(item.label)}</option>)}
                      </select>
                    </label>
                  )}
                </>
              )}
              <button
                type="submit"
                disabled={loading || locating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'route' ? <Navigation className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                {t(loading ? 'maps.searching' : mode === 'route' ? 'maps.getRoute' : 'maps.search')}
              </button>
            </form>

            {error && (
              <div role="alert" className={`mt-4 rounded-lg border px-3 py-2.5 text-sm ${darkMode ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-red-200 bg-red-50 text-red-700'}`}>
                {error}
              </div>
            )}

          </section>

          <section className={`min-h-[360px] rounded-2xl border p-3 sm:p-4 ${panelClass}`}>
            {result ? (
              <MapResultCard mapData={result} darkMode={darkMode} />
            ) : (
              <div className={`flex min-h-[330px] flex-col items-center justify-center text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                <MapPin className="mb-3 h-9 w-9 text-blue-500/70" />
                <p className="text-sm font-medium">{t('maps.emptyTitle')}</p>
                <p className="mt-1 max-w-xs text-xs">{t('maps.emptyDescription')}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
