import { useState } from 'react';
import { Check, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const passwordRules = [
  { label: 'At least 8 characters', test: password => password.length >= 8 },
  { label: 'One uppercase letter', test: password => /[A-Z]/.test(password) },
  { label: 'One lowercase letter', test: password => /[a-z]/.test(password) },
  { label: 'One number', test: password => /\d/.test(password) },
  { label: 'One special character', test: password => /[^A-Za-z0-9]/.test(password) },
];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const { theme } = useTheme();
  const darkMode = theme === 'dark';

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const passwordChecks = passwordRules.map(rule => ({
    ...rule,
    valid: rule.test(password),
  }));
  const isStrongPassword = passwordChecks.every(rule => rule.valid);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    if (mode === 'login') {
      setLoading(true);
      const { error } = await signIn(cleanEmail, password);
      if (error) setError(error);
      setLoading(false);
      return;
    }

    if (mode === 'reset') {
      setLoading(true);
      const { error } = await resetPassword(cleanEmail);
      if (error) setError(error);
      else setSuccess('If an account exists, a password reset email has been sent.');
      setLoading(false);
      return;
    }

    // signup
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!isStrongPassword) {
      setError('Create a stronger password before signing up.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(cleanEmail, password, fullName);
    if (error) setError(error);
    else setSuccess('Account created! You can now log in.');
    setLoading(false);
  }

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${darkMode ? 'bg-[#0a0a0f]' : 'bg-gradient-to-br from-blue-50 via-white to-cyan-50'}`}>
      {/* Gradient background */}
      {darkMode && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#0d0a1a] to-[#0a0a0f]" />
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#4a2080]/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/4" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#2040a0]/15 rounded-full blur-[100px] translate-x-1/4 translate-y-1/4" />
        </>
      )}

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className={`${darkMode ? 'bg-[#111118]/90 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'} border rounded-2xl px-8 py-10 shadow-2xl`}>
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/image.png" alt="Netrootai" className="w-16 h-16 object-contain" />
          </div>

          <h1 className={`text-2xl font-semibold text-center mb-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {mode === 'login' ? 'Welcome to Netrootai Assistant' : 'Create your account'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className={`w-full border rounded-lg px-4 py-2.5 outline-none transition-colors text-sm ${darkMode ? 'bg-[#1a1a28] border-[#3b82f6]/40 focus:border-[#3b82f6] text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900 placeholder-gray-400'}`}
                  required
                />
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="you@example.com"
                className={`w-full border rounded-lg px-4 py-2.5 outline-none transition-colors text-sm ${darkMode ? 'bg-[#1a1a28] border-[#3b82f6]/40 focus:border-[#3b82f6] text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900 placeholder-gray-400'}`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (mode === 'signup') setError(null);
                  }}
                  placeholder={mode === 'signup' ? 'Create a strong password' : 'Password'}
                  className={`w-full border rounded-lg px-4 py-2.5 outline-none transition-colors text-sm pr-11 ${darkMode ? 'bg-[#1a1a28] border-white/10 focus:border-[#3b82f6]/60 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900 placeholder-gray-400'}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'signup' && (
                <div className={`mt-3 rounded-lg border px-3 py-3 ${darkMode ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Password must include:
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {passwordChecks.map(rule => (
                      <div
                        key={rule.label}
                        className={`flex items-center gap-2 text-xs ${rule.valid ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-gray-500' : 'text-gray-500')}`}
                      >
                        {rule.valid ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                        <span>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className={`text-sm rounded-lg px-3 py-2 ${darkMode ? 'text-red-400 bg-red-400/10 border border-red-400/20' : 'text-red-600 bg-red-50 border border-red-200'}`}>{error}</p>
            )}
            {success && (
              <p className={`text-sm rounded-lg px-3 py-2 ${darkMode ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : 'text-emerald-600 bg-emerald-50 border border-emerald-200'}`}>{success}</p>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'signup' && !isStrongPassword)}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm mt-1"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create account' : 'Send reset email'}
            </button>
          </form>

          <div className="mt-5 text-center space-y-2">
            {mode === 'login' ? (
              <>
                <button onClick={() => { setMode('reset'); setError(null); setSuccess(null); }} className={`text-sm transition-colors ${darkMode ? 'text-[#3b82f6] hover:text-[#60a5fa]' : 'text-blue-600 hover:text-blue-700'}`}>
                  Forgot your password?
                </button>
                {mode === 'reset' && (
                  <p className={`text-sm mt-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Enter your email and we'll send a password reset link.{' '}
                    <button onClick={() => { setMode('login'); setError(null); setSuccess(null); }} className={`ml-2 underline ${darkMode ? 'text-[#3b82f6]' : 'text-blue-600'}`}>Back to login</button>
                  </p>
                )}
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  Don't have an account?{' '}
                  <button
                    onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
                    className={`transition-colors ${darkMode ? 'text-[#3b82f6] hover:text-[#60a5fa]' : 'text-blue-600 hover:text-blue-700'}`}
                  >
                    Sign up
                  </button>
                </p>
              </>
            ) : (
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                  className={`transition-colors ${darkMode ? 'text-[#3b82f6] hover:text-[#60a5fa]' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  Log in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
