// server/gcsService.ts
import { Storage } from "@google-cloud/storage";
import * as path from "node:path";
import * as fs from "node:fs";
import type { Response } from "express";
import { Readable } from "node:stream";  
// === inicialização (igual à sua) ===
const credentialsPath = path.join(process.cwd(), "gcs-service-account.json");
if (!fs.existsSync(credentialsPath)) {
  console.error("❌ Arquivo de credenciais GCS não encontrado:", credentialsPath);
  throw new Error("GCS credentials file not found");
}
export const gcsClient = new Storage({
  keyFilename: credentialsPath,
  projectId: "infra-optics-454414-g5",
});
export const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "clubedogrito";
export const bucket = gcsClient.bucket(BUCKET_NAME);
export const UPLOAD_PREFIX = "uploads/beneficios";

//console.log("✅ GCS Service inicializado com bucket:", BUCKET_NAME);

// ---------- NOVO: normalizador universal de chave ----------
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
  const dotHost = new RegExp(`^https?:\/\/${BUCKET_NAME}\\.storage\\.googleapis\\.com\/`, "i");
  if (dotHost.test(s)) {
    return s.replace(dotHost, "").replace(/^\/+/, "");
  }

  // se for https://storage.googleapis.com/<bucket>/path...
  const genericHost = new RegExp(`^https?:\/\/storage\\.googleapis\\.com\/${BUCKET_NAME}\/`, "i");
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

// ---------- AJUSTE: usar normalize em TODAS as funções ----------
export async function uploadToGCS(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  const destination = `${UPLOAD_PREFIX}/${fileName}`.replace(/^\/+/, "");
  const file = bucket.file(destination);
  await file.save(fileBuffer, { resumable: false, metadata: { contentType: mimeType } });
  return destination; // chave pura (ex.: uploads/beneficios/xxx.png)
}

export async function getSignedUrl(filePath: string, expiresInMinutes = 60): Promise<string> {
  const cleanPath = normalizeObjectKey(filePath);
  const file = bucket.file(cleanPath);
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + expiresInMinutes * 60 * 1000,
    // opcional: forçar content-type para render em <img>
    // responseType: "image/jpeg"  // (SDK antigo)
    // response-content-type: "image/jpeg" // se usar método que aceite
  } as any);
  return url;
}

export async function fileExists(filePath: string): Promise<boolean> {
  const cleanPath = normalizeObjectKey(filePath);
  const file = bucket.file(cleanPath);
  const [exists] = await file.exists();
  return exists;
}

export function extractFilePathFromUrl(url: string): string {
  return normalizeObjectKey(url);
}

export async function deleteObject(objectPath: string): Promise<void> {
  try {
    const cleanPath = normalizeObjectKey(objectPath);
    await bucket.file(cleanPath).delete({ ignoreNotFound: true });
    console.log("🗑️ [GCS] Objeto removido:", cleanPath);
  } catch (err) {
    console.warn("⚠️ [GCS] Falha ao remover objeto:", objectPath, err);
  }
}

// ---------- NOVO: helper para streamar objeto ----------
import type { Response } from "express";
export async function streamObjectToResponse(keyOrUrl: string, res: Response): Promise<void> {
  const objectKey = normalizeObjectKey(keyOrUrl);
  const file = bucket.file(objectKey);

  // pega metadados para setar Content-Type corretamente
  const [meta] = await file.getMetadata().catch(() => [{ contentType: "image/jpeg" } as any]);

  res.setHeader("Content-Type", meta?.contentType || "image/jpeg");
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
  // 1) normaliza para chave
  const key = normalizeObjectKey(keyOrUrl);

  // 2) gera Signed URL (v4) – não depende de OAuth
  const signed = await getSignedUrl(key, Math.ceil(ttlSeconds / 60));

  // 3) baixa e faz proxy 200
  const upstream = await fetch(signed, { redirect: "follow" });

  if (!upstream.ok) {
    console.error("Signed fetch fail:", upstream.status, await upstream.text().catch(() => ""));
    res.status(502).send("Falha ao obter imagem do storage");
    return;
  }

  const ct = upstream.headers.get("content-type") || "image/jpeg";
  res.setHeader("Content-Type", ct);
  res.setHeader("Cache-Control", `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}`);
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