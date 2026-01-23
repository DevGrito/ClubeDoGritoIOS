import cron from 'node-cron';
import { syncStripeIngressos } from '../services/stripeSync';

export function initCronJobs() {
  console.log('⏰ [CRON] Inicializando tarefas agendadas...');
  
  // Sincronização do Stripe a cada 5 horas
  // Formato: minuto hora dia mês dia-da-semana
  // 0 */5 * * * = A cada 5 horas (00:00, 05:00, 10:00, 15:00, 20:00)
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
  
  console.log('✅ [CRON] Tarefas agendadas:');
  console.log('   - Sincronização Stripe: a cada 5 horas');
  
  // Executar primeira sincronização ao iniciar (opcional)
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
