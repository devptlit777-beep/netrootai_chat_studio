# Maps setup

Maps uses Google Maps Platform for geocoding, nearby place search, routing, and
map rendering. Enable the Maps JavaScript API, Geocoding API, Places API (New),
and Routes API in a Google Cloud project with billing enabled.

1. Create a Google Maps Platform project and enable the APIs listed above.
2. Set `GOOGLE_MAPS_API_KEY` in the backend environment (the root `.env` for
   local development, or the server environment for production). Restrict this
   key to the Geocoding API, Places API, and Routes API.
3. Set `VITE_GOOGLE_MAPS_API_KEY` for the frontend build. Restrict this key by
   HTTP referrer to your development and production hostnames, and allow only
   the Maps JavaScript API.
4. Restart the backend and rebuild/redeploy the frontend after changing either
   key. The browser key is public by design and must be protected with referrer
   restrictions; the server key stays on the backend.

The app applies daily per-account request limits: 20 for Free, 100 for Pro, and
200 for Enterprise. Google Maps Platform billing and quotas also apply, so set
project quotas and monitor usage in Google Cloud Console.

The Maps page includes a **Use my location** action, and chat requests such as
"best places near me" show a separate **Share location** prompt. The browser
asks for permission before coordinates are sent to the backend. The backend
uses them for reverse geocoding and a nearby-place search within 5 km. A map
result created in chat is saved with the conversation, including its map
coordinates; users can choose **Not now** to avoid sharing. Browser geolocation
requires HTTPS in production (localhost is allowed during development).
