import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import API_BASE from '../lib/api';

const PlanContext = createContext({
  plan: 'free',
  planName: 'Free',
  accessExpired: false,
  planEndDate: null,
  autoRenew: false,
  featureAccess: {},
  loading: true,
  refresh: async () => { },
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

  async function fetchPlan() {
    if (!user?.email) {
      setPlan('free');
      setAccessExpired(false);
      setPlanEndDate(null);
      setAutoRenew(false);
      setFeatureAccess({});
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
    } catch {
      setPlan('free');
      setAccessExpired(false);
      setPlanEndDate(null);
      setAutoRenew(false);
      setFeatureAccess({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlan();
  }, [user]);

  const planName =
    plan === 'pro' ? 'NetRoot AI Pro' :
      plan === 'enterprise' ? 'NetRoot AI Enterprise' :
        'Free';

  return (
    <PlanContext.Provider value={{ plan, planName, loading, accessExpired, planEndDate, autoRenew, featureAccess, refresh: fetchPlan }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}
