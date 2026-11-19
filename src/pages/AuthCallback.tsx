import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

/**
 * Keycloak returns here. The OAuth code is exchanged during auth startup.
 * A saved route is restored by draft persistence; otherwise go home.
 */
const AuthCallback = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.ready) return;
    const timer = window.setTimeout(() => {
      if (!window.location.pathname.endsWith('/callback')) return;
      navigate('/', { replace: true });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [auth.ready, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Signing in…</p>
    </div>
  );
};

export default AuthCallback;
