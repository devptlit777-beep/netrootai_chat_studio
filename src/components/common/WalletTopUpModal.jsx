import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Zap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Loader2,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import API_BASE from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePlan } from '../../contexts/PlanContext';

const PRESETS = [5, 10, 25, 50, 100];

export default function WalletTopUpModal({ isOpen, onClose, darkMode = true, requiredAmount = null }) {
  const { user } = useAuth();
  const { walletBalance } = usePlan();
  
  const [selectedAmount, setSelectedAmount] = useState(
    requiredAmount && requiredAmount > 5 ? Math.ceil(requiredAmount) : 10
  );
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const currentBalance = Number(walletBalance || 0);
  const amountToCharge = isCustom ? Number(customAmount || 0) : selectedAmount;
  const newBalance = currentBalance + (amountToCharge > 0 ? amountToCharge : 0);

  const handlePresetSelect = (amt) => {
    setIsCustom(false);
    setSelectedAmount(amt);
    setCustomAmount('');
    setError(null);
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setIsCustom(true);
    setCustomAmount(val);
    setError(null);
  };

  const handleCheckout = async () => {
    if (!user?.email) {
      setError('Please sign in to add model credits.');
      return;
    }
    if (amountToCharge < 1) {
      setError('Minimum top-up amount is $1.00.');
      return;
    }
    if (amountToCharge > 1000) {
      setError('Maximum single top-up amount is $1,000.00.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/wallet/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          amount: amountToCharge,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to initialize payment.');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Stripe checkout URL not returned.');
      }
    } catch (err) {
      setError(err.message || 'Payment initiation failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl p-6 sm:p-7 overflow-hidden transition-all z-10 ${
          darkMode ? 'bg-[#121212] border-[#262626] text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Add Model Credits</h2>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Prepaid balance for pay-per-token frontier AI models & media
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className={`p-1.5 rounded-xl border transition-colors ${
              darkMode ? 'border-[#2a2a2a] hover:bg-[#1f1f1f] text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Balance Bar */}
        <div
          className={`mt-5 p-4 rounded-2xl border flex items-center justify-between ${
            darkMode ? 'bg-[#181818] border-[#222]' : 'bg-gray-50 border-gray-100'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-mono">Current Balance</span>
            <div className="text-xl font-extrabold text-blue-400 mt-0.5">
              ${currentBalance.toFixed(2)}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-500" />
          <div className="text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-mono">After Top-Up</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
              ${newBalance.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Quick Amount Presets */}
        <div className="mt-5">
          <label className={`block text-xs font-semibold mb-2.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Select Top-Up Amount (USD)
          </label>
          <div className="grid grid-cols-5 gap-2">
            {PRESETS.map((amt) => {
              const active = !isCustom && selectedAmount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePresetSelect(amt)}
                  className={`py-3 rounded-2xl text-sm font-bold border transition-all flex flex-col items-center justify-center ${
                    active
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
                      : darkMode
                      ? 'bg-[#181818] border-[#2a2a2a] text-gray-300 hover:border-gray-600 hover:bg-[#202020]'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>${amt}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Amount Field */}
          <div className="mt-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="1"
                max="1000"
                step="1"
                placeholder="Or enter custom amount (e.g. 15)"
                value={customAmount}
                onChange={handleCustomChange}
                className={`w-full pl-9 pr-4 py-2.5 rounded-2xl text-xs font-semibold border outline-none transition-all ${
                  isCustom && amountToCharge >= 1
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : darkMode
                    ? 'bg-[#181818] border-[#2a2a2a] text-white placeholder-gray-500 focus:border-blue-500'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Benefits bullets */}
        <div className={`mt-5 p-3.5 rounded-2xl border space-y-2 text-xs ${
          darkMode ? 'bg-[#161616] border-[#202020] text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Credits never expire and roll over automatically.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Pay strictly per prompt tokens (Claude 3.5, GPT-4o, Flux, Kling, etc.).</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Encrypted checkout powered by Stripe. Zero hidden platform fees.</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading || amountToCharge < 1}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Redirecting to Stripe...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white text-white" />
                <span>Add ${amountToCharge > 0 ? amountToCharge.toFixed(2) : '0.00'} Credits</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

