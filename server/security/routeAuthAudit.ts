import {
  AUTH_MARKERS,
  SENSITIVE_ROUTES,
  type SensitiveRoute,
} from "./sensitiveRoutes.manifest";

export type RouteAuditIssue = {
  method: string;
  path: string;
  reason: string;
};

function pathToPattern(path: string): string {
  return path
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/:([A-Za-z0-9_]+)/g, ':[^"\'`]+');
}

function findRouteSnippet(source: string, route: SensitiveRoute): string | null {
  const pattern = new RegExp(
    `\\.${route.method.toLowerCase()}\\s*\\([\\s\\S]{0,300}?["'\`]${pathToPattern(route.path)}`,
    "i"
  );
  const match = pattern.exec(source);
  if (!match || match.index === undefined) return null;
  return source.slice(match.index, match.index + 1200);
}

export function auditRouteAuthInSource(source: string, route: SensitiveRoute): RouteAuditIssue | null {
  const snippet = findRouteSnippet(source, route);
  if (!snippet) {
    return { method: route.method, path: route.path, reason: "rota não encontrada no código" };
  }

  const markers = route.requiredMarkers ?? [...AUTH_MARKERS];
  const missing = markers.filter((m) => !snippet.includes(m));
  if (missing.length > 0) {
    return {
      method: route.method,
      path: route.path,
      reason: `sem middleware esperado: ${missing.join(", ")}`,
    };
  }

  return null;
}

export function auditAllSensitiveRoutes(sources: string[]): RouteAuditIssue[] {
  const combined = sources.join("\n");
  const issues: RouteAuditIssue[] = [];

  for (const route of SENSITIVE_ROUTES) {
    const issue = auditRouteAuthInSource(combined, route);
    if (issue) issues.push(issue);
  }

  return issues;
}
