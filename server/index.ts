import express, { type Request, type Response, type NextFunction } from "express";
import compression from "compression";
import helmet from "helmet";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";

import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { testDatabaseConnection, runAutoMigrations, pool } from "./db";
import { checkDevAccess } from "./middleware/devAccess";
import { healthRouter } from "./health";
import { toClientError } from "./lib/safeError";
import { conditionalJsonParser, conditionalUrlencodedParser } from "./middleware/bodyLimit";

// Late-bound: preenchido após registerRoutes para alertas de crash
let _crashAlertFn: ((g: string, e: any, ctx: any) => void) | null = null;

process.on("uncaughtException", (err) => {
  console.error("🔴 [CRASH] uncaughtException:", err?.message, err?.stack);
  try { if (_crashAlertFn) _crashAlertFn("erro_critico_sistema", err, { integracao: "Sistema", origem: "uncaughtException", severidade: "alta" }); } catch { }
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("🔴 [CRASH] unhandledRejection:", reason);
  try { if (_crashAlertFn) _crashAlertFn("erro_critico_sistema", reason, { integracao: "Sistema", origem: "unhandledRejection", severidade: "alta" }); } catch { }
});

const app = express();

// SEC-025: headers de segurança (CSP progressiva — unsafe-inline ainda necessário no SPA)
const isProd = process.env.NODE_ENV === "production";
app.use(
  helmet({
    contentSecurityPolicy: isProd
      ? {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://www.googletagmanager.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          connectSrc: ["'self'", "https:", "wss:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
          objectSrc: ["'none'"],
        },
      }
      : false,
    crossOriginEmbedderPolicy: false,
  })
);

// Compressão gzip para todos os assets e respostas
app.use(compression());

// estamos atrás de proxy (Traefik/nginx)
app.set("trust proxy", 1);

/**
 * CORS – aceita:
 * - App publicado (domínios oficiais)
 * - WebView/Capacitor (origin null / capacitor://localhost / ionic://localhost)
 * - Dev local
 */
const ALLOW_LIST = [
  "https://clubedogrito.institutoogrito.com.br",
  "https://eventos.institutoogrito.com.br",
  "https://app.clubedogrito.com.br",
  "http://localhost",
  "http://localhost:80",
  "http://localhost:3000",
  "http://localhost:8100",
  "capacitor://localhost",
  "ionic://localhost",
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean) as string[];

const NATIVE_ORIGINS = new Set([
  "capacitor://localhost",
  "ionic://localhost",
])

function isServerToServerPath(path: string): boolean {
  return (
    path.startsWith("/api/webhook") ||
    path.startsWith("webhook") ||
    path.startsWith("/api/paymente/webhook") ||
    path.startsWith("/api/typeform/webhook") ||
    path === "/health"
  );
}


const corsOptions = {
  origin(origin, cb) {
    const isProd = process.env.NODE_ENV === "production";

    // DEV: Flexivel
    if (!isProd) {
      if (!origin) return cb(null, true);
      if (origin.startsWith("http://localhost")) return cb(null, true);
      if (ALLOW_LIST.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    }

    // iOS WebView/TestFlight muitas vezes vem sem Origin -> permitir
    if (!origin) return cb(null, true);

    if (NATIVE_ORIGINS.has(origin)) return cb(null, true);
    if (ALLOW_LIST.includes(origin)) return cb(null, true);

    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: "GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS",
  allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-GV-Dashboard",
}
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// SEC-010 + SEC-014: secrets obrigatórios em produção
if (process.env.NODE_ENV === "production") {

  const corsOrigin = process.env.CORS_ORIGIN?.trim() ?? "";
  if (!corsOrigin) {
    console.error("FATAL [SECURITY]: CORS_ORIGIN obrigatório em produção (SEC-016).");
    process.exit(1);
  }

  const secret = process.env.SESSION_SECRET?.trim() ?? "";
  if (
    !secret ||
    secret.length < 32 ||
    secret === "dev_secret_change_me"
  ) {
    console.error(
      "FATAL [SECURITY]: SESSION_SECRET ausente, curto ou é o valor de desenvolvimento. " +
      "Defina um secret aleatório com pelo menos 32 caracteres."
    );
    process.exit(1);
  }

  for (const key of ["STRIPE_WEBHOOK_SECRET", "CATRACA_WEBHOOK_TOKEN"] as const) {
    if (key === "CATRACA_WEBHOOK_TOKEN") {
      const catraca =
        process.env.CATRACA_WEBHOOK_TOKEN?.trim() ||
        process.env.WEBHOOK_PRESENCA_SECRET?.trim();
      if (!catraca) {
        console.error(
          "FATAL [SECURITY]: CATRACA_WEBHOOK_TOKEN ou WEBHOOK_PRESENCA_SECRET obrigatório em produção (SEC-014)."
        );
        process.exit(1);
      }
      continue;
    }
    if (!process.env[key]?.trim()) {
      console.error(`FATAL [SECURITY]: ${key} obrigatório em produção (SEC-014).`);
      process.exit(1);
    }
  }
}

// ✅ SESSÃO com PostgreSQL store (persistente, sobrevive a reinicializações)
const PgSession = connectPgSimple(session);
app.use(
  session({
    name: "og.sid",
    secret: process.env.SESSION_SECRET || "dev_secret_change_me",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: false,
      pruneSessionInterval: 60 * 60, // limpa sessões expiradas a cada 1h
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      // "auto" usa X-Forwarded-Proto (com proxy:true). Evita skip de Set-Cookie
      // quando NODE_ENV=production mas o hop interno é HTTP sem proto correto.
      secure: process.env.COOKIE_SECURE === "true"
        ? true
        : process.env.COOKIE_SECURE === "false"
          ? false
          : "auto",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
    },
  })
);

// 👇 Webhooks com verificação de assinatura precisam do raw body
const RAW_BODY_PREFIXES = [
  "/api/webhook/stripe",
  "/api/stripe/webhook",
  "/api/typeform/webhook",
];

for (const prefix of RAW_BODY_PREFIXES) {
  app.use(prefix, express.raw({ type: "application/json" }));
}

// 👇 Para todas as outras rotas, usa JSON com limite padrão 2mb (SEC-022)
app.use(conditionalJsonParser());
app.use(conditionalUrlencodedParser());

// Payload acima do limite
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err && typeof err === "object" && (err as { type?: string }).type === "entity.too.large") {
    return res.status(413).json({ error: "Payload muito grande" });
  }
  next(err);
});

// SEC-017: /uploads servido com auth em server/routes.ts (não expor estático aqui)
// Service workers precisam ser servidos com Content-Type correto — antes do Vite em dev
app.get("/firebase-messaging-sw.js", (req, res) => {
  const swPath = process.env.NODE_ENV === "production"
    ? path.resolve(process.cwd(), "dist", "public", "firebase-messaging-sw.js")
    : path.resolve(process.cwd(), "client", "public", "firebase-messaging-sw.js");
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.sendFile(swPath);
});

// /sw.js — serve o Workbox SW com Firebase Messaging integrado.
// O Workbox SW usa skipWaiting() e fica sempre ativo (o Firebase SW fica em "waiting" e nunca
// recebe push events). Solução: embutir o Firebase Messaging diretamente no sw.js ativo.
app.get("/sw.js", async (req, res) => {
  try {
    const swPath = process.env.NODE_ENV === "production"
      ? path.resolve(process.cwd(), "dist", "public", "sw.js")
      : path.resolve(process.cwd(), "dist", "public", "sw.js"); // dev também usa o build
    const fs = await import("fs/promises");
    let swContent = "";
    try {
      swContent = await fs.readFile(swPath, "utf-8");
    } catch {
      // Se não existir ainda (ex: antes do primeiro build), deixa vazio
    }

    // Firebase compat SDK integrado ao Workbox SW.
    // O Firebase SDK no SW é necessário para que getToken() no cliente funcione
    // (o SDK do cliente envia postMessages ao SW para coordenar o token).
    // O firebase.messaging() no SW NÃO cria push subscriptions — só registra listeners.
    const firebaseMessagingAppend = `
// ── Firebase Messaging integrado ao Workbox SW ───────────────────────────────
// importScripts em try-catch para não bloquear instalação do SW se CDN falhar
try {
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');
} catch(importErr) {
  console.warn('[SW/FCM] Falha ao carregar Firebase SDK (CDN indisponível?):', importErr);
}

function pushClickPath(urlToOpen) {
  if (!urlToOpen || urlToOpen === '/') return '/';
  if (/^https?:\\/\\//i.test(urlToOpen)) {
    try {
      var parsed = new URL(urlToOpen);
      return parsed.pathname + parsed.search + parsed.hash;
    } catch (e) {
      return '/';
    }
  }
  return urlToOpen.startsWith('/') ? urlToOpen : '/' + urlToOpen;
}

function pushClickAbsoluteUrl(urlToOpen) {
  return self.location.origin + pushClickPath(urlToOpen);
}

function isPublicPushPath(path) {
  var p = (path || '/').split('?')[0].split('#')[0] || '/';
  if (p === '/') return true;
  var prefixes = [
    '/entrar', '/login/', '/dev/login',
    '/termos-servicos', '/politica-privacidade', '/reativar-assinatura',
    '/dashboard/gestao/vista', '/gestao-vista-preview',
    '/register', '/plans', '/verify', '/checkout', '/success',
    '/pos-pagamento', '/aguardando-aprovacao', '/pagamento/',
    '/assinatura-pausada'
  ];
  for (var i = 0; i < prefixes.length; i++) {
    var prefix = prefixes[i];
    if (prefix.endsWith('/')) {
      if (p.startsWith(prefix) || p === prefix.slice(0, -1)) return true;
    } else if (p === prefix || p.startsWith(prefix + '/')) {
      return true;
    }
  }
  return false;
}

function loginPathForPushTarget(path) {
  var p = (path || '/').split('?')[0];
  if (p.indexOf('/coordenador') === 0) return '/login/coordenador';
  if (p.indexOf('/professor') === 0) return '/login/professor';
  if (p.indexOf('/monitor') === 0) return '/login/monitor';
  if (p.indexOf('/aluno') === 0) return '/login/aluno';
  if (p.indexOf('/dev') === 0 || p.indexOf('/admin') === 0 || p.indexOf('/administrador') === 0) {
    return '/login/developer';
  }
  if (p.indexOf('/rbac/marketing') === 0) return '/login/marketing';
  return '/entrar';
}

// Home padrão por papel (espelha getDefaultRouteForRole no app).
function roleHome(role) {
  switch (role) {
    case 'professor': case 'professor_psico': case 'lider': case 'professor_lider': return '/professor';
    case 'professor_pec': return '/professor/pec';
    case 'professor_inclusao': return '/professor/inclusao';
    case 'monitor': case 'monitor_pec': case 'monitor_inclusao': case 'monitor_psico': return '/monitor';
    case 'coordenador_inclusao': return '/coordenador/inclusao-produtiva';
    case 'coordenador_pec': return '/coordenador/esporte-cultura';
    case 'coordenador_psico': return '/coordenador/psicossocial';
    case 'tecnica_psico': return '/tecnica/psicossocial';
    case 'super_admin': case 'leo': return '/administrador';
    case 'desenvolvedor': case 'dev': return '/dev';
    case 'dev-marketing': return '/dev/marketing';
    case 'admin': return '/admin-geral';
    case 'aluno': case 'aluno_portal': return '/aluno';
    case 'conselho': case 'conselheiro': return '/conselho';
    case 'patrocinador': return '/patrocinador';
    default: return '/tdoador';
  }
}

// Papel pode abrir a rota? Papéis elevados/desconhecidos: permissivo (ProtectedRoute confirma).
function roleAllowsPath(role, path) {
  var p = (path || '/').split('?')[0].split('#')[0] || '/';
  if (['dev', 'desenvolvedor', 'dev-admin', 'dev-marketing', 'super_admin', 'leo', 'admin'].indexOf(role) >= 0) return true;
  var map = {
    doador: ['/', '/tdoador', '/welcome', '/beneficios', '/beneficios-onboarding', '/missoes', '/missoes-semanais', '/meus-lances', '/sorteio', '/impacto', '/link-indicacao', '/link-afiliado-cadastro', '/busca', '/noticias', '/perfil', '/meus-dados', '/dados-cadastrais', '/pagamentos', '/configuracoes', '/sobre', '/change-plan', '/central-ajuda', '/reativar-assinatura'],
    aluno: ['/', '/aluno', '/central-ajuda', '/meus-dados'],
    professor: ['/', '/professor', '/central-ajuda', '/meus-dados'],
    monitor: ['/', '/monitor', '/central-ajuda', '/meus-dados'],
    coordenador: ['/', '/coordenador', '/central-ajuda', '/meus-dados', '/login/coordenador'],
    tecnica_psico: ['/', '/tecnica', '/central-ajuda', '/meus-dados'],
    conselho: ['/', '/conselho', '/central-ajuda', '/perfil', '/meus-dados', '/dados-cadastrais', '/sobre', '/configuracoes', '/gestao-vista', '/dashboard/gestao/vista'],
    patrocinador: ['/', '/patrocinador-dashboard', '/patrocinador', '/perfil-patrocinador', '/meus-dados', '/central-ajuda']
  };
  var key = role;
  if (role === 'user') key = 'doador';
  else if (role === 'aluno_portal') key = 'aluno';
  else if (role.indexOf('professor') === 0 || role === 'lider') key = 'professor';
  else if (role.indexOf('monitor') === 0) key = 'monitor';
  else if (role.indexOf('coordenador') === 0) key = 'coordenador';
  else if (role === 'conselheiro') key = 'conselho';
  var allowed = map[key];
  if (!allowed) return true;
  for (var i = 0; i < allowed.length; i++) {
    var a = allowed[i];
    if (p === a || (a !== '/' && p.indexOf(a + '/') === 0)) return true;
  }
  return false;
}

async function fetchAuthSession() {
  try {
    var res = await fetch(self.location.origin + '/api/auth/session', {
      credentials: 'include',
      cache: 'no-store'
    });
    if (res.status === 401 || !res.ok) return null;
    var session = await res.json();
    return (session && session.id) ? session : null;
  } catch (e) {
    return null;
  }
}

async function resolveSecurePushPath(urlToOpen) {
  var path = pushClickPath(urlToOpen);
  if (isPublicPushPath(path)) return path;
  var session = await fetchAuthSession();
  if (!session) return loginPathForPushTarget(path);
  var role = String(session.papel || session.role || session.actorType || '');
  if (roleAllowsPath(role, path)) return path;
  return roleHome(role);
}

async function openPushClickUrl(urlToOpen) {
  var path = await resolveSecurePushPath(urlToOpen);
  var url = self.location.origin + path;
  var windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (var i = 0; i < windowClients.length; i++) {
    var c = windowClients[i];
    if (!c.url.startsWith(self.location.origin)) continue;
    if ('focus' in c) await c.focus();
    if ('navigate' in c) {
      await c.navigate(url);
      return;
    }
    c.postMessage({ type: 'PUSH_NAVIGATE', path: path });
    return;
  }
  if (clients.openWindow) await clients.openWindow(url);
}

function readPushData(data) {
  var d = data || {};
  return {
    title: d.cdg_title || d.title || '',
    body: d.cdg_body || d.body || '',
    url: d.cdg_url || d.url || ''
  };
}

function showPushNotification(payload) {
  var notif = payload.notification || {};
  var parsed = readPushData(payload.data);
  var title = notif.title || parsed.title || 'Clube do Grito';
  var body  = notif.body  || parsed.body  || '';
  var urlRaw = parsed.url || (notif.data && notif.data.url);
  var url   = urlRaw ? pushClickPath(urlRaw) : undefined;
  var tag = payload.fcmMessageId || payload.messageId || parsed.title || 'cdg-push';
  return self.registration.showNotification(title, {
    body: body,
    icon: '/icons/icon-192.png',
    tag: String(tag).slice(0, 64),
    renotify: true,
    data: url ? { url: url } : {},
    vibrate: [200, 100, 200],
  });
}

(function() {
  try {
    if (typeof firebase === 'undefined') {
      console.warn('[SW/FCM] Firebase SDK não carregado — notificações background desativadas.');
      return;
    }
    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: "AIzaSyDKdcqxJj1qoSFpY1bLT2JloeJDfxDG_x8",
        authDomain: "clube-do-grito.firebaseapp.com",
        projectId: "clube-do-grito",
        storageBucket: "clube-do-grito.firebasestorage.app",
        messagingSenderId: "579937692596",
        appId: "1:579937692596:web:9c2dd3f21e94d3230ca0e1"
      });
    }
    var fcm = firebase.messaging();
    fcm.onBackgroundMessage(function(payload) {
      return showPushNotification(payload);
    });
    console.log('[SW/FCM] Firebase Messaging inicializado no Workbox SW.');
  } catch(e) {
    console.error('[SW/FCM] Erro ao inicializar:', e);
  }
})();

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'close') return;
  var urlToOpen = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(openPushClickUrl(urlToOpen));
});
// Fallback: handler push nativo caso Firebase SDK não tenha carregado
if (typeof firebase === 'undefined') {
  self.addEventListener('push', function(event) {
    if (!event.data) return;
    try {
      var p = event.data.json();
      event.waitUntil(showPushNotification(p));
    } catch(e) { console.error('[SW/push] Erro:', e); }
  });
}
// ── fim Firebase Messaging ────────────────────────────────────────────────────
`;

    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.send(swContent + "\n" + firebaseMessagingAppend);
  } catch (err) {
    console.error("[SW] Erro ao servir sw.js:", err);
    res.status(500).send("// erro interno ao servir sw.js");
  }
});

app.get("/index.html", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

/**
 * 🔐 Guard de DEV *somente* em /api/dev
 *   - /api/dev/login e /api/dev/status são livres
 *   - demais paths de /api/dev exigem X-Dev-Access: <token>
 */
app.use("/api/dev", (req, res, next) => {
  const open = new Set(["/login", "/status"]);
  if (open.has(req.path)) return next();
  return checkDevAccess(req, res, next);
});

// logger de APIs
app.use((req, res, next) => {
  const start = Date.now();
  const pathName = req.path;
  let captured: unknown;

  const originalJson = res.json;
  // @ts-ignore — sobrescreve só pra capturar em log
  res.json = function (body, ...args) {
    captured = body;
    return originalJson.apply(res, [body, ...args]);
  };

  res.on("finish", () => {
    // só loga rotas de API que NÃO sejam de activity
    if (!pathName.startsWith("/api")) return;
    if (pathName.startsWith("/api/activity")) return;

    const took = Date.now() - start;
    let line = `${req.method} ${pathName} ${res.statusCode} in ${took}ms`;
    if (captured !== undefined) {
      try {
        line += ` :: ${JSON.stringify(captured)}`;
      } catch { }
    }
    if (line.length > 80) line = line.slice(0, 79) + "…";
    log(line);
  });

  next();
});

(async () => {
  try {
    await testDatabaseConnection();
    await runAutoMigrations();

    // Iniciar jobs programados de assinaturas
    const { startSubscriptionReconciliation, startAutomaticDunning } =
      await import("./jobs/subscriptions");
    startSubscriptionReconciliation();
    startAutomaticDunning();

    // Iniciar outros jobs (sincronização Stripe, atualização automática de turmas)
    const { initCronJobs } = await import("./jobs/cronJobs");
    initCronJobs();
  } catch (error) {
    console.error("Failed to connect to database on startup:", error);
    process.exit(1);
  }

  // Manifest de fallback pelo backend
  app.get("/manifest.json", (_req, res) => {
    res.setHeader("Content-Type", "application/manifest+json");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const manifest = {
      name: "Clube do Grito",
      short_name: "O Grito",
      id: "clube-do-grito-pwa",
      start_url: "/",
      scope: "/",
      display: "standalone",
      display_override: ["window-controls-overlay", "standalone"],
      orientation: "portrait-primary",
      background_color: "#FFCC00",
      theme_color: "#FFCC00",
      description: "Vozes que ecoam",
      lang: "pt-BR",
      dir: "ltr",
      categories: ["education", "social"],
      icons: [
        {
          src: "/icons/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable",
        },
        {
          src: "/icons/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
      screenshots: [
        {
          src: "/icons/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          form_factor: "wide",
          label: "Clube do Grito - Tela Principal",
        },
      ],
    };

    res.json(manifest);
  });

  // ✅ health sem redirect
  const healthPayload = () => ({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  });

  app.get("/health", (_req, res) => res.status(200).json(healthPayload()));
  app.get("/api/health", (_req, res) => res.status(200).json(healthPayload()));

  // (opcional) monta rotas extras de saúde se existirem
  app.use(healthRouter());

  const server = await registerRoutes(app);

  // Conectar handler de crash ao fireTechnicalAlert (disponível após registerRoutes)
  _crashAlertFn = (app as any)._fireTechnicalAlert ?? null;

  // handler de erro central — não relança depois de responder
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err?.status ?? err?.statusCode ?? 500;
    if (status >= 500) console.error("[ERROR]", err);
    const message = status >= 500
      ? toClientError(err, "Erro interno do servidor")
      : (err?.message ?? "Requisição inválida");
    if (!res.headersSent) res.status(status).json({ message });
  });

  // Verificar se o frontend foi buildado
  const distPath = path.resolve(process.cwd(), "dist", "public");
  const frontendBuildExists = fs.existsSync(distPath);

  const isDevRuntime = app.get("env") === "development" || process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

  // Em desenvolvimento, prioriza sempre o Vite (HMR), mesmo com dist/public existente.
  if (isDevRuntime) {
    log("⚡ Using Vite dev server");
    await setupVite(app, server);
  } else if (frontendBuildExists) {
    log("🚀 Serving built frontend from " + distPath);

    // Serve arquivos estáticos do build
    app.use(
      express.static(distPath, {
        etag: true,
        maxAge: app.get("env") === "production" ? "1d" : "0",
        index: false, // não servir index.html automaticamente aqui
      })
    );

    // Fallback para SPA - qualquer rota que não seja /api/* vai para index.html
    app.use("*", (req, res) => {
      // Se for rota da API, não intercepta
      if (req.originalUrl.startsWith("/api/")) {
        return res.status(404).json({ message: "API route not found" });
      }

      // Para todas as outras rotas, serve o index.html (SPA)
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    log("❌ Frontend build not found at " + distPath);
    log("Run 'npm run build' to generate the frontend build");

    // Fallback básico para mostrar que o servidor está funcionando
    app.get("*", (req, res) => {
      if (req.originalUrl.startsWith("/api/")) {
        return res.status(404).json({ message: "API route not found" });
      }
      res.status(200).send(`
        <html>
          <body>
            <h1>Clube do Grito - Server Running</h1>
            <p>Backend está funcionando, mas o frontend não foi buildado.</p>
            <p>Execute <code>npm run build</code> para gerar o frontend.</p>
            <p>Rotas da API estão disponíveis em <a href="/api/">/api/</a></p>
          </body>
        </html>
      `);
    });
  }

  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });

  server.on("error", (err: any) => {
    console.error("Server error:", err);
    process.exit(1);
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    server.close(() => process.exit(0));
  });

  process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down gracefully");
    server.close(() => process.exit(0));
  });
})();
