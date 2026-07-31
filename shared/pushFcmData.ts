/** Chaves do payload FCM data (evita colisão com campos reservados title/body). */
export const PUSH_FCM_DATA_KEYS = {
  title: "cdg_title",
  body: "cdg_body",
  url: "cdg_url",
} as const;

export function buildPushFcmDataFields(
  title: string,
  body: string,
  clickUrl?: string | null
): Record<string, string> {
  const data: Record<string, string> = {
    [PUSH_FCM_DATA_KEYS.title]: title,
    [PUSH_FCM_DATA_KEYS.body]: body,
    // legado — alguns SW antigos ainda leem title/body/url
    title,
    body,
  };
  if (clickUrl) {
    data[PUSH_FCM_DATA_KEYS.url] = clickUrl;
    data.url = clickUrl;
  }
  return data;
}

export function readPushFcmData(
  data?: Record<string, string | undefined> | null
): { title: string; body: string; url: string } {
  const d = data || {};
  return {
    title: d[PUSH_FCM_DATA_KEYS.title] || d.title || "",
    body: d[PUSH_FCM_DATA_KEYS.body] || d.body || "",
    url: d[PUSH_FCM_DATA_KEYS.url] || d.url || "",
  };
}
