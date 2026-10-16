import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function ResetPassword() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const darkMode = theme === 'dark';

    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [sessionReady, setSessionReady] = useState(false);

    useEffect(() => {
               supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setSessionReady(true);
            } else {
                setError(t('auth.invalidResetLink'));
            }
        });
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!password) {
            setError(t('auth.enterNewPassword'));
            return;
        }
        if (password !== confirm) {
            setError(t('auth.passwordsDoNotMatch'));
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            setError(error.message || t('auth.failedUpdatePassword'));
            setLoading(false);
            return;
        }

        setSuccess(t('auth.passwordUpdated'));
        setLoading(false);
        try { window.history.replaceState({}, document.title, '/login'); } catch (e) { }
    }

    return (
        <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${darkMode ? 'bg-[#0a0a0f]' : 'bg-gradient-to-br from-blue-50 via-white to-cyan-50'}`}>
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className={`${darkMode ? 'bg-[#111118]/90 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'} border rounded-2xl px-8 py-10 shadow-2xl`}>
                    <h1 className={`text-2xl font-semibold text-center mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('auth.resetPassword')}</h1>

                    <p className={`text-sm text-center mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('auth.resetPasswordInfo')}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('auth.newPassword')}</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder={t('auth.newPassword')}
                                className={`w-full border rounded-lg px-4 py-2.5 outline-none transition-colors text-sm ${darkMode ? 'bg-[#1a1a28] border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                required
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('auth.confirmPassword')}</label>
                            <input
                                type="password"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                placeholder={t('auth.confirmPassword')}
                                className={`w-full border rounded-lg px-4 py-2.5 outline-none transition-colors text-sm ${darkMode ? 'bg-[#1a1a28] border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                required
                            />
                        </div>

                        {error && <p className={`text-sm rounded-lg px-3 py-2 ${darkMode ? 'text-red-400 bg-red-400/10 border border-red-400/20' : 'text-red-600 bg-red-50 border border-red-200'}`}>{error}</p>}
                        {success && <p className={`text-sm rounded-lg px-3 py-2 ${darkMode ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : 'text-emerald-600 bg-emerald-50 border border-emerald-200'}`}>{success}</p>}

                        <button type="submit" disabled={loading || !sessionReady} className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm mt-1">
                            {loading ? t('auth.wait') : t('auth.updatePassword')}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
}
