import { useEffect } from "react";
import { useLocation } from "wouter";
import { resolveSecurePushNavigationPath } from "@/lib/pushNavigationGate";

/** Navegação in-app quando o usuário clica em push (postMessage do service worker). */
export function PushNavigationListener() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== "PUSH_NAVIGATE" || typeof data.path !== "string") return;

      void (async () => {
        const path = await resolveSecurePushNavigationPath(data.path);
        setLocation(path);
      })();
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [setLocation]);

  return null;
}
