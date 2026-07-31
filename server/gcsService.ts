// server/gcsService.ts
import { Storage } from "@google-cloud/storage";
import * as path from "node:path";
import * as fs from "node:fs";
import type { Response } from "express";
import { Readable } from "node:stream";

// === inicialização com suporte a Base64, arquivo ou GCS_* ===
let gcsClientInstance: Storage | null = null;

const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_B64;
const credentialsPath = path.join(process.cwd(), "gcs-service-account.json");

let gcsAvailable = false;

function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n").trim();
}

function tryInitFromEnvParts(): Storage | null {
  const clientEmail = process.env.GCS_CLIENT_EMAIL?.trim();
  const privateKeyRaw = process.env.GCS_PRIVATE_KEY;
  const projectId =
    process.env.GCS_PROJECT_ID?.trim() || "infra-optics-454414-g5";

  if (!clientEmail || !privateKeyRaw) return null;

  const privateKey = normalizePrivateKey(privateKeyRaw);
  if (
    !privateKey.includes("BEGIN PRIVATE KEY") ||
    !privateKey.includes("END PRIVATE KEY")
  ) {
    console.warn(
      "⚠️ GCS_PRIVATE_KEY presente, mas parece incompleta/inválida (sem PEM completo)"
    );
    return null;
  }

  // PEM RSA completa costuma ter ~1.6k+ chars; chave truncada nunca autentica
  if (privateKey.length < 400) {
    console.warn(
      `⚠️ GCS_PRIVATE_KEY parece truncada (len=${privateKey.length}) — GCS desabilitado`
    );
    return null;
  }

  return new Storage({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    projectId,
  });
}

if (credentialsBase64) {
  try {
    const credentials = JSON.parse(
      Buffer.from(credentialsBase64, "base64").toString("utf-8")
    );
    gcsClientInstance = new Storage({
      credentials,
      projectId: credentials.project_id || "infra-optics-454414-g5",
    });
    gcsAvailable = true;
    console.log("✅ GCS inicializado via GOOGLE_CREDENTIALS_B64");
  } catch (e) {
    console.error("❌ Erro ao parsear credenciais GCS B64:", e);
  }
} else if (fs.existsSync(credentialsPath)) {
  gcsClientInstance = new Storage({
    keyFilename: credentialsPath,
    projectId: "infra-optics-454414-g5",
  });
  gcsAvailable = true;
  console.log("✅ GCS inicializado via arquivo de credenciais");
} else {
  const fromParts = tryInitFromEnvParts();
  if (fromParts) {
    gcsClientInstance = fromParts;
    gcsAvailable = true;
    console.log("✅ GCS inicializado via GCS_CLIENT_EMAIL + GCS_PRIVATE_KEY");
  } else {
    console.warn(
      "⚠️ Credenciais GCS não encontradas/validas - uploads usarão storage local"
    );
    gcsClientInstance = null;
  }
}

export const isGCSAvailable = gcsAvailable;

export const gcsClient = gcsClientInstance;
export const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "clubedogrito";
export const bucket = gcsClient ? gcsClient.bucket(BUCKET_NAME) : null;
export const UPLOAD_PREFIX = "uploads/beneficios";

const LOCAL_UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");

function mimeToExt(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  return map[mimeType] || ".jpg";
}

function ensureFileNameHasExt(fileName: string, mimeType: string): string {
  if (path.extname(fileName)) return fileName;
  return `${fileName}${mimeToExt(mimeType)}`;
}

/** Resolve caminho absoluto seguro sob ./uploads ou null se fora do escopo. */
export function resolveLocalUploadPath(keyOrUrl: string): string | null {
  const key = normalizeObjectKey(keyOrUrl);
  if (!key || !key.startsWith("uploads/")) return null;

  const abs = path.resolve(process.cwd(), key);
  const rootWithSep = LOCAL_UPLOAD_ROOT + path.sep;
  if (!abs.startsWith(rootWithSep) && abs !== LOCAL_UPLOAD_ROOT) return null;
  return abs;
}

export function localFileExists(keyOrUrl: string): boolean {
  const abs = resolveLocalUploadPath(keyOrUrl);
  return !!(abs && fs.existsSync(abs));
}

/** URL relativa usada no preview quando GCS não está disponível. */
export function localPreviewUrl(objectKey: string): string {
  const key = normalizeObjectKey(objectKey).replace(/^\/+/, "");
  return `/${key}`;
}

/**
 * Recebe URL completa (http/https, gs://…), URL assinada ou a chave crua
 * e devolve SEMPRE o caminho relativo ao bucket (ex.: "uploads/beneficios/a.png").
 */
export function normalizeObjectKey(input: string): string {
  if (!input) return "";

  // remove querystring
  let s = input.split("?")[0].trim();

  // se for gs://<bucket>/path
  if (s.startsWith("gs://")) {
    s = s.replace(/^gs:\/\//, "");
    // remove "<bucket>/" se vier
    s = s.replace(new RegExp(`^${BUCKET_NAME}\/`), "");
    return s.replace(/^\/+/, "");
  }

  // se for https://<bucket>.storage.googleapis.com/path...
  const dotHost = new RegExp(
    `^https?:\/\/${BUCKET_NAME}\\.storage\\.googleapis\\.com\/`,
    "i"
  );
  if (dotHost.test(s)) {
    return s.replace(dotHost, "").replace(/^\/+/, "");
  }

  // se for https://storage.googleapis.com/<bucket>/path...
  const genericHost = new RegExp(
    `^https?:\/\/storage\\.googleapis\\.com\/${BUCKET_NAME}\/`,
    "i"
  );
  if (genericHost.test(s)) {
    return s.replace(genericHost, "").replace(/^\/+/, "");
  }

  // se for domínio próprio/CDN (caso tenha), remova o host genérico:
  // ex.: https://cdn.seudominio.com/<bucket>/path OU /path já limpo
  // tenta remover "<bucket>/" do início
  s = s.replace(new RegExp(`^${BUCKET_NAME}\/`), "");

  // por fim, se não tinha host, provavelmente já é chave
  return s.replace(/^\/+/, "");
}

async function saveLocally(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const safeName = ensureFileNameHasExt(fileName, mimeType);
  const destination = `${UPLOAD_PREFIX}/${safeName}`.replace(/^\/+/, "");
  const abs = path.resolve(process.cwd(), destination);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, fileBuffer);
  console.warn(`⚠️ [GCS] Fallback local salvo em: ${destination}`);
  return destination;
}

export async function uploadToGCS(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const safeName = ensureFileNameHasExt(fileName, mimeType);
  const destination = `${UPLOAD_PREFIX}/${safeName}`.replace(/^\/+/, "");

  if (!bucket) {
    return saveLocally(fileBuffer, safeName, mimeType);
  }

  try {
    const file = bucket.file(destination);
    await file.save(fileBuffer, {
      resumable: false,
      metadata: { contentType: mimeType },
    });
    return destination; // chave pura (ex.: uploads/beneficios/xxx.png)
  } catch (err) {
    console.error("❌ [GCS] uploadToGCS falhou, usando fallback local:", err);
    return saveLocally(fileBuffer, safeName, mimeType);
  }
}

export async function getSignedUrl(
  filePath: string,
  expiresInMinutes = 60
): Promise<string> {
  const cleanPath = normalizeObjectKey(filePath);

  // Arquivo local (sem GCS ou já salvo em disco)
  if (!bucket || localFileExists(cleanPath)) {
    if (localFileExists(cleanPath)) {
      return localPreviewUrl(cleanPath);
    }
    if (!bucket) {
      throw new Error("GCS não disponível e arquivo local não encontrado");
    }
  }

  const file = bucket!.file(cleanPath);
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  } as any);
  return url;
}

export async function fileExists(filePath: string): Promise<boolean> {
  const cleanPath = normalizeObjectKey(filePath);
  if (localFileExists(cleanPath)) return true;
  if (!bucket) return false;
  const file = bucket.file(cleanPath);
  const [exists] = await file.exists();
  return exists;
}

export function extractFilePathFromUrl(url: string): string {
  return normalizeObjectKey(url);
}

export async function deleteObject(objectPath: string): Promise<void> {
  const cleanPath = normalizeObjectKey(objectPath);
  const localAbs = resolveLocalUploadPath(cleanPath);
  if (localAbs && fs.existsSync(localAbs)) {
    try {
      fs.unlinkSync(localAbs);
      console.log("🗑️ [LOCAL] Objeto removido:", cleanPath);
    } catch (err) {
      console.warn("⚠️ [LOCAL] Falha ao remover objeto:", objectPath, err);
    }
  }

  if (!bucket) return;
  try {
    await bucket.file(cleanPath).delete({ ignoreNotFound: true });
    console.log("🗑️ [GCS] Objeto removido:", cleanPath);
  } catch (err) {
    console.warn("⚠️ [GCS] Falha ao remover objeto:", objectPath, err);
  }
}

function streamLocalFile(absPath: string, res: Response): void {
  const ext = path.extname(absPath).toLowerCase();
  const contentType =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".gif"
          ? "image/gif"
          : "image/jpeg";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  fs.createReadStream(absPath).pipe(res);
}

function coerceImageContentType(contentType: string | undefined, objectKey: string): string {
  const ct = String(contentType || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (ct.startsWith("image/")) return ct;
  const ext = path.extname(objectKey).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

// ---------- NOVO: helper para streamar objeto ----------
export async function streamObjectToResponse(
  keyOrUrl: string,
  res: Response
): Promise<void> {
  const objectKey = normalizeObjectKey(keyOrUrl);
  const localAbs = resolveLocalUploadPath(objectKey);
  if (localAbs && fs.existsSync(localAbs)) {
    streamLocalFile(localAbs, res);
    return;
  }

  if (!bucket) {
    res.status(503).send("Serviço de storage não disponível");
    return;
  }

  const file = bucket.file(objectKey);

  // pega metadados para setar Content-Type corretamente
  const [meta] = await file
    .getMetadata()
    .catch(() => [{ contentType: "image/jpeg" } as any]);

  res.setHeader(
    "Content-Type",
    coerceImageContentType(meta?.contentType, objectKey)
  );
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  file
    .createReadStream()
    .on("error", (err: any) => {
      console.error("GCS read error:", err?.code, err?.message);
      if (err?.code === 404) res.status(404).send("Imagem não encontrada");
      else res.status(502).send("Falha ao obter imagem do storage");
    })
    .pipe(res);
}

// ⬇️ ADICIONE ESTA FUNÇÃO (fica junto das demais exports)
export async function streamSignedObjectToResponse(
  keyOrUrl: string,
  res: Response,
  ttlSeconds: number = 300
): Promise<void> {
  const key = normalizeObjectKey(keyOrUrl);
  const localAbs = resolveLocalUploadPath(key);
  if (localAbs && fs.existsSync(localAbs)) {
    streamLocalFile(localAbs, res);
    return;
  }

  if (!bucket) {
    res.status(503).send("Serviço de storage não disponível");
    return;
  }
  // 1) gera Signed URL (v4) – não depende de OAuth
  const signed = await getSignedUrl(key, Math.ceil(ttlSeconds / 60));

  // signed local relative path (fallback)
  if (signed.startsWith("/")) {
    return res.redirect(302, signed);
  }

  // 2) baixa e faz proxy 200
  const upstream = await fetch(signed, { redirect: "follow" });

  if (!upstream.ok) {
    console.error(
      "Signed fetch fail:",
      upstream.status,
      await upstream.text().catch(() => "")
    );
    res.status(502).send("Falha ao obter imagem do storage");
    return;
  }

  const ct = upstream.headers.get("content-type") || "image/jpeg";
  res.setHeader("Content-Type", ct);
  res.setHeader(
    "Cache-Control",
    `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}`
  );
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  // Node 18+: body é WebReadableStream → convertemos para Node stream;
  // fallback para buffer caso não tenha stream exposto
  const body: any = (upstream as any).body;
  if (body && typeof (Readable as any).fromWeb === "function" && body.getReader) {
    Readable.fromWeb(body).pipe(res);
  } else {
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.end(buf);
  }
}
