import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@shared/store/useAuthStore';

export function useRequireAuth(redirectTo?: string) {
  const navigate = useNavigate();
  const user = useAuthStore(s => s?.user);
  const isAuthenticated = useAuthStore(s => s?.isAuthenticated);
  const isBootstrapping = useAuthStore(s => s?.isBootstrapping);

  useEffect(() => {
    if (!isBootstrapping && (!isAuthenticated || !user)) {
      navigate(redirectTo ?? '/login', { replace: true });
    }
  }, [isAuthenticated, isBootstrapping, user, navigate, redirectTo]);

  return { user, isAuthenticated, isBootstrapping };
}

