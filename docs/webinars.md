# Webinars and video calls

The Webinars page uses LiveKit Cloud for real-time video and audio. Create a
LiveKit project, then configure these variables in the backend environment:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

Keep the API key and secret on the server; do not expose them as `VITE_`
variables. Apply the migration in
`supabase/migrations/20261031000000_create_webinar_rooms.sql` before using the
page. Deploy the frontend and backend together and restart the backend after
setting the variables.

Users must sign in to create a room or use an invitation link. A one-to-one
meeting is limited to two participants. In a webinar, the host can publish
audio/video and attendees join in viewer mode. Invitation links are shareable;
any signed-in user with the link can join. LiveKit access tokens are issued by
the backend and expire after two hours.

To use OBS as the camera in a call, start OBS Virtual Camera and choose it as
the camera in the meeting's device settings. This integration does not create
an RTMP broadcast destination or stream key.
