import cron from 'node-cron';
import { syncStripeIngressos } from '../services/stripeSync';
import { saveInstagramMetrics } from '../services/instagramService';
import { reconcileDonors } from '../services/donorReconciliation';

// ─── Status do cron do Instagram ──────────────────────────────────────────────
interface InstagramCronStatus {
  running: boolean;
  timezone: string;
  schedule: string[];
  lastRunAt: Date | null;
  lastSuccessAt: Date | null;
  lastErrorAt: Date | null;
  lastError: string | null;
  lastPeriod: string | null;
}

const instagramStatus: InstagramCronStatus = {
  running: false,
  timezone: 'America/Sao_Paulo',
  schedule: ['0 8 * * *', '0 14 * * *', '0 20 * * *'],
  lastRunAt: null,
  lastSuccessAt: null,
  lastErrorAt: null,
  lastError: null,
  lastPeriod: null,
};

export function getInstagramCronStatus(): InstagramCronStatus {
  return { ...instagramStatus };
}

export async function runInstagramSyncNowForDebug(period: 'morning' | 'evening' = 'morning'): Promise<void> {
  if (instagramStatus.running) {
    console.warn('⚠️ [Instagram CRON] Sync já em andamento — ignorando chamada duplicada');
    return;
  }
  instagramStatus.running = true;
  instagramStatus.lastRunAt = new Date();
  instagramStatus.lastPeriod = period;
  console.log(`📸 [Instagram CRON] Iniciando sync (${period}) às ${new Date().toISOString()}...`);
  try {
    await saveInstagramMetrics(period);
    instagramStatus.lastSuccessAt = new Date();
    console.log(`✅ [Instagram CRON] Sync concluído com sucesso às ${new Date().toISOString()}`);
  } catch (e: any) {
    instagramStatus.lastErrorAt = new Date();
    instagramStatus.lastError = e.message;
    console.error(`❌ [Instagram CRON] Erro no sync:`, e.message);
  } finally {
    instagramStatus.running = false;
  }
}

async function refreshDonorHistoricoVigente(label: string): Promise<void> {
  try {
    const { captureCurrentMonthDonorSnapshot, capturePreviousMonthDonorSnapshot } = await import('../services/donorSnapshot');
    const r = await captureCurrentMonthDonorSnapshot();
    console.log(`✅ [CRON] Snapshot doadores mês vigente (${label}): ativos=${r.ativos} trialing=${r.trialing} evadidos=${r.evadidos}`);
    if (new Date().getDate() === 1) {
      const prev = await capturePreviousMonthDonorSnapshot();
      console.log(`✅ [CRON] Snapshot doadores mês anterior fechado: ativos=${prev.ativos} trialing=${prev.trialing} evadidos=${prev.evadidos}`);
    }
  } catch (e: any) {
    console.error(`❌ [CRON] Erro no snapshot de doadores (${label}):`, e.message);
  }
}

export function initCronJobs() {
  console.log('⏰ [CRON] Inicializando tarefas agendadas...');

  // Stripe sync — a cada 5 horas + atualiza histórico do mês vigente
  cron.schedule('0 */5 * * *', async () => {
    console.log('⏰ [CRON] Executando sincronização automática do Stripe...');
    try {
      const resultado = await syncStripeIngressos();
      console.log('✅ [CRON] Sincronização concluída:', {
        total: resultado.total,
        novos: resultado.novos,
        existentes: resultado.existentes,
        erros: resultado.erros
      });
      await refreshDonorHistoricoVigente('pós-sync Stripe');
    } catch (error: any) {
      console.error('❌ [CRON] Erro na sincronização automática:', error.message);
    }
  });

  // Instagram sync — 3x por dia: 08h, 14h e 20h (horário de Brasília)
  const tz = { timezone: 'America/Sao_Paulo' };
  cron.schedule('0 8 * * *',  () => runInstagramSyncNowForDebug('morning'), tz);
  cron.schedule('0 14 * * *', () => runInstagramSyncNowForDebug('morning'), tz);
  cron.schedule('0 20 * * *', () => runInstagramSyncNowForDebug('evening'), tz);

  // Snapshot de doadores — todo dia às 6h (mês vigente; dia 1 fecha o mês anterior)
  cron.schedule('0 6 * * *', () => refreshDonorHistoricoVigente('diário 6h'), {
    timezone: 'America/Sao_Paulo',
  });

  // Reconciliação de doadores pendentes - todo dia às 4h
  cron.schedule('0 4 * * *', async () => {
    console.log('🔄 [CRON] Iniciando reconciliação de doadores pendentes...');
    try {
      const resultado = await reconcileDonors();
      console.log(`✅ [CRON] Reconciliação de doadores concluída:`, resultado);
    } catch (e: any) {
      console.error('❌ [CRON] Erro na reconciliação de doadores:', e.message);
    }
  });

  console.log('✅ [CRON] Tarefas agendadas:');
  console.log('   - Sincronização Stripe: a cada 5 horas (+ snapshot doadores mês vigente)');
  console.log('   - Sincronização Instagram: 08h, 14h e 20h (America/Sao_Paulo)');
  console.log('   - Snapshot doadores: todo dia às 6h (dia 1 fecha mês anterior)');
  console.log('   - Reconciliação doadores pendentes: todo dia às 4h');

  // Em dev local, syncs na subida competem com o Vite e deixam o primeiro load lento.
  const runStartupSync =
    process.env.RUN_STARTUP_SYNC === 'true' ||
    (process.env.NODE_ENV !== 'development' && process.env.SKIP_STARTUP_SYNC !== 'true');

  if (!runStartupSync) {
    console.log('⏭️ [CRON] Sincronizações iniciais ignoradas (ambiente development). Use RUN_STARTUP_SYNC=true para forçar.');
  } else {
    console.log('🔄 [CRON] Executando sincronizações iniciais ao iniciar...');
    syncStripeIngressos()
      .then(async (resultado) => {
        console.log('✅ [CRON] Sincronização Stripe inicial concluída:', {
          novos: resultado.novos,
          existentes: resultado.existentes
        });
        await refreshDonorHistoricoVigente('startup');
      })
      .catch(error => {
        console.error('❌ [CRON] Erro na sincronização Stripe inicial:', error.message);
      });

    const hour = new Date().getHours();
    const period = hour < 15 ? 'morning' : 'evening';
    runInstagramSyncNowForDebug(period);
  }

  // INSTAGRAM_SYNC_ON_START=true → sync adicional após 20s (confirma que está ativo no deploy)
  if (process.env.INSTAGRAM_SYNC_ON_START === 'true') {
    console.log('🔬 [Instagram CRON] INSTAGRAM_SYNC_ON_START=true — sync de teste em 20s...');
    setTimeout(() => {
      const h = new Date().getHours();
      runInstagramSyncNowForDebug(h < 15 ? 'morning' : 'evening');
    }, 20_000);
  }
}
