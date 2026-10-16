import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import {
  Upload,
  Trash2,
  Download,
  FileText,
  Image,
  File,
  X,
  Loader2,
  Search,
  ArrowUpDown,
  FileType,
  Clock,
  HardDrive,
} from 'lucide-react';

const MAX_STORAGE_BYTES = 256 * 1024 * 1024;

export default function StoragePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const darkMode = theme === 'dark';

  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const loadAttachments = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setAttachments(data || []);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadAttachments();
  }, [loadAttachments]);

  async function handleUpload(fileList) {
    if (!fileList || !user) return;

    const files = Array.from(fileList);
    if (files.length === 0) return;

    const currentUsedSize = attachments.reduce((sum, attachment) => sum + (attachment.size_bytes || 0), 0);
    const totalSelectedSize = files.reduce((sum, file) => sum + file.size, 0);

    if (currentUsedSize + totalSelectedSize > MAX_STORAGE_BYTES) {
      const remainingBytes = Math.max(0, MAX_STORAGE_BYTES - currentUsedSize);
      setError(t('storage.uploadLimitError', { max: formatBytes(MAX_STORAGE_BYTES), remaining: formatBytes(remainingBytes) }));
      return;
    }

    setUploading(true);
    setError(null);

    let usedBytes = currentUsedSize;

    for (const file of files) {
      const remainingBytes = MAX_STORAGE_BYTES - usedBytes;
      if (file.size > remainingBytes) {
        setError(t('storage.fileTooLarge', { remaining: formatBytes(remainingBytes) }));
        setUploading(false);
        return;
      }

      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        setError(uploadError.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(path);

      const { error: insertError } = await supabase.from('attachments').insert({
        name: file.name,
        file_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
        storage_path: path,
        url: urlData.publicUrl,
      });

      if (insertError) {
        setError(insertError.message);
        setUploading(false);
        return;
      }

      usedBytes += file.size;
    }

    setUploading(false);
    await loadAttachments();
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDelete(id, storagePath) {
    setDeleting(id);
    await supabase.storage.from('attachments').remove([storagePath]);
    await supabase.from('attachments').delete().eq('id', id);
    setAttachments(prev => prev.filter(a => a.id !== id));
    setDeleting(null);
  }

  async function handleDownload(attachment) {
    const { data, error } = await supabase.storage
      .from('attachments')
      .createSignedUrl(attachment.storage_path, 60);

    if (error || !data) return;

    const link = document.createElement('a');
    link.href = data.signedUrl;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filtered = attachments.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') cmp = a.name.localeCompare(b.name);
    if (sortField === 'size') cmp = a.size_bytes - b.size_bytes;
    if (sortField === 'created_at') {
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalSize = attachments.reduce((sum, a) => sum + a.size_bytes, 0);
  const remainingStorageBytes = Math.max(0, MAX_STORAGE_BYTES - totalSize);
  const storageUsagePercent = Math.min(100, (totalSize / MAX_STORAGE_BYTES) * 100);

  const toggleSort = field => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0e0e0e] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('storage.title')}
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {attachments.length} {attachments.length === 1 ? t('storage.file') : t('storage.files')} · {formatBytes(totalSize)} {t('storage.usedOf')} {formatBytes(MAX_STORAGE_BYTES)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`h-2 w-32 rounded-full overflow-hidden ${darkMode ? 'bg-[#222]' : 'bg-gray-200'}`}>
                <div className="h-2 rounded-full bg-[#3b82f6]" style={{ width: `${storageUsagePercent}%` }} />
              </div>
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatBytes(remainingStorageBytes)} {t('storage.left')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-300'}`}>
              <Search className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('storage.search')}
                className={`bg-transparent text-sm outline-none w-48 ${darkMode ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`} />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={e => handleUpload(e.target.files)}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || remainingStorageBytes <= 0}
              className="flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-60 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? t('storage.uploading') : t('storage.upload')}
            </button>
          </div>
        </div>

        {error && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-3 mb-6 text-sm ${darkMode ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            <X className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div
          onDragOver={e => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            handleUpload(e.dataTransfer.files);
          }}
          className={`rounded-2xl border-2 border-dashed mb-8 transition-all flex flex-col items-center justify-center py-12 px-6 ${dragOver
              ? darkMode
                ? 'border-[#3b82f6] bg-[#3b82f6]/5'
                : 'border-blue-500 bg-blue-50'
              : darkMode
                ? 'border-[#2a2a2a] bg-[#111111]'
                : 'border-gray-300 bg-white'
            }`}
        >
          <Upload className={`w-8 h-8 mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('storage.dropFiles')}
          </p>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            {t('storage.perUserLimit')} {formatBytes(MAX_STORAGE_BYTES)} total · {formatBytes(remainingStorageBytes)} {t('storage.remaining')}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className={`w-6 h-6 animate-spin ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
        ) : sorted.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${darkMode ? 'border-[#222] bg-[#111111]' : 'border-gray-200 bg-white'}`}>
            <HardDrive className={`w-12 h-12 mb-4 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              {searchQuery ? t('storage.noSearchResults') : t('storage.noFiles')}
            </p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              {searchQuery ? t('storage.tryDifferentSearch') : t('storage.firstUpload')}
            </p>
          </div>
        ) : (
          <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'border-[#222] bg-[#111111]' : 'border-gray-200 bg-white'}`}>
            <div className={`grid grid-cols-[1fr_120px_160px_120px] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b ${darkMode ? 'border-[#222] text-gray-500' : 'border-gray-200 text-gray-500'}`}>
              <button
                onClick={() => toggleSort('name')}
                className="flex items-center gap-1.5 hover:text-gray-700 transition-colors text-left"
              >
                <FileType className="w-3.5 h-3.5" />
                {t('storage.name')}
                <ArrowUpDown className={`w-3 h-3 transition-transform ${sortField === 'name' ? (darkMode ? 'text-[#3b82f6]' : 'text-blue-500') : 'opacity-30'}`} />
              </button>

              <button
                onClick={() => toggleSort('size')}
                className="flex items-center gap-1.5 hover:text-gray-700 transition-colors text-left"
              >
                <HardDrive className="w-3.5 h-3.5" />
                {t('storage.size')}
                <ArrowUpDown className={`w-3 h-3 transition-transform ${sortField === 'size' ? (darkMode ? 'text-[#3b82f6]' : 'text-blue-500') : 'opacity-30'}`} />
              </button>

              <button
                onClick={() => toggleSort('created_at')}
                className="flex items-center gap-1.5 hover:text-gray-700 transition-colors text-left"
              >
                <Clock className="w-3.5 h-3.5" />
                {t('storage.date')}
                <ArrowUpDown className={`w-3 h-3 transition-transform ${sortField === 'created_at' ? (darkMode ? 'text-[#3b82f6]' : 'text-blue-500') : 'opacity-30'}`} />
              </button>

              <span className="text-right">{t('storage.actions')}</span>
            </div>

            <div className="divide-y">
              {sorted.map(attachment => (
                <div
                  key={attachment.id}
                  className={`grid grid-cols-[1fr_120px_160px_120px] gap-4 px-5 py-3.5 items-center transition-colors ${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileIcon mimeType={attachment.file_type} darkMode={darkMode} />
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {attachment.name}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        {attachment.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
                      </p>
                    </div>
                  </div>

                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatBytes(attachment.size_bytes)}
                  </p>

                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {formatDate(attachment.created_at, i18n.resolvedLanguage)}
                  </p>

                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleDownload(attachment)}
                      title={t('storage.download')}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${darkMode ? 'text-gray-500 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(attachment.id, attachment.storage_path)}
                      disabled={deleting === attachment.id}
                      title={t('storage.delete')}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${darkMode ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                    >
                      {deleting === attachment.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FileIcon({ mimeType, darkMode }) {
  const color = darkMode ? 'text-gray-500' : 'text-gray-400';

  if (mimeType.startsWith('image/')) {
    return <Image className={`w-5 h-5 shrink-0 ${color}`} />;
  }

  if (mimeType.startsWith('text/')) {
    return <FileText className={`w-5 h-5 shrink-0 ${color}`} />;
  }

  return <File className={`w-5 h-5 shrink-0 ${color}`} />;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatDate(iso, locale) {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}