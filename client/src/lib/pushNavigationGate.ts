import { fetchAuthSessionAndSyncCache } from "@/lib/auth-session";
import { canRoleAccessRoute, getDefaultRouteForRole, normalizeRbacRole } from "@/lib/rbac-routes";

/**
 * Rotas que o push pode abrir sem sessão ativa.
 * /dashboard/gestao/vista fica aqui de propósito (não exigir login no clique).
 */
const PUBLIC_PUSH_PREFIXES = [
  "/",
  "/entrar",
  "/login/",
  "/dev/login",
  "/termos-servicos",
  "/politica-privacidade",
  "/reativar-assinatura",
  "/dashboard/gestao/vista",
  "/gestao-vista-preview",
  "/register",
  "/plans",
  "/verify",
  "/checkout",
  "/success",
  "/pos-pagamento",
  "/aguardando-aprovacao",
  "/pagamento/",
  "/assinatura-pausada",
] as const;

export function normalizePushPath(path: string): string {
  const raw = (path || "/").trim();
  if (!raw) return "/";
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      return parsed.pathname + parsed.search + parsed.hash || "/";
    } catch {
      return "/";
    }
  }
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export function isPublicPushPath(path: string): boolean {
  const p = normalizePushPath(path).split("?")[0].split("#")[0] || "/";
  if (p === "/") return true;
  return PUBLIC_PUSH_PREFIXES.some((prefix) => {
    if (prefix === "/") return false;
    if (prefix.endsWith("/")) return p.startsWith(prefix) || p === prefix.slice(0, -1);
    return p === prefix || p.startsWith(`${prefix}/`);
  });
}

/** Login adequado para o destino do push (quando não há sessão). Preserva destino em ?redirect=. */
export function loginPathForPushTarget(path: string): string {
  const p = normalizePushPath(path).split("?")[0];
  let login = "/entrar";
  if (p.startsWith("/coordenador") || p.startsWith("/tecnica")) login = "/login/coordenador";
  else if (p.startsWith("/professor")) login = "/login/professor";
  else if (p.startsWith("/monitor")) login = "/login/monitor";
  else if (p.startsWith("/aluno")) login = "/login/aluno";
  else if (p.startsWith("/dev") || p.startsWith("/admin") || p.startsWith("/administrador")) {
    login = "/login/developer";
  } else if (p.startsWith("/rbac/marketing")) login = "/login/marketing";

  const redirect = encodeURIComponent(normalizePushPath(path));
  return `${login}?redirect=${redirect}`;
}

/**
 * Resolve para onde o clique do push deve ir, na ordem:
 *  1) rota pública → abre direto;
 *  2) sem sessão ativa → login (não abre a página destino);
 *  3) sessão ativa mas papel sem permissão → home do papel (não abre a página destino);
 *  4) sessão + permissão → abre a página destino.
 */
export async function resolveSecurePushNavigationPath(
  requestedPath: string
): Promise<string> {
  const path = normalizePushPath(requestedPath);
  if (isPublicPushPath(path)) return path;

  const session = await fetchAuthSessionAndSyncCache();
  if (!session?.id) return loginPathForPushTarget(path);

  const role = String(session.papel || session.role || session.actorType || "");
  if (canRoleAccessRoute(role, path)) return path;

  return getDefaultRouteForRole(normalizeRbacRole(role.trim()));
}
