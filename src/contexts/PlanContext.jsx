import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import API_BASE from '../lib/api';

const PlanContext = createContext({
  plan: 'free',
  planName: 'Free',
  accessExpired: false,
  planEndDate: null,
  autoRenew: false,
  featureAccess: {},
  lifetimePptCount: 0,
  walletBalance: 0.00,
  loading: true,
  refresh: async () => { },
  refreshWallet: async () => { },
  setWalletBalance: () => { },
});

function normalizePlan(value) {
  if (value === 'pro') return 'pro';
  if (value === 'enterprise') return 'enterprise';
  return 'free';
}

export function PlanProvider({ children }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [accessExpired, setAccessExpired] = useState(false);
  const [planEndDate, setPlanEndDate] = useState(null);
  const [autoRenew, setAutoRenew] = useState(false);
  const [featureAccess, setFeatureAccess] = useState({});
  const [lifetimePptCount, setLifetimePptCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0.00);

  const fetchPlan = useCallback(async () => {
    if (!user?.email) {
      setPlan('free');
      setAccessExpired(false);
      setPlanEndDate(null);
      setAutoRenew(false);
      setFeatureAccess({});
      setLifetimePptCount(0);
      setWalletBalance(0.00);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/get-plan?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      setPlan(normalizePlan(data.plan));
      setAccessExpired(Boolean(data.access_expired));
      setPlanEndDate(data.current_period_end || null);
      setAutoRenew(Boolean(data.auto_renew));
      setFeatureAccess(data.feature_access || {});
      setLifetimePptCount(Number(data.lifetime_ppt_count || 0));
      if (data.wallet_balance !== undefined) {
        setWalletBalance(Number(data.wallet_balance) || 0.00);
      }
    } catch {
      setPlan('free');
      setAccessExpired(false);
      setPlanEndDate(null);
      setAutoRenew(false);
      setFeatureAccess({});
      setLifetimePptCount(0);
      setWalletBalance(0.00);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshWallet = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/wallet/balance?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.balance !== undefined) {
        setWalletBalance(Number(data.balance) || 0.00);
      }
    } catch (e) {
      console.warn('Failed to refresh wallet:', e.message);
    }
  }, [user]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const planName =
    plan === 'pro' ? 'NetRoot AI Pro' :
      plan === 'enterprise' ? 'NetRoot AI Enterprise' :
        'Free';

  return (
    <PlanContext.Provider value={{
      plan,
      planName,
      loading,
      accessExpired,
      planEndDate,
      autoRenew,
      featureAccess,
      lifetimePptCount,
      walletBalance,
      setWalletBalance,
      refresh: fetchPlan,
      refreshWallet,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}
