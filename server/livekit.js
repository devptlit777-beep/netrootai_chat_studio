import { randomUUID } from 'node:crypto';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

function getLiveKitConfig() {
    const serverUrl = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!serverUrl || !apiKey || !apiSecret) {
        const error = new Error('Webinars are not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET on the server.');
        error.statusCode = 503;
        throw error;
    }
    return { serverUrl, apiKey, apiSecret };
}

function getHttpServerUrl(serverUrl) {
    return serverUrl.replace(/^wss:/i, 'https:').replace(/^ws:/i, 'http:');
}

export async function createLiveKitRoom(roomId, roomType) {
    const { serverUrl, apiKey, apiSecret } = getLiveKitConfig();
    const roomService = new RoomServiceClient(getHttpServerUrl(serverUrl), apiKey, apiSecret);
    const activeRooms = await roomService.listRooms([roomId]);
    if (activeRooms.some((room) => room.name === roomId)) return;

    try {
        await roomService.createRoom({
            name: roomId,
            emptyTimeout: 300,
            maxParticipants: roomType === 'meeting' ? 2 : 500,
        });
    } catch (error) {
        const roomsAfterCreate = await roomService.listRooms([roomId]);
        if (!roomsAfterCreate.some((room) => room.name === roomId)) throw error;
    }
}

export async function createLiveKitToken({ room, user, isHost }) {
    const { serverUrl, apiKey, apiSecret } = getLiveKitConfig();
    const displayName = user.user_metadata?.full_name || user.email || 'Participant';
    const token = new AccessToken(apiKey, apiSecret, {
        identity: `${user.id}-${randomUUID()}`,
        name: displayName.slice(0, 80),
        ttl: '2h',
    });
    const canPublish = room.room_type === 'meeting' || isHost;
    token.addGrant({
        roomJoin: true,
        room: room.room_id,
        canPublish,
        canPublishData: true,
        canSubscribe: true,
        roomAdmin: isHost,
    });

    return {
        serverUrl,
        token: await token.toJwt(),
        room: {
            id: room.room_id,
            title: room.title,
            type: room.room_type,
            isHost,
        },
    };
}
