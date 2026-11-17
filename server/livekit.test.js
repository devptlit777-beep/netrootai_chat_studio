import test from 'node:test';
import assert from 'node:assert/strict';
import { createLiveKitToken } from './livekit.js';

async function withLiveKitConfig(t) {
    const previous = {
        url: process.env.LIVEKIT_URL,
        key: process.env.LIVEKIT_API_KEY,
        secret: process.env.LIVEKIT_API_SECRET,
    };
    process.env.LIVEKIT_URL = 'wss://example.livekit.cloud';
    process.env.LIVEKIT_API_KEY = 'test-key';
    process.env.LIVEKIT_API_SECRET = 'test-secret';
    t.after(() => {
        if (previous.url === undefined) delete process.env.LIVEKIT_URL;
        else process.env.LIVEKIT_URL = previous.url;
        if (previous.key === undefined) delete process.env.LIVEKIT_API_KEY;
        else process.env.LIVEKIT_API_KEY = previous.key;
        if (previous.secret === undefined) delete process.env.LIVEKIT_API_SECRET;
        else process.env.LIVEKIT_API_SECRET = previous.secret;
    });
}

function decodeClaims(token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
}

test('webinar attendee tokens allow viewing but not publishing media', async (t) => {
    await withLiveKitConfig(t);
    const result = await createLiveKitToken({
        room: { room_id: 'room-1', title: 'Town hall', room_type: 'webinar', host_user_id: 'host-1' },
        user: { id: 'guest-1', email: 'guest@example.com' },
        isHost: false,
    });
    const claims = decodeClaims(result.token);

    assert.equal(result.serverUrl, 'wss://example.livekit.cloud');
    assert.deepEqual(result.room, { id: 'room-1', title: 'Town hall', type: 'webinar', isHost: false });
    assert.equal(claims.video.room, 'room-1');
    assert.equal(claims.video.canPublish, false);
    assert.equal(claims.video.canSubscribe, true);
    assert.equal(claims.video.canPublishData, true);
});

test('meeting participant tokens permit media publishing and have unique identities', async (t) => {
    await withLiveKitConfig(t);
    const options = {
        room: { room_id: 'room-2', title: 'Private call', room_type: 'meeting', host_user_id: 'host-2' },
        user: { id: 'guest-2', user_metadata: { full_name: 'Guest' } },
        isHost: false,
    };
    const first = await createLiveKitToken(options);
    const second = await createLiveKitToken(options);

    assert.equal(decodeClaims(first.token).video.canPublish, true);
    assert.notEqual(decodeClaims(first.token).sub, decodeClaims(second.token).sub);
});

test('webinar token creation reports missing server configuration', async (t) => {
    const previous = [process.env.LIVEKIT_URL, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET];
    delete process.env.LIVEKIT_URL;
    delete process.env.LIVEKIT_API_KEY;
    delete process.env.LIVEKIT_API_SECRET;
    t.after(() => {
        ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'].forEach((key, index) => {
            if (previous[index] === undefined) delete process.env[key];
            else process.env[key] = previous[index];
        });
    });

    await assert.rejects(createLiveKitToken({
        room: { room_id: 'room-3', title: 'Meeting', room_type: 'meeting' },
        user: { id: 'user-3' },
        isHost: true,
    }), (error) => {
        assert.equal(error.statusCode, 503);
        assert.match(error.message, /LIVEKIT_URL/);
        return true;
    });
});
