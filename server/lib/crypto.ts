import crypto from "crypto";

// Chave mestra de 32 bytes (256 bits) para AES-256-GCM
// OBRIGATÓRIO: deve ser armazenada como variável de ambiente PAYMENT_ENCRYPTION_KEY
const MASTER_KEY_BASE64 = process.env.PAYMENT_ENCRYPTION_KEY;

if (!MASTER_KEY_BASE64) {
  throw new Error("❌ PAYMENT_ENCRYPTION_KEY não configurada. Configure essa variável de ambiente para usar criptografia de credenciais.");
}

const key = Buffer.from(MASTER_KEY_BASE64, "base64");

if (key.length !== 32) {
  throw new Error("❌ PAYMENT_ENCRYPTION_KEY deve ter exatamente 32 bytes (256 bits). Use generateMasterKey() para gerar uma chave válida.");
}

/**
 * Criptografa um texto usando AES-256-GCM
 * @param plain - Texto a ser criptografado
 * @returns String base64 contendo [IV|Tag|Dados Criptografados]
 */
export function seal(plain: string): string {
  const iv = crypto.randomBytes(12); // 96 bits para GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag(); // 128 bits
  
  // Formato: [IV (12 bytes) | Tag (16 bytes) | Encrypted Data (N bytes)]
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/**
 * Descriptografa um texto criptografado com seal()
 * @param b64 - String base64 contendo [IV|Tag|Dados Criptografados]
 * @returns Texto descriptografado
 */
export function open(b64: string): string {
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

/**
 * Gera uma nova chave mestra de 32 bytes em base64
 * Use isso para gerar MASTER_KEY_BASE64
 */
export function generateMasterKey(): string {
  return crypto.randomBytes(32).toString("base64");
}
