import { useEffect, useState } from 'react';
import { backendClient } from '../services/backend';

export function useEntitlements(userId: string = 'demo-user') {
  const [entitlements, setEntitlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await backendClient.fetchEntitlements(userId);
      setEntitlements(data.entitlements || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load entitlements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [userId]);

  return { entitlements, loading, error, refresh };
}
