import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuthSession } from '@/hooks/useAuthSession';
import { fetchAuthSessionAndSyncCache, syncSessionToLocalStorage, type AuthSessionPayload } from '@/lib/auth-session';
import { queryClient } from '@/lib/queryClient';
import { isLeoByRole } from '@shared/conselho';
import {
  DONOR_APP_ROUTES,
  ROLE_TO_ALLOWED_ROUTES,
  PUBLIC_ROUTES,
  DEV_ROLES,
  normalizeRbacRole,
  getDefaultRouteForRole,
} from '@/lib/rbac-routes';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  routeName: string;
}

const SESSION_RETRY_ATTEMPTS = 3;
const SESSION_RETRY_DELAY_MS = 120;

async function resolveSessionWithRetry(
  initialSession: AuthSessionPayload | null | undefined
): Promise<AuthSessionPayload | null> {
  if (initialSession?.id) return initialSession;

  for (let attempt = 0; attempt < SESSION_RETRY_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, SESSION_RETRY_DELAY_MS * attempt));
    }
    const fresh = await fetchAuthSessionAndSyncCache();
    if (fresh?.id) {
      queryClient.setQueryData(['/api/auth/session'], fresh);
      return fresh;
    }
  }
  return null;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  routeName
}) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: session, isLoading, isFetched } = useAuthSession();
  const [allowed, setAllowed] = useState(false);
  const [sessionResolved, setSessionResolved] = useState(false);
  const [effectiveSession, setEffectiveSession] = useState<AuthSessionPayload | null | undefined>(undefined);

  useEffect(() => {
    if (!isFetched && isLoading) return;

    let cancelled = false;
    setSessionResolved(false);

    (async () => {
      const resolved = await resolveSessionWithRetry(session);
      if (cancelled) return;
      setEffectiveSession(resolved);
      setSessionResolved(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [session, isFetched, isLoading, routeName]);

  useEffect(() => {
    if (!sessionResolved) return;

    if (PUBLIC_ROUTES.includes(routeName)) {
      setAllowed(true);
      return;
    }

    // SEC-008: autorização só com sessão backend confirmada
    if (!effectiveSession?.id) {
      toast({
        title: "Acesso negado",
        description: "Você precisa fazer login para acessar esta área.",
        variant: "destructive",
      });
      if (routeName?.startsWith('/coordenador')) {
        setLocation('/login/coordenador');
      } else if (routeName?.startsWith('/professor/')) {
        setLocation('/login/professor');
      } else if (routeName?.startsWith('/monitor')) {
        setLocation('/login/monitor');
      } else {
        setLocation('/entrar');
      }
      setAllowed(false);
      return;
    }

    syncSessionToLocalStorage(effectiveSession);

    const userPapel = normalizeRbacRole(effectiveSession.papel || effectiveSession.role || '');
    if (!userPapel) {
      setLocation('/entrar');
      setAllowed(false);
      return;
    }

    if (DEV_ROLES.has(userPapel)) {
      setAllowed(true);
      return;
    }

    const hasActiveSubscription = localStorage.getItem('hasActiveSubscription') === 'true';
    const isAdminOnlyRole = [
      'professor', 'professor_lider', 'lider',
      'monitor', 'monitor_pec', 'monitor_inclusao', 'monitor_psico',
      'coordenador', 'coordenador_inclusao', 'coordenador_pec', 'coordenador_psico', 'tecnica_psico',
      'conselho', 'conselheiro',
      'admin', 'super_admin', 'desenvolvedor', 'developer', 'dev',
      'marketing', 'gestor_setor', 'gestor_projeto',
      'oficineiro', 'oficineiro_pec', 'aluno', 'patrocinador',
    ].includes(userPapel);

    const isDonorRoute = DONOR_APP_ROUTES.includes(routeName);

    if (isDonorRoute && !isAdminOnlyRole && !hasActiveSubscription) {
      toast({
        title: "Assinatura inativa",
        description: "Sua assinatura precisa ser reativada para acessar esta área.",
        variant: "destructive",
      });
      setLocation('/assinatura-pausada');
      setAllowed(false);
      return;
    }

    if (isLeoByRole(userPapel) && routeName === '/leo-martins') {
      setAllowed(true);
      return;
    }

    const userAllowedRoutes = ROLE_TO_ALLOWED_ROUTES[userPapel] || [];
    const hasPermission =
      allowedRoles.includes(userPapel) || userAllowedRoutes.includes(routeName);

    if (!hasPermission) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      setLocation(getDefaultRouteForRole(userPapel));
      setAllowed(false);
      return;
    }

    setAllowed(true);
  }, [
    allowedRoles,
    routeName,
    effectiveSession,
    sessionResolved,
    setLocation,
    toast,
  ]);

  if (!isFetched || isLoading || !sessionResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
