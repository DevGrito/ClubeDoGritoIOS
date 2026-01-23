import crypto from "crypto";

const MASTER_KEY_BASE64 = process.env.PAYMENT_ENCRYPTION_KEY;

const key = MASTER_KEY_BASE64 ? Buffer.from(MASTER_KEY_BASE64, "base64") : null;

export function seal(plain: string): string {
  if (!key || key.length !== 32) {
    throw new Error("❌ PAYMENT_ENCRYPTION_KEY não configurada ou inválida. Configure essa variável de ambiente.");
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function open(b64: string): string {
  if (!key || key.length !== 32) {
    throw new Error("❌ PAYMENT_ENCRYPTION_KEY não configurada ou inválida. Configure essa variável de ambiente.");
  }
  const buffer = Buffer.from(b64, "base64");
  
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return decrypted.toString("utf8");
}

export function generateMasterKey(): string {
  return crypto.randomBytes(32).toString("base64");
}
