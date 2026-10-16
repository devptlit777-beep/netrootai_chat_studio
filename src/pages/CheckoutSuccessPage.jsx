import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2, XCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { usePlan } from '../contexts/PlanContext';
import { useAuth } from '../contexts/AuthContext';
import API_BASE from '../lib/api';
import { useTranslation } from 'react-i18next';

export default function CheckoutSuccessPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = usePlan();
  const { user, profile } = useAuth();

  const sessionId = searchParams.get('session_id');
  const planId = searchParams.get('plan') || 'pro';
  const planName = planId.charAt(0).toUpperCase() + planId.slice(1);

  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setErrorMsg(t('checkout.noSession'));
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`${API_BASE}/api/verify-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus('error');
          setErrorMsg(data.error || t('checkout.verificationFailed'));
          return;
        }
        // Refresh plan in context so UI updates immediately
        await refresh();
        // Send Pro upgrade email (best-effort)
        fetch(`${API_BASE}/api/send-pro-upgrade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user?.email,
            full_name: profile?.full_name || user?.user_metadata?.full_name,
          }),
        }).catch(() => {});
        setStatus('success');
      } catch (e) {
        setStatus('error');
        setErrorMsg(t('checkout.networkError'));
      }
    }

    verify();
  }, [sessionId]);

  // Countdown only starts after success
  useEffect(() => {
    if (status !== 'success') return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (countdown === 0) navigate('/dashboard');
  }, [countdown, navigate]);

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${darkMode ? 'bg-[#0e0e0e]' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-md text-center border rounded-2xl p-10 shadow-2xl ${darkMode ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>

        {status === 'verifying' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              </div>
            </div>
            <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('checkout.activating')}
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('checkout.verifying')}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
            </div>
            <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('checkout.activatedHeading', { plan: planName })}
            </h1>
            <p className={`text-sm mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('checkout.planActivated')}
            </p>
            <div className={`rounded-xl border p-4 mb-8 ${darkMode ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200'}`}>
              <p className={`text-sm font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {t('checkout.activatedSuccessfully')}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center gap-2 w-full bg-white hover:bg-gray-100 text-black font-medium px-6 py-3 rounded-xl text-sm transition-colors"
              >
                {t('checkout.dashboard')}
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                {t('checkout.redirecting', { count: countdown })}
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
            </div>
            <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('checkout.activationFailed')}
            </h1>
            <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {errorMsg}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center gap-2 w-full bg-white hover:bg-gray-100 text-black font-medium px-6 py-3 rounded-xl text-sm transition-colors"
            >
              {t('checkout.dashboard')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

      </div>
    </div>
  );
}
