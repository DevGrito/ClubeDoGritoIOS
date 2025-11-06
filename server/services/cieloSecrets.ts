import { db } from "../db";
import { appSecrets } from "@shared/schema";
import { eq } from "drizzle-orm";
import { seal, open } from "../lib/crypto";

// Cache em memória (limpa ao reiniciar servidor)
let cached: { merchantId: string; merchantKey: string } | null = null;

/**
 * Busca as credenciais da Cielo do banco de dados (criptografadas)
 * Usa cache em memória para evitar descriptografar a toda hora
 * @returns Objeto com merchantId e merchantKey descriptografados
 */
export async function getCieloSecrets(): Promise<{ merchantId: string; merchantKey: string }> {
  // Retorna do cache se já tiver
  if (cached) {
    return cached;
  }

  // Buscar do banco
  const [rowMerchantId, rowMerchantKey] = await Promise.all([
    db.select().from(appSecrets).where(eq(appSecrets.name, "CIELO_MERCHANT_ID")).limit(1),
    db.select().from(appSecrets).where(eq(appSecrets.name, "CIELO_MERCHANT_KEY")).limit(1)
  ]);

  if (!rowMerchantId[0] || !rowMerchantKey[0]) {
    throw new Error("Credenciais da Cielo não configuradas. Configure no painel admin.");
  }

  // Descriptografar e cachear
  try {
    cached = {
      merchantId: open(rowMerchantId[0].valueEnc),
      merchantKey: open(rowMerchantKey[0].valueEnc)
    };
    
    console.log("✅ [CIELO SECRETS] Credenciais carregadas e cacheadas");
    return cached;
  } catch (error) {
    console.error("❌ [CIELO SECRETS] Erro ao descriptografar:", error);
    throw new Error("Erro ao descriptografar credenciais da Cielo");
  }
}

/**
 * Salva as credenciais da Cielo criptografadas no banco
 * @param merchantId - Merchant ID da Cielo
 * @param merchantKey - Merchant Key da Cielo
 */
export async function saveCieloSecrets(merchantId: string, merchantKey: string): Promise<void> {
  if (!merchantId || !merchantKey) {
    throw new Error("MerchantId e MerchantKey são obrigatórios");
  }

  // Criptografar
  const merchantIdEnc = seal(merchantId);
  const merchantKeyEnc = seal(merchantKey);

  // Salvar no banco (upsert)
  await Promise.all([
    db
      .insert(appSecrets)
      .values({ name: "CIELO_MERCHANT_ID", valueEnc: merchantIdEnc })
      .onConflictDoUpdate({
        target: appSecrets.name,
        set: { valueEnc: merchantIdEnc, updatedAt: new Date() }
      }),
    db
      .insert(appSecrets)
      .values({ name: "CIELO_MERCHANT_KEY", valueEnc: merchantKeyEnc })
      .onConflictDoUpdate({
        target: appSecrets.name,
        set: { valueEnc: merchantKeyEnc, updatedAt: new Date() }
      })
  ]);

  // Limpar cache para forçar reload
  cached = null;
  
  console.log("✅ [CIELO SECRETS] Credenciais salvas e criptografadas");
}

/**
 * Verifica se as credenciais da Cielo estão configuradas
 * @returns true se configurado, false caso contrário
 */
export async function checkCieloSecretsConfigured(): Promise<boolean> {
  const [rowMerchantId, rowMerchantKey] = await Promise.all([
    db.select().from(appSecrets).where(eq(appSecrets.name, "CIELO_MERCHANT_ID")).limit(1),
    db.select().from(appSecrets).where(eq(appSecrets.name, "CIELO_MERCHANT_KEY")).limit(1)
  ]);

  return !!(rowMerchantId[0] && rowMerchantKey[0]);
}

/**
 * Limpa o cache de credenciais (útil para testes ou rotação de chaves)
 */
export function clearCieloSecretsCache(): void {
  cached = null;
  console.log("🔄 [CIELO SECRETS] Cache limpo");
}

// ===== SILENT ORDER POST (SOP) CREDENTIALS =====

let cachedSop: { clientId: string; clientSecret: string } | null = null;

/**
 * Busca as credenciais SOP da Cielo do banco de dados (criptografadas)
 * @returns Objeto com clientId e clientSecret descriptografados
 */
export async function getCieloSopCredentials(): Promise<{ clientId: string; clientSecret: string }> {
  // Retorna do cache se já tiver
  if (cachedSop) {
    return cachedSop;
  }

  // Buscar do banco
  const [rowClientId, rowClientSecret] = await Promise.all([
    db.select().from(appSecrets).where(eq(appSecrets.name, "CIELO_SOP_CLIENT_ID")).limit(1),
    db.select().from(appSecrets).where(eq(appSecrets.name, "CIELO_SOP_CLIENT_SECRET")).limit(1)
  ]);

  if (!rowClientId[0] || !rowClientSecret[0]) {
    throw new Error("Credenciais SOP da Cielo não configuradas. Configure no painel admin ou solicite ao suporte Cielo.");
  }

  // Descriptografar e cachear
  try {
    cachedSop = {
      clientId: open(rowClientId[0].valueEnc),
      clientSecret: open(rowClientSecret[0].valueEnc)
    };
    
    console.log("✅ [CIELO SOP] Credenciais carregadas e cacheadas");
    return cachedSop;
  } catch (error) {
    console.error("❌ [CIELO SOP] Erro ao descriptografar:", error);
    throw new Error("Erro ao descriptografar credenciais SOP da Cielo");
  }
}

/**
 * Salva as credenciais SOP da Cielo criptografadas no banco
 * @param clientId - Client ID do Silent Order Post
 * @param clientSecret - Client Secret do Silent Order Post
 */
export async function saveCieloSopCredentials(clientId: string, clientSecret: string): Promise<void> {
  if (!clientId || !clientSecret) {
    throw new Error("ClientId e ClientSecret são obrigatórios");
  }

  // Criptografar
  const clientIdEnc = seal(clientId);
  const clientSecretEnc = seal(clientSecret);

  // Salvar no banco (upsert)
  await Promise.all([
    db
      .insert(appSecrets)
      .values({ name: "CIELO_SOP_CLIENT_ID", valueEnc: clientIdEnc })
      .onConflictDoUpdate({
        target: appSecrets.name,
        set: { valueEnc: clientIdEnc, updatedAt: new Date() }
      }),
    db
      .insert(appSecrets)
      .values({ name: "CIELO_SOP_CLIENT_SECRET", valueEnc: clientSecretEnc })
      .onConflictDoUpdate({
        target: appSecrets.name,
        set: { valueEnc: clientSecretEnc, updatedAt: new Date() }
      })
  ]);

  // Limpar cache para forçar reload
  cachedSop = null;
  
  console.log("✅ [CIELO SOP] Credenciais salvas e criptografadas");
}

/**
 * Obtém OAuth2 Access Token usando ClientId e ClientSecret
 * @returns OAuth2 access token para uso com Silent Order Post
 */
export async function getOAuth2Token(): Promise<string> {
  const { clientId, clientSecret } = await getCieloSopCredentials();
  
  // Concatenar e converter para Base64
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  // Determinar ambiente
  const CIELO_ENV = process.env.CIELO_ENV || 'sandbox';
  const authUrl = CIELO_ENV === 'prod'
    ? 'https://auth.braspag.com.br/oauth2/token'
    : 'https://authsandbox.braspag.com.br/oauth2/token';

  console.log(`🔐 [CIELO OAuth2] Obtendo token em ${CIELO_ENV}...`);

  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [CIELO OAuth2] Erro HTTP ${response.status}:`, errorText);
      throw new Error(`Erro ao obter OAuth2 token: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error('OAuth2 token não retornado pela API');
    }

    console.log(`✅ [CIELO OAuth2] Token obtido com sucesso (expires_in: ${data.expires_in}s)`);
    return data.access_token;
  } catch (error: any) {
    console.error('❌ [CIELO OAuth2] Exception:', error);
    throw new Error(`Erro ao obter OAuth2 token: ${error.message}`);
  }
}

/**
 * Obtém SOP AccessToken usando OAuth2 token e MerchantId
 * @returns SOP AccessToken para uso no frontend
 */
export async function getSopAccessToken(): Promise<string> {
  // 1. Obter OAuth2 token
  const oauthToken = await getOAuth2Token();
  
  // 2. Obter MerchantId
  const { merchantId } = await getCieloSecrets();
  
  // Determinar ambiente
  const CIELO_ENV = process.env.CIELO_ENV || 'sandbox';
  const sopUrl = CIELO_ENV === 'prod'
    ? 'https://transaction.pagador.com.br/post/api/public/v2/accesstoken'
    : 'https://transactionsandbox.pagador.com.br/post/api/public/v2/accesstoken';

  console.log(`🔑 [CIELO SOP] Obtendo SOP AccessToken em ${CIELO_ENV}...`);

  try {
    const response = await fetch(sopUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'MerchantId': merchantId,
        'Authorization': `Bearer ${oauthToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [CIELO SOP] Erro HTTP ${response.status}:`, errorText);
      throw new Error(`Erro ao obter SOP AccessToken: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.AccessToken) {
      throw new Error('SOP AccessToken não retornado pela API');
    }

    console.log(`✅ [CIELO SOP] AccessToken obtido com sucesso`);
    return data.AccessToken;
  } catch (error: any) {
    console.error('❌ [CIELO SOP] Exception:', error);
    throw new Error(`Erro ao obter SOP AccessToken: ${error.message}`);
  }
}
