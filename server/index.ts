import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";

import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { testDatabaseConnection } from "./db";
import { checkDevAccess } from "./middleware/devAccess";
import { healthRouter } from "./health";

const app = express();

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

app.use(
  cors({
    origin(origin, cb) {
      // iOS WebView/TestFlight muitas vezes vem sem Origin -> permitir
      if (!origin) return cb(null, true);

      if (ALLOW_LIST.includes(origin)) return cb(null, true);
      if (ALLOW_LIST.some((o) => origin.startsWith(o))) return cb(null, true);

      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders:
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Dev-Access",
  })
);

// responde rápido preflight
// responde rápido preflight
app.options("*", cors());

// 👇 Webhook Stripe precisa do raw body
app.use("/api/webhook/stripe", express.raw({ type: "application/json" }));

// 👇 Para todas as outras rotas, usa JSON normalmente
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/webhook/stripe")) {
    return next(); // não aplicar express.json aqui
  }
  return express.json({ limit: "50mb" })(req, res, next);
});

app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/webhook/stripe")) {
    return next(); // não aplicar urlencoded aqui também
  }
  return express.urlencoded({ extended: false, limit: "50mb" })(req, res, next);
});

// estáticos — uploads (persistentes no volume)
app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "uploads"), {
    fallthrough: false,
    etag: true,
    maxAge: "7d",
  }),
);

// estáticos — attached_assets (bind mount do host -> container)
app.use(
  "/attached_assets",
  express.static(path.resolve(process.cwd(), "attached_assets"), {
    fallthrough: false,
    etag: true,
    maxAge: "7d",
    setHeaders: (res, filePath) => {
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      if (/\.(png)$/i.test(filePath)) res.setHeader("Content-Type", "image/png");
      if (/\.(jpe?g)$/i.test(filePath)) res.setHeader("Content-Type", "image/jpeg");
      if (/\.webp$/i.test(filePath)) res.setHeader("Content-Type", "image/webp");
      if (/\.svg$/i.test(filePath)) res.setHeader("Content-Type", "image/svg+xml");
      if (/\.json$/i.test(filePath)) res.setHeader("Content-Type", "application/json");
    },
  }),
);

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
    if (pathName.startsWith("/api")) {
      const took = Date.now() - start;
      let line = `${req.method} ${pathName} ${res.statusCode} in ${took}ms`;
      if (captured !== undefined) {
        try {
          line += ` :: ${JSON.stringify(captured)}`;
        } catch {}
      }
      if (line.length > 80) line = line.slice(0, 79) + "…";
      log(line);
    }
  });

  next();
});

(async () => {
  try {
    await testDatabaseConnection();

    // Iniciar jobs programados de assinaturas
    const { startSubscriptionReconciliation, startAutomaticDunning } = await import("./jobs/subscriptions");
    startSubscriptionReconciliation();
    startAutomaticDunning();
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
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
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


  // handler de erro central — não relança depois de responder
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err?.status ?? err?.statusCode ?? 500;
    const message = err?.message ?? "Internal Server Error";
    if (process.env.LOG_LEVEL === "debug") console.error("[ERROR]", err);
    if (!res.headersSent) res.status(status).json({ message });
  });

  // Verificar se o frontend foi buildado
  const distPath = path.resolve(process.cwd(), "dist", "public");
  const frontendBuildExists = fs.existsSync(distPath);

  // Se frontend buildado existe, sempre usa ele (desenvolvimento ou produção)
  // Se não existe, usa Vite em desenvolvimento
  if (frontendBuildExists) {
    log("🚀 Serving built frontend from " + distPath);

    // Serve arquivos estáticos do build
    app.use(
      express.static(distPath, {
        etag: true,
        maxAge: app.get("env") === "production" ? "1d" : "0",
        index: false, // não servir index.html automaticamente aqui
      }),
    );

    // Fallback para SPA - qualquer rota que não seja /api/* vai para index.html
    app.use("*", (req, res) => {
      // Se for rota da API, não intercepta
      if (req.originalUrl.startsWith("/api/")) {
        return res.status(404).json({ message: "API route not found" });
      }

      // Para todas as outras rotas, serve o index.html (SPA)
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else if (app.get("env") === "development" || !process.env.NODE_ENV) {
    log("⚡ Using Vite dev server (no build found)");
    await setupVite(app, server);
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