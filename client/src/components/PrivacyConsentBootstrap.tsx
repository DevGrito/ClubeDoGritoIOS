import { useEffect } from "react";
import { useLocation } from "wouter";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { initConsentScriptLoader } from "@/lib/consentScriptLoader";

/** Rotas em que o banner de cookies não deve aparecer (login, fluxos sensíveis). */
function shouldSkipConsentBanner(path: string): boolean {
  return (
    path.includes("login") ||
    path.startsWith("/entrar") ||
    path.startsWith("/verify") ||
    path.startsWith("/verificar") ||
    path.startsWith("/codigo") ||
    path.startsWith("/splash") ||
    path.startsWith("/menor") ||
    path.startsWith("/aguardando-aprovacao") ||
    path.startsWith("/scanner-login") ||
    path === "/dev/login"
  );
}

/** Banner LGPD na primeira visita (sem consentimento salvo) + modal via evento global. */
export default function PrivacyConsentBootstrap() {
  const [location, setLocation] = useLocation();

  useEffect(() => initConsentScriptLoader(), []);

  if (shouldSkipConsentBanner(location)) return null;

  return <CookieConsentBanner onNavigate={setLocation} />;
}
