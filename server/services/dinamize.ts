import { db, pool } from '../db';
import { doadores, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { recordDinamizeSync, emitDinamizeSyncFailureAlert } from '../dinamizeObservability';
import {
  getDinamizeConsentSnapshot,
  resolveUserIdForDoador,
} from './dinamizeConsent';
import {
  buildLgpdDinamizePayloadFields,
  DEFAULT_DENY_CONSENT_SNAPSHOT,
  isDinamizeLgpdPayloadEnabled,
  logDinamizeConsentLine,
  type DinamizeSyncIntent,
} from './dinamizeConsentPayload';

export type { DinamizeSyncIntent } from './dinamizeConsentPayload';

export type DinamizeSyncLogContext = {
  syncIntent: DinamizeSyncIntent;
  eventType: 'doador' | 'premio';
  entityId?: number | null;
  userId?: number | null;
  optinMarketing?: boolean | null;
  optinCommunications?: boolean | null;
  alertSource?: string;
};

function notifySyncFailure(
  logContext: DinamizeSyncLogContext,
  errorMessage: string,
  httpStatus?: number | null
) {
  emitDinamizeSyncFailureAlert({
    errorMessage,
    syncIntent: logContext.syncIntent,
    eventType: logContext.eventType,
    entityId: logContext.entityId,
    alertSource: logContext.alertSource || logContext.syncIntent,
    httpStatus: httpStatus ?? null,
  });
}

export interface DoadorDinamize {
  id: number;
  /** users.id — usado para resolver consentimento LGPD */
  userId?: number | null;
  email: string | null;
  nome: string | null;
  telefone: string | null;
  status: string | null;
  plano: string;
  valor: string | number;
  dataDoacaoInicial: Date | string | null;
  stripeCustomerId: string | null;
  tipoEvento?: string;
  dataPagamentoAtual?: string;
  syncIntent?: DinamizeSyncIntent;
}

function mapStatus(status: string | null): string {
  if (!status) return 'inadimplente';
  if (status === 'paid' || status === 'active') return 'ativo';
  if (status === 'canceled' || status === 'cancelled') return 'cancelado';
  return 'inadimplente';
}

function formatTelefone(tel: string | null): string {
  if (!tel) return '';
  const digits = tel.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  return '55' + digits;
}

function formatData(date: Date | string | null): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function inferSyncIntent(doador: DoadorDinamize): DinamizeSyncIntent {
  if (doador.syncIntent) return doador.syncIntent;
  const status = mapStatus(doador.status);
  if (status === 'cancelado') return 'subscription_status';
  return 'billing';
}

async function resolveLgpdFields(
  userId: number | null,
  syncIntent: DinamizeSyncIntent
): Promise<Record<string, unknown>> {
  if (!isDinamizeLgpdPayloadEnabled()) return {};
  const snapshot =
    userId != null ? await getDinamizeConsentSnapshot(userId) : { ...DEFAULT_DENY_CONSENT_SNAPSHOT };
  logDinamizeConsentLine('sync', userId, syncIntent, snapshot);
  return buildLgpdDinamizePayloadFields(snapshot, syncIntent);
}

async function postDinamizeWebhook(
  payload: Record<string, unknown>,
  logLabel: string,
  logContext: DinamizeSyncLogContext
): Promise<boolean> {
  const url = process.env.DINAMIZE_WEBHOOK_URL;
  if (!url) {
    console.warn('[DINAMIZE] DINAMIZE_WEBHOOK_URL não configurada — envio ignorado');
    const errorMessage = 'webhook_not_configured';
    void recordDinamizeSync(pool, {
      ...logContext,
      success: false,
      httpStatus: null,
      errorMessage,
    });
    notifySyncFailure(logContext, errorMessage);
    return false;
  }

  console.log(`[DINAMIZE] Payload ${logLabel}:`, JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const bodyText = await res.text().catch(() => '');
    if (!res.ok) {
      console.error(`[DINAMIZE] Falha ${logLabel}: HTTP ${res.status} — body: ${bodyText}`);
      const errorMessage = `HTTP ${res.status}`;
      void recordDinamizeSync(pool, {
        ...logContext,
        success: false,
        httpStatus: res.status,
        errorMessage,
        responsePreview: bodyText,
      });
      notifySyncFailure(logContext, errorMessage, res.status);
      return false;
    }
    console.log(`[DINAMIZE] ✅ ${logLabel} enviado — body: ${bodyText}`);
    void recordDinamizeSync(pool, {
      ...logContext,
      success: true,
      httpStatus: res.status,
      responsePreview: bodyText,
    });
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DINAMIZE] ❌ Erro ${logLabel}:`, message);
    void recordDinamizeSync(pool, {
      ...logContext,
      success: false,
      httpStatus: null,
      errorMessage: message,
    });
    notifySyncFailure(logContext, message);
    return false;
  }
}

export async function enviarDoadorParaDinamize(doador: DoadorDinamize): Promise<boolean> {
  const syncIntent = inferSyncIntent(doador);
  const userId =
    typeof doador.userId === 'number' && doador.userId > 0
      ? doador.userId
      : await resolveUserIdForDoador(doador.id);

  const lgpdFields = await resolveLgpdFields(userId, syncIntent);
  const payload: Record<string, unknown> = {
    email: doador.email || '',
    nome: doador.nome || '',
    telefone: formatTelefone(doador.telefone),
    status_doador: mapStatus(doador.status),
    plano: doador.plano || '',
    valor_doacao: Number(doador.valor) || 0,
    origem: 'clube_do_grito',
    data_entrada: formatData(doador.dataDoacaoInicial),
    stripe_customer_id: doador.stripeCustomerId || '',
    id_usuario_clube: doador.id,
    marcadores: 'DOADORES - CLUBE DO GRITO',
    ...lgpdFields,
  };
  if (doador.tipoEvento) payload.tipo_evento = doador.tipoEvento;
  if (doador.dataPagamentoAtual) payload.data_pagamento_atual = doador.dataPagamentoAtual;

  return postDinamizeWebhook(payload, `doador ${doador.id} (${payload.email})`, {
    syncIntent,
    eventType: 'doador',
    entityId: doador.id,
    userId,
    optinMarketing: lgpdFields.optin_marketing === true,
    optinCommunications: lgpdFields.optin_communications === true,
    alertSource: doador.syncIntent === 'manual' ? 'manual/sync-doador' : doador.syncIntent || syncIntent,
  });
}

export interface PremioDinamize {
  ganhadorId: number;
  userId?: number | null;
  email: string | null;
  nome: string | null;
  telefone: string | null;
  nomePremio: string;
  dataResgate: Date;
  quantidadeGritos: number;
}

export async function enviarPremioParaDinamize(premio: PremioDinamize): Promise<boolean> {
  const dataRetirada = new Date(premio.dataResgate);
  dataRetirada.setMonth(dataRetirada.getMonth() + 1);

  const userId =
    typeof premio.userId === 'number' && premio.userId > 0 ? premio.userId : null;

  const lgpdFields = await resolveLgpdFields(userId, 'prize_fulfillment');
  const payload: Record<string, unknown> = {
    email: premio.email || '',
    nome: premio.nome || '',
    telefone: formatTelefone(premio.telefone),
    tipo_evento: 'gritos_premio_resgatado',
    nome_premio: premio.nomePremio,
    data_resgate_premio: formatData(premio.dataResgate),
    data_retirada_premio: formatData(dataRetirada),
    quantidade_gritos_usados: premio.quantidadeGritos,
    status_premio: 'resgatado',
    ...lgpdFields,
  };

  return postDinamizeWebhook(payload, `prêmio ganhador ${premio.ganhadorId} (${payload.email})`, {
    syncIntent: 'prize_fulfillment',
    eventType: 'premio',
    entityId: premio.ganhadorId,
    userId,
    optinMarketing: lgpdFields.optin_marketing === true,
    optinCommunications: lgpdFields.optin_communications === true,
    alertSource: 'prize_fulfillment',
  });
}

export async function enviarDoadorPorId(doadorId: number): Promise<{ success: boolean; message: string }> {
  try {
    const rows = await db
      .select({
        id: doadores.id,
        userId: doadores.userId,
        plano: doadores.plano,
        valor: doadores.valor,
        status: doadores.status,
        dataDoacaoInicial: doadores.dataDoacaoInicial,
        stripeCustomerId: doadores.stripeCustomerId,
        email: users.email,
        nome: users.nome,
        telefone: users.telefone,
      })
      .from(doadores)
      .leftJoin(users, eq(doadores.userId, users.id))
      .where(eq(doadores.id, doadorId))
      .limit(1);

    if (!rows.length) {
      return { success: false, message: `Doador ID ${doadorId} não encontrado` };
    }

    const row = rows[0];
    const ok = await enviarDoadorParaDinamize({
      id: row.id,
      userId: row.userId ?? null,
      email: row.email ?? null,
      nome: row.nome ?? null,
      telefone: row.telefone ?? null,
      status: row.status ?? null,
      plano: row.plano,
      valor: row.valor,
      dataDoacaoInicial: row.dataDoacaoInicial ?? null,
      stripeCustomerId: row.stripeCustomerId ?? null,
      syncIntent: 'manual',
    });

    if (!ok) {
      return {
        success: false,
        message: `Falha ao enviar doador ${doadorId} para a Dinamize — veja o histórico`,
      };
    }

    return { success: true, message: `Doador ${doadorId} enviado para a Dinamize` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error(`[DINAMIZE] Erro em enviarDoadorPorId(${doadorId}):`, message);
    return { success: false, message };
  }
}

// Re-export para hooks em routes.ts
export { syncDinamizeConsentByUserId } from './dinamizeConsent';

/** Payload de teste LGPD — mesmo formato flat do Clube (dev/QA). */
export async function enviarTesteLgpdParaDinamize(
  email = 'teste@teste.com'
): Promise<{ success: boolean; message: string; payload: Record<string, unknown> }> {
  const payload: Record<string, unknown> = {
    email,
    nome: 'Contato Teste Clube',
    telefone: '5511999999999',
    status_doador: 'ativo',
    plano: 'voz',
    valor_doacao: 50,
    origem: 'clube_do_grito',
    data_entrada: '2025-06-01',
    stripe_customer_id: '',
    id_usuario_clube: 99999,
    marcadores: 'DOADORES - CLUBE DO GRITO',
    tipo_evento: 'consent_update',
    sync_intent: 'consent_update',
    optin_communications: true,
    optin_marketing: true,
    optin_email: true,
    optin_whatsapp: true,
    optin_sms: true,
    allow_marketing_campaigns: true,
    allow_relationship_campaigns: true,
    allow_promotional_email: true,
    marketing_automation_blocked: false,
    lgpd_consent_known: true,
    lgpd_consent_version: '1.0',
    lgpd_consent_updated_at: new Date().toISOString(),
    lgpd_consent_source: 'dev_test_manual',
  };

  const ok = await postDinamizeWebhook(payload, `teste LGPD (${email})`, {
    syncIntent: 'consent_update',
    eventType: 'doador',
    entityId: 99999,
    userId: null,
    optinMarketing: true,
    optinCommunications: true,
    alertSource: 'dev/test-webhook-lgpd',
  });

  return {
    success: ok,
    message: ok
      ? `Payload de teste enviado para ${email}`
      : `Falha ao enviar teste para ${email} — veja histórico e resposta da Dinamize`,
    payload,
  };
}
