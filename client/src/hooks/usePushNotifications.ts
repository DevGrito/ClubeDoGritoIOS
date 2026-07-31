import { useEffect, useState, useCallback, useRef } from 'react';
import { onMessage } from 'firebase/messaging';
import { readPushFcmData } from '@shared/pushFcmData';
import { resolveMessaging, requestPushPermissionAndGetToken, clearPushTokenCache, fullResetPushSubscription, getWebPushSubscriptionKeys } from '@/lib/firebase';
import { iosPushNeedsHomeScreen } from '@/utils/device';
import { useToast } from '@/hooks/use-toast';

function isIncognito(): boolean {
  try {
    // Chrome/Edge: storage quota é 0 em incognito
    const fs = (window as any).RequestFileSystem || (window as any).webkitRequestFileSystem;
    if (!fs) return false;
    // Heurística via sessionStorage disponível mas localStorage limitado não é confiável;
    // usamos a ausência de IndexedDB persistente como sinal
    return !window.indexedDB;
  } catch {
    return false;
  }
}

interface PushState {
  permission: NotificationPermission | 'unsupported';
  token: string | null;
  loading: boolean;
  error: string | null;
  activeDevices: number;
  pushOptedOut: boolean;
}

type RegisterTokenResult = { ok: boolean; needsRefresh: boolean };

export function usePushNotifications(userKey: string | null, userType: string | null, userName?: string | null, onAutoRegistered?: () => void) {
  const { toast } = useToast();
  const [state, setState] = useState<PushState>({
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
    token: null,
    loading: false,
    error: null,
    activeDevices: 0,
    pushOptedOut: false,
  });

  const readOptedOut = useCallback(() => {
    if (!userKey) return false;
    return localStorage.getItem(`push_opt_out_${userKey}`) === '1';
  }, [userKey]);

  const optedOutRef = useRef(readOptedOut());
  const prevUserKeyRef = useRef<string | null>(null);
  useEffect(() => {
    optedOutRef.current = readOptedOut();
  }, [readOptedOut, userKey]);

  const registerToken = useCallback(async (token: string, userConsent = false): Promise<RegisterTokenResult> => {
    if (!userKey || !userType) return { ok: false, needsRefresh: false };
    try {
      const subKeys = await getWebPushSubscriptionKeys();
      const res = await fetch('/api/push/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token,
          userKey,
          userType,
          platform: 'web',
          nome: userName || null,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 512) : null,
          pushEndpoint: subKeys.pushEndpoint,
          pushP256dh: subKeys.pushP256dh,
          pushAuth: subKeys.pushAuth,
          userConsent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('[Push] Registro rejeitado:', data.error || res.status);
        return { ok: false, needsRefresh: false };
      }
      if (data.needsRefresh) {
        console.warn('[Push] Token rejeitado pelo servidor (stale), forçando renovação...');
        return { ok: false, needsRefresh: true };
      }
      return { ok: true, needsRefresh: false };
    } catch (err) {
      console.error('[Push] Erro ao registrar token:', err);
      return { ok: false, needsRefresh: false };
    }
  }, [userKey, userType, userName]);

  const refreshStatus = useCallback(async () => {
    if (!userKey) {
      setState(s => ({ ...s, activeDevices: 0, pushOptedOut: readOptedOut() }));
      return { activeDevices: 0 };
    }
    const optedOut = readOptedOut();
    try {
      const res = await fetch('/api/push/status', { credentials: 'include' });
      if (!res.ok) {
        setState(s => ({ ...s, activeDevices: 0, pushOptedOut: optedOut }));
        return { activeDevices: 0 };
      }
      const data = await res.json();
      const count = data.activeDevices ?? 0;
      const optedOutNow = readOptedOut();
      optedOutRef.current = optedOutNow;
      if (count > 0 && !optedOutNow) {
        localStorage.setItem(`push_registered_${userKey}`, '1');
      }
      setState(s => ({
        ...s,
        activeDevices: optedOutNow ? 0 : count,
        pushOptedOut: optedOutNow,
      }));
      return data;
    } catch {
      setState(s => ({ ...s, activeDevices: 0, pushOptedOut: optedOut }));
      return { activeDevices: 0 };
    }
  }, [userKey, readOptedOut]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (state.permission === 'unsupported') return false;
    if (iosPushNeedsHomeScreen()) {
      const msg = 'No iPhone, adicione o app à Tela de Início (ícone Compartilhar → Adicionar à Tela de Início) e abra por lá para ativar notificações.';
      setState(s => ({ ...s, error: msg }));
      toast({ title: 'Instale na Tela de Início', description: msg, variant: 'destructive' });
      return false;
    }
    if (!('serviceWorker' in navigator)) {
      toast({ title: 'Notificações indisponíveis', description: 'Seu navegador não suporta notificações push.', variant: 'destructive' });
      return false;
    }
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const reactivating = readOptedOut();
      const token = await requestPushPermissionAndGetToken(reactivating);
      if (token) {
        let reg = await registerToken(token, true);
        if (reg.needsRefresh) {
          const newToken = await requestPushPermissionAndGetToken(true);
          reg = newToken ? await registerToken(newToken, true) : { ok: false, needsRefresh: false };
        }
        if (!reg.ok) {
          const errMsg = 'Não foi possível registrar este dispositivo. Tente novamente.';
          setState(s => ({ ...s, loading: false, error: errMsg }));
          toast({ title: 'Erro ao ativar notificações', description: errMsg, variant: 'destructive' });
          return false;
        }
        if (userKey) {
          localStorage.removeItem(`push_opt_out_${userKey}`);
          localStorage.setItem(`push_registered_${userKey}`, '1');
        }
        optedOutRef.current = false;
        const status = await refreshStatus();
        setState(s => ({
          ...s,
          token,
          permission: 'granted',
          loading: false,
          pushOptedOut: false,
          activeDevices: status?.activeDevices ?? 0,
        }));
        onAutoRegistered?.();
        window.dispatchEvent(new Event('push-state-changed'));
        return true;
      } else {
        const perm = Notification.permission as NotificationPermission;
        let errMsg: string;
        if (perm === 'denied') {
          errMsg = 'Notificações bloqueadas no navegador. Libere nas configurações do site.';
        } else if (isIncognito()) {
          errMsg = 'Modo anônimo pode bloquear notificações. Tente em uma janela normal do navegador.';
        } else {
          errMsg = 'Não foi possível ativar as notificações. Tente novamente.';
        }
        setState(s => ({ ...s, permission: perm, loading: false, error: errMsg }));
        toast({ title: 'Erro ao ativar notificações', description: errMsg, variant: 'destructive' });
        return false;
      }
    } catch (err: any) {
      const errName: string = err?.name || '';
      const errMsg = (errName === 'AbortError' || String(err?.message).toLowerCase().includes('push service'))
        ? isIncognito()
          ? 'Modo anônimo bloqueia notificações. Abra em uma janela normal do navegador.'
          : 'Serviço de push indisponível. Verifique sua conexão e tente novamente.'
        : (err.message || 'Erro ao ativar notificações.');
      setState(s => ({ ...s, loading: false, error: errMsg }));
      toast({ title: 'Erro ao ativar notificações', description: errMsg, variant: 'destructive' });
      return false;
    }
  }, [state.permission, registerToken, toast, onAutoRegistered, userKey, readOptedOut, refreshStatus]);

  const syncRegisteredFlagWithServer = useCallback(async (): Promise<boolean> => {
    if (!userKey) return false;
    try {
      const res = await fetch('/api/push/status', { credentials: 'include' });
      if (!res.ok) return false;
      const data = await res.json();
      if ((data.activeDevices ?? 0) > 0 && !localStorage.getItem(`push_opt_out_${userKey}`)) {
        localStorage.setItem(`push_registered_${userKey}`, '1');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [userKey]);

  const disablePush = useCallback(async (): Promise<boolean> => {
    if (!userKey) return false;
    // Bloqueia re-registro automático antes de qualquer await
    optedOutRef.current = true;
    localStorage.setItem(`push_opt_out_${userKey}`, '1');
    localStorage.removeItem(`push_registered_${userKey}`);
    setState(s => ({
      ...s,
      loading: true,
      error: null,
      pushOptedOut: true,
      activeDevices: 0,
    }));

    try {
      const res = await fetch('/api/push/opt-out', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: state.token || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao desativar no servidor');
      }
      await fullResetPushSubscription();
      setState(s => ({
        ...s,
        token: null,
        loading: false,
        pushOptedOut: true,
        activeDevices: 0,
        permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
      }));
      window.dispatchEvent(new Event('push-state-changed'));
      toast({ title: 'Notificações desativadas', description: 'Você não receberá pushes neste dispositivo até ativar novamente.' });
      return true;
    } catch (err: any) {
      setState(s => ({ ...s, loading: false, error: err?.message || 'Erro ao desativar' }));
      toast({
        title: 'Erro ao desativar',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      });
      return false;
    }
  }, [userKey, state.token, toast]);

  // Força re-registro: limpa cache, cancela assinatura existente e obtém token novo
  const forceReRegister = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      clearPushTokenCache();
      const token = await requestPushPermissionAndGetToken(true);
      if (token) {
        await registerToken(token, true);
        setState(s => ({ ...s, token, permission: 'granted', loading: false }));
        return token;
      } else {
        setState(s => ({ ...s, loading: false }));
        return null;
      }
    } catch (err: any) {
      setState(s => ({ ...s, loading: false, error: err.message }));
      return null;
    }
  }, [registerToken]);

  useEffect(() => {
    if (!userKey || !userType) return;
    if (typeof Notification === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    const accountSwitched =
      prevUserKeyRef.current != null && prevUserKeyRef.current !== userKey;
    prevUserKeyRef.current = userKey;
    if (localStorage.getItem(`push_opt_out_${userKey}`) || optedOutRef.current) return;
    if (Notification.permission === 'granted') {
      const userConsent = accountSwitched;
      requestPushPermissionAndGetToken().then(async token => {
        if (optedOutRef.current || localStorage.getItem(`push_opt_out_${userKey}`)) return;
        if (token) {
          let reg = await registerToken(token, userConsent);
          if (optedOutRef.current || localStorage.getItem(`push_opt_out_${userKey}`)) return;
          if (reg.needsRefresh) {
            const newToken = await requestPushPermissionAndGetToken(true);
            if (optedOutRef.current || localStorage.getItem(`push_opt_out_${userKey}`)) return;
            if (newToken) {
              reg = await registerToken(newToken, userConsent);
              if (optedOutRef.current || localStorage.getItem(`push_opt_out_${userKey}`)) return;
              if (reg.ok) {
                setState(s => ({ ...s, token: newToken, permission: 'granted' }));
                await refreshStatus();
              }
            } else {
              const hasServerDevice = await syncRegisteredFlagWithServer();
              if (!hasServerDevice) {
                localStorage.removeItem(`push_registered_${userKey}`);
              } else {
                await refreshStatus();
              }
            }
          } else if (reg.ok) {
            if (optedOutRef.current || localStorage.getItem(`push_opt_out_${userKey}`)) return;
            setState(s => ({ ...s, token, permission: 'granted' }));
            await refreshStatus();
          }
        } else {
          const hasServerDevice = await syncRegisteredFlagWithServer();
          if (!hasServerDevice) {
            localStorage.removeItem(`push_registered_${userKey}`);
          } else {
            setState(s => ({ ...s, permission: 'granted' }));
            await refreshStatus();
          }
        }
      });
    }
  }, [userKey, userType, registerToken, syncRegisteredFlagWithServer, refreshStatus]);

  useEffect(() => {
    if (!userKey) return;
    setState(s => ({ ...s, pushOptedOut: readOptedOut() }));
    refreshStatus();
  }, [userKey, readOptedOut, refreshStatus]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    resolveMessaging().then(msg => {
      if (!msg) return;
      cleanup = onMessage(msg, async (payload) => {
        const fromData = readPushFcmData(payload.data);
        const title = payload.notification?.title || fromData.title || 'Clube do Grito';
        const body  = payload.notification?.body  || fromData.body  || '';
        const url   = fromData.url;

        // Mostra notificação nativa via SW quando o app está visível (foreground).
        // Em background o firebase-messaging-sw.js exibe via onBackgroundMessage.
        if (document.visibilityState !== 'visible') return;
        if (Notification.permission !== 'granted') return;
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          const reg = regs.find(r =>
            r.active?.scriptURL?.includes('firebase-messaging-sw.js')
          ) ?? await navigator.serviceWorker.ready;
          const origin = window.location.origin;
          const clickPath = url
            ? (/^https?:\/\//i.test(url)
              ? (() => {
                  try {
                    const parsed = new URL(url);
                    return parsed.pathname + parsed.search + parsed.hash;
                  } catch {
                    return '/';
                  }
                })()
              : url.startsWith('/') ? url : `/${url}`)
            : undefined;
          reg.showNotification(title, {
            body,
            icon: `${origin}/icons/icon-192.png`,
            ...(clickPath ? { data: { url: clickPath } } : {}),
          });
        } catch { /* silencioso */ }
      });
    });
    return () => cleanup?.();
  }, [toast]);

  const pushEnabled = state.activeDevices > 0 && !readOptedOut();

  return { ...state, pushEnabled, requestPermission, forceReRegister, disablePush, refreshStatus };
}
