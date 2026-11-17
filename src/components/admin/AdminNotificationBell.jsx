import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  AlertTriangle,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Volume2,
} from 'lucide-react';
import API_BASE from '../../lib/api';

export default function AdminNotificationBell({ dark }) {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef(null);

  // Fetch initial alerts
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/alerts`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setUnreadCount(data.summary?.unreadCount || 0);
      }
    } catch (err) {
      console.error('[AdminNotificationBell] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Setup Real-time SSE stream for instant zero-delay notifications
  useEffect(() => {
    fetchAlerts();

    let eventSource = null;
    try {
      eventSource = new EventSource(`${API_BASE}/api/admin/alerts/stream`);

      eventSource.onmessage = (event) => {
        try {
          const newAlert = JSON.parse(event.data);
          if (newAlert && newAlert.id) {
            setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)].slice(0, 50));
            setUnreadCount((c) => c + 1);
          }
        } catch {
          // heartbeat or ping
        }
      };

      eventSource.onerror = () => {
        // Auto-reconnect managed by browser EventSource
      };
    } catch (err) {
      console.warn('[SSE] EventSource init failed:', err);
    }

    // Close on outside click
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      if (eventSource) eventSource.close();
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/api/admin/alerts/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: 'all' }),
      });
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            fetchAlerts();
          }
        }}
        title="Real-Time System Alerts & OpenRouter Health"
        className={`relative p-2 rounded-xl border transition-all flex items-center justify-center ${
          isOpen
            ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-md shadow-blue-500/20'
            : dark
            ? 'bg-[#181818] border-[#2a2a2a] text-gray-300 hover:text-white hover:border-[#3a3a3a]'
            : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900'
        }`}
      >
        <Bell className="w-4 h-4" />
        
        {/* Real-time Pulsing Red Badge if there are unread alerts */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 text-[9px] font-bold text-white items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Drawer */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ${
            dark ? 'bg-[#12141c] border-white/10 text-white shadow-black/80' : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold tracking-wide">Live System & Model Alerts</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchAlerts}
                title="Refresh"
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Mark read
                </button>
              )}
            </div>
          </div>

          {/* Alerts List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/[0.06]">
            {alerts.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
                <p className="text-xs font-semibold text-slate-300">All AI Models & OpenRouter Healthy</p>
                <p className="text-[11px] text-slate-500">Zero active error logs or rate limit breaches.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 transition-colors flex items-start gap-3 ${
                    alert.is_read
                      ? 'opacity-70 hover:opacity-100 hover:bg-white/[0.02]'
                      : dark
                      ? 'bg-blue-950/20 hover:bg-blue-950/30'
                      : 'bg-blue-50/60 hover:bg-blue-50'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {alert.severity === 'CRITICAL' ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : alert.severity === 'WARNING' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-blue-400" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border font-bold ${getSeverityBadge(
                          alert.severity
                        )}`}
                      >
                        {alert.type || 'ALERT'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-200 leading-snug break-words">
                      {alert.message}
                    </p>

                    {(alert.model || alert.user_email) && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-0.5">
                        {alert.model && <span className="text-blue-300 truncate">Model: {alert.model}</span>}
                        {alert.user_email && <span className="text-slate-500">• {alert.user_email}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-white/10 text-center bg-white/[0.02]">
            <span className="text-[10px] text-slate-400 font-mono">
              Live Real-time SSE • Instant Model Error Catcher
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
