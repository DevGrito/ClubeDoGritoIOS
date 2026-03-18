import cron from 'node-cron';
import { syncStripeIngressos } from '../services/stripeSync';
import { saveInstagramMetrics } from '../services/instagramService';

export function initCronJobs() {
  console.log('⏰ [CRON] Inicializando tarefas agendadas...');
  
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
    } catch (error: any) {
      console.error('❌ [CRON] Erro na sincronização automática:', error.message);
    }
  });
  
  // Instagram sync - 09:00 e 21:00 (configurável via INSTAGRAM_SYNC_CRON)
  const instagramCron = process.env.INSTAGRAM_SYNC_CRON || '0 9,21 * * *';
  cron.schedule(instagramCron, async () => {
    const hour = new Date().getHours();
    const period = hour < 15 ? 'morning' : 'evening';
    console.log(`📸 [CRON] Instagram sync automático (${period})...`);
    try {
      await saveInstagramMetrics(period as 'morning' | 'evening');
    } catch (e: any) {
      console.error('❌ [CRON] Erro no sync do Instagram:', e.message);
    }
  });

  console.log('✅ [CRON] Tarefas agendadas:');
  console.log('   - Sincronização Stripe: a cada 5 horas');
  console.log('   - Sincronização Instagram: 09:00 e 21:00');
  
  console.log('🔄 [CRON] Executando primeira sincronização ao iniciar...');
  syncStripeIngressos()
    .then(resultado => {
      console.log('✅ [CRON] Sincronização inicial concluída:', {
        novos: resultado.novos,
        existentes: resultado.existentes
      });
    })
    .catch(error => {
      console.error('❌ [CRON] Erro na sincronização inicial:', error.message);
    });
}
