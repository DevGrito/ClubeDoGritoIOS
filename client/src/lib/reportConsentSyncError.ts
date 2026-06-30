import { getAnonymousConsentId } from "@/lib/privacyConsentStorage";

export async function reportConsentSyncError(params: {
  message: string;
  httpStatus?: number;
  source?: string;
}) {
  try {
    await fetch("/api/privacy/consent/sync-error", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anonymous_consent_id: getAnonymousConsentId(),
        error_message: params.message.slice(0, 500),
        http_status: params.httpStatus ?? null,
        source: params.source ?? "web",
      }),
    });
  } catch {
    // telemetria best-effort
  }
}
