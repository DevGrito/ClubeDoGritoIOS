/** Requisições do dashboard — exigem cookie de desbloqueio no servidor. */
export function fetchGestaoVistaDashboard(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("X-GV-Dashboard", "1");

  return fetch(url, {
    ...init,
    credentials: "include",
    headers,
  });
}
