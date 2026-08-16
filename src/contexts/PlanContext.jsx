import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import API_BASE from '../lib/api';

const PlanContext = createContext({
  plan: 'free',
  planName: 'Free',
  loading: true,
  refresh: async () => {},
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

  async function fetchPlan() {
    if (!user?.email) {
      setPlan('free');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/get-plan?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      setPlan(normalizePlan(data.plan));
    } catch {
      setPlan('free');
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
    <PlanContext.Provider value={{ plan, planName, loading, refresh: fetchPlan }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}
