import { CONSENT_UPDATED_EVENT, hasConsent } from "@/lib/consentManager";

const SCRIPT_IDS = {
  analytics: "lgpd-script-analytics",
  marketing: "lgpd-script-marketing",
  functional: "lgpd-script-functional",
} as const;

function removeByCategory(category: "analytics" | "marketing" | "functional") {
  if (typeof document === "undefined") return;
  document
    .querySelectorAll(`script[data-lgpd-consent="${category}"]`)
    .forEach((node) => node.remove());
  const id = SCRIPT_IDS[category];
  const byId = document.getElementById(id);
  if (byId) byId.remove();
}

function injectExternalScript(
  id: string,
  src: string,
  category: "analytics" | "marketing" | "functional"
) {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.src = src;
  script.async = true;
  script.setAttribute("data-lgpd-consent", category);
  document.head.appendChild(script);
}

export function loadAnalyticsScripts() {
  if (!hasConsent("analytics")) {
    removeByCategory("analytics");
    return;
  }
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (!measurementId?.trim()) return;

  injectExternalScript(
    SCRIPT_IDS.analytics,
    `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`,
    "analytics"
  );

  if (!document.getElementById("lgpd-gtag-init")) {
    const inline = document.createElement("script");
    inline.id = "lgpd-gtag-init";
    inline.setAttribute("data-lgpd-consent", "analytics");
    inline.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId.replace(/'/g, "\\'")}');
    `;
    document.head.appendChild(inline);
  }
}

export function loadMarketingScripts() {
  if (!hasConsent("marketing")) {
    removeByCategory("marketing");
    return;
  }
  const pixelId = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
  if (!pixelId?.trim()) return;

  if (document.getElementById(SCRIPT_IDS.marketing)) return;

  const inline = document.createElement("script");
  inline.id = SCRIPT_IDS.marketing;
  inline.setAttribute("data-lgpd-consent", "marketing");
  inline.textContent = `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId.replace(/'/g, "\\'")}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(inline);
}

export function loadFunctionalScripts() {
  if (!hasConsent("functional")) {
    removeByCategory("functional");
    return;
  }
  // Slot para scripts funcionais (ex.: chat widget) via VITE_FUNCTIONAL_SCRIPT_URL
  const src = import.meta.env.VITE_FUNCTIONAL_SCRIPT_URL as string | undefined;
  if (!src?.trim()) return;
  injectExternalScript(SCRIPT_IDS.functional, src, "functional");
}

export function syncAllConsentScripts() {
  loadAnalyticsScripts();
  loadMarketingScripts();
  loadFunctionalScripts();
}

export function initConsentScriptLoader() {
  if (typeof window === "undefined") return () => {};
  syncAllConsentScripts();
  const handler = () => syncAllConsentScripts();
  window.addEventListener(CONSENT_UPDATED_EVENT, handler);
  return () => window.removeEventListener(CONSENT_UPDATED_EVENT, handler);
}
