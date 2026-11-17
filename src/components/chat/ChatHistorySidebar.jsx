import { useState, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
} from 'lucide-react';

/**
 * Formats thread date relative for past 24h/7d, or short calendar date for older.
 * e.g. 'Just now', '15m', '2h', '1d', '2d', '12 Nov'
 */
function formatThreadDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'Just now';
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (3600 * 1000));
  const diffDays = Math.floor(diffMs / (86400 * 1000));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays <= 7) return `${diffDays}d`;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const isSameYear = date.getFullYear() === now.getFullYear();

  return isSameYear ? `${day} ${month}` : `${day} ${month} ${String(date.getFullYear()).slice(2)}`;
}

/**
 * Groups threads into chronological sections: Today, Yesterday, Previous 7 Days, Older.
 */
function groupThreads(threads = [], searchQuery = '') {
  const filtered = threads.filter(t => {
    if (!t.title) return false;
    if (searchQuery.trim()) {
      return t.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOf7DaysAgo = startOfToday - 7 * 86400000;

  const groups = {
    pinned: [],
    today: [],
    yesterday: [],
    previous7Days: [],
    older: [],
  };

  filtered.forEach(thread => {
    if (thread.is_pinned) {
      groups.pinned.push(thread);
      return;
    }

    const tTime = new Date(thread.updated_at || thread.created_at || Date.now()).getTime();

    if (tTime >= startOfToday) {
      groups.today.push(thread);
    } else if (tTime >= startOfYesterday) {
      groups.yesterday.push(thread);
    } else if (tTime >= startOf7DaysAgo) {
      groups.previous7Days.push(thread);
    } else {
      groups.older.push(thread);
    }
  });

  return groups;
}

export default function ChatHistorySidebar({
  threads = [],
  activeThread = null,
  onSelectThread,
  onNewChat,
  onDeleteThread,
  onRenameThread,
  onTogglePin,
  isOpen = true,
  onToggleOpen,
  darkMode = true,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const groups = useMemo(() => groupThreads(threads, searchQuery), [threads, searchQuery]);

  const handleStartRename = (e, thread) => {
    e.stopPropagation();
    setEditingThreadId(thread.id);
    setEditTitle(thread.title || 'Untitled Chat');
  };

  const handleSaveRename = (e, threadId) => {
    e?.stopPropagation();
    if (editTitle.trim()) {
      onRenameThread(threadId, editTitle.trim());
    }
    setEditingThreadId(null);
  };

  const handleCancelRename = (e) => {
    e?.stopPropagation();
    setEditingThreadId(null);
    setEditTitle('');
  };

  // If sidebar is collapsed into a rail icon
  if (!isOpen) {
    return (
      <div className={`w-14 border-r flex flex-col items-center py-4 transition-all shrink-0 z-20 ${
        darkMode ? 'bg-[#0e0e11] border-white/10' : 'bg-gray-100/80 border-gray-200'
      }`}>
        <button
          type="button"
          onClick={onToggleOpen}
          className={`p-2 rounded-xl transition-all mb-4 cursor-pointer ${
            darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-600'
          }`}
          title="Open Conversation History"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onNewChat}
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md hover:opacity-90 transition-all cursor-pointer"
          title="New Chat"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    );
  }

  const renderSection = (title, items, icon) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="mb-4">
        <div className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {icon}
          <span>{title}</span>
          <span className="text-[10px] opacity-70 ml-auto">({items.length})</span>
        </div>

        <div className="space-y-0.5 mt-1">
          {items.map(thread => {
            const isActive = activeThread?.id === thread.id;
            const isEditing = editingThreadId === thread.id;

            return (
              <div
                key={thread.id}
                onClick={() => !isEditing && onSelectThread(thread)}
                className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? darkMode
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                    : darkMode
                    ? 'text-gray-300 hover:bg-white/5 border border-transparent hover:border-white/5'
                    : 'text-gray-700 hover:bg-gray-200/60 border border-transparent hover:border-gray-200'
                }`}
              >
                {thread.is_pinned ? (
                  <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-current rotate-45" />
                ) : (
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                )}

                {isEditing ? (
                  <div className="flex-1 flex items-center gap-1 min-w-0" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveRename(e, thread.id);
                        if (e.key === 'Escape') handleCancelRename(e);
                      }}
                      autoFocus
                      className={`w-full px-2 py-0.5 rounded text-xs outline-none border ${
                        darkMode ? 'bg-[#18181b] border-blue-500 text-white' : 'bg-white border-blue-500 text-gray-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={e => handleSaveRename(e, thread.id)}
                      className="p-1 hover:text-emerald-400 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelRename}
                      className="p-1 hover:text-red-400 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 truncate text-left" title={thread.title}>
                      {thread.title || 'Untitled Conversation'}
                    </span>

                    {/* Relative Date / Time Badge (visible when NOT hovered) */}
                    <span className={`text-[10px] font-mono shrink-0 group-hover:hidden transition-all ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {formatThreadDate(thread.updated_at || thread.created_at)}
                    </span>

                    {/* Quick Hover Action Buttons */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onTogglePin(thread.id, thread.is_pinned);
                        }}
                        className={`p-1 rounded hover:bg-white/10 transition-colors cursor-pointer ${
                          thread.is_pinned ? 'text-amber-400' : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-800'
                        }`}
                        title={thread.is_pinned ? 'Unpin thread' : 'Pin to top'}
                      >
                        <Pin className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={e => handleStartRename(e, thread)}
                        className={`p-1 rounded hover:bg-white/10 transition-colors cursor-pointer ${
                          darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-800'
                        }`}
                        title="Rename conversation"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteThread(thread.id, e);
                        }}
                        className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside className={`w-72 border-r flex flex-col overflow-hidden shrink-0 transition-all z-20 ${
      darkMode ? 'bg-[#0f0f13] border-white/10' : 'bg-gray-50 border-gray-200'
    }`}>
      {/* Header with New Chat & Collapse toggle */}
      <div className={`p-3.5 border-b flex items-center justify-between gap-2 shrink-0 ${
        darkMode ? 'border-white/10' : 'border-gray-200'
      }`}>
        <button
          type="button"
          onClick={onNewChat}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm transition-all cursor-pointer"
          title="Start fresh conversation"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>

        <button
          type="button"
          onClick={onToggleOpen}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-600'
          }`}
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Instant Search Bar */}
      <div className="p-3 shrink-0">
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-colors ${
          darkMode ? 'bg-[#18181c] border-white/10 focus-within:border-white/20' : 'bg-white border-gray-200 focus-within:border-gray-300'
        }`}>
          <Search className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className={`w-full bg-transparent text-xs outline-none ${
              darkMode ? 'text-gray-200 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-0.5 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Conversation Timeline List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2.5 ${
              darkMode ? 'bg-white/5 text-gray-500' : 'bg-gray-200/60 text-gray-400'
            }`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No conversations yet
            </p>
            <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
              Start chatting to see your history here.
            </p>
          </div>
        ) : (
          <>
            {renderSection('Pinned', groups.pinned, <Pin className="w-3 h-3 text-amber-400" />)}
            {renderSection('Today', groups.today, <Clock className="w-3 h-3" />)}
            {renderSection('Yesterday', groups.yesterday, <Calendar className="w-3 h-3" />)}
            {renderSection('Previous 7 Days', groups.previous7Days, <Calendar className="w-3 h-3" />)}
            {renderSection('Older', groups.older, <Calendar className="w-3 h-3" />)}

            {searchQuery && (
              groups.pinned.length === 0 &&
              groups.today.length === 0 &&
              groups.yesterday.length === 0 &&
              groups.previous7Days.length === 0 &&
              groups.older.length === 0
            ) && (
              <p className={`text-xs text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                No conversations match "{searchQuery}"
              </p>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

