import { useEffect, useState } from 'react';
import { Copy, Loader2, Mic, Users, Video } from 'lucide-react';
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from '@livekit/components-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import API_BASE from '../lib/api';
import '@livekit/components-styles';

async function requestWebinarApi(operation, accessToken, body) {
  const response = await fetch(`${API_BASE.replace(/\/+$/, '')}/api/webinars/${operation}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Webinar request failed (${response.status}).`);
  return data;
}

export default function WebinarsPage() {
  const { t } = useTranslation();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [title, setTitle] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [roomType, setRoomType] = useState('meeting');
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(Boolean(roomId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError('');
    requestWebinarApi('token', session?.access_token, { roomId })
      .then((response) => {
        if (active) setRoom(response);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [roomId, session?.access_token]);

  async function createRoom(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await requestWebinarApi('create', session?.access_token, { title, type: roomType });
      navigate(`/webinars/${response.room.id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function joinRoom(event) {
    event.preventDefault();
    const code = joinCode.trim().replace(/^.*\/webinars\//, '').replace(/[?#].*$/, '');
    if (!code) {
      setError(t('webinars.enterInvitation'));
      return;
    }
    navigate(`/webinars/${encodeURIComponent(code)}`);
  }

  async function copyInvitation() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/webinars/${room.room.id}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t('webinars.copyFailed'));
    }
  }

  function leaveRoom() {
    setRoom(null);
    navigate('/webinars', { replace: true });
  }

  const surfaceClass = darkMode ? 'border-[#262626] bg-[#141414]' : 'border-gray-200 bg-white';
  const inputClass = `w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${
    darkMode ? 'border-[#333] bg-[#1a1a1a] text-white placeholder-gray-500' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
  }`;

  return (
    <main className={`min-h-screen px-4 py-6 sm:px-8 ${darkMode ? 'bg-[#0e0e0e] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-6xl">
        {roomId ? (
          <>
            <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold">{room?.room.title || t('webinars.room')}</h1>
                {room && (
                  <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t(room.room.type === 'meeting' ? 'webinars.oneToOne' : 'webinars.webinar')}
                    {!room.room.isHost && room.room.type === 'webinar' ? ` · ${t('webinars.viewerMode')}` : ''}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {room?.room.isHost && (
                  <button type="button" onClick={copyInvitation} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${darkMode ? 'border-[#333] hover:bg-[#222]' : 'border-gray-200 hover:bg-gray-100'}`}>
                    <Copy className="h-4 w-4" />
                    {copied ? t('webinars.invitationCopied') : t('webinars.copyInvitation')}
                  </button>
                )}
                <button type="button" onClick={leaveRoom} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
                  {t('webinars.leaveRoom')}
                </button>
              </div>
            </header>

            {error ? (
              <div role="alert" className={`rounded-xl border p-4 text-sm ${darkMode ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}>
                <p>{error}</p>
                <button type="button" onClick={leaveRoom} className="mt-3 font-semibold underline">{t('webinars.backToWebinars')}</button>
              </div>
            ) : loading || !room ? (
              <div className={`flex min-h-[50vh] items-center justify-center rounded-2xl border ${surfaceClass}`}>
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <div data-lk-theme="default" className={`overflow-hidden rounded-2xl border ${surfaceClass}`} style={{ height: 'calc(100dvh - 150px)', minHeight: 420 }}>
                <LiveKitRoom
                  key={room.room.id}
                  serverUrl={room.serverUrl}
                  token={room.token}
                  connect
                  audio={false}
                  video={false}
                  onError={(connectionError) => setError(connectionError.message)}
                  onDisconnected={leaveRoom}
                >
                  <VideoConference />
                  <RoomAudioRenderer />
                </LiveKitRoom>
              </div>
            )}
          </>
        ) : (
          <>
            <header className="mb-8">
              <h1 className="text-2xl font-bold">{t('webinars.title')}</h1>
              <p className={`mt-2 max-w-2xl text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('webinars.description')}</p>
            </header>

            {error && (
              <div role="alert" className={`mb-5 rounded-xl border px-4 py-3 text-sm ${darkMode ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}>
                {error}
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-2">
              <section className={`rounded-2xl border p-5 sm:p-6 ${surfaceClass}`}>
                <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                  <Video className="h-5 w-5 text-blue-500" />
                </div>
                <h2 className="text-lg font-semibold">{t('webinars.createTitle')}</h2>
                <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('webinars.createDescription')}</p>
                <form onSubmit={createRoom} className="mt-5 space-y-4">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium">{t('webinars.roomTitle')}</span>
                    <input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('webinars.roomTitlePlaceholder')} className={inputClass} />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={() => setRoomType('meeting')} className={`rounded-xl border p-3 text-left ${roomType === 'meeting' ? 'border-blue-500 bg-blue-500/10' : darkMode ? 'border-[#333]' : 'border-gray-200'}`}>
                      <span className="flex items-center gap-2 text-sm font-semibold"><Mic className="h-4 w-4 text-blue-500" />{t('webinars.oneToOne')}</span>
                      <span className={`mt-1 block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('webinars.meetingDescription')}</span>
                    </button>
                    <button type="button" onClick={() => setRoomType('webinar')} className={`rounded-xl border p-3 text-left ${roomType === 'webinar' ? 'border-blue-500 bg-blue-500/10' : darkMode ? 'border-[#333]' : 'border-gray-200'}`}>
                      <span className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-blue-500" />{t('webinars.webinar')}</span>
                      <span className={`mt-1 block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('webinars.webinarDescription')}</span>
                    </button>
                  </div>
                  <button type="submit" disabled={busy || !session?.access_token} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t(busy ? 'webinars.creating' : 'webinars.createRoom')}
                  </button>
                </form>
              </section>

              <section className={`h-fit rounded-2xl border p-5 sm:p-6 ${surfaceClass}`}>
                <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${darkMode ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <h2 className="text-lg font-semibold">{t('webinars.joinTitle')}</h2>
                <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('webinars.joinDescription')}</p>
                <form onSubmit={joinRoom} className="mt-5 space-y-3">
                  <input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} placeholder={t('webinars.invitationPlaceholder')} className={inputClass} />
                  <button type="submit" className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold ${darkMode ? 'border-[#333] hover:bg-[#222]' : 'border-gray-200 hover:bg-gray-50'}`}>
                    {t('webinars.joinRoom')}
                  </button>
                </form>
                <p className={`mt-5 border-t pt-4 text-xs leading-5 ${darkMode ? 'border-[#2a2a2a] text-gray-500' : 'border-gray-100 text-gray-500'}`}>
                  {t('webinars.obsNote')}
                </p>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
