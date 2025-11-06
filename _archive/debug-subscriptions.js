import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const subscriptionIds = [
  'sub_1S83fYHT8727OGtYqAg9JyRB', // Carolaine
  'sub_1S842SHT8727OGtYQLumsp3B', // Ricardo Santos
  'sub_1S84MaHT8727OGtYN61MocSh'  // Sabrina Vitória
];

async function getSubscriptionDetails() {
  console.log('\n📊 ANÁLISE DE SUBSCRIPTIONS DA STRIPE\n');
  console.log('=' .repeat(80));
  
  for (const subId of subscriptionIds) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subId);
      
      // Buscar invoices para essa subscription
      const invoices = await stripe.invoices.list({
        subscription: subId,
        limit: 10
      });
      
      // Calcular billing day a partir do billing_cycle_anchor
      const billingDate = new Date(subscription.billing_cycle_anchor * 1000);
      const billingDay = billingDate.getDate();
      
      console.log(`\n📋 Subscription: ${subId}`);
      console.log(`   Customer ID: ${subscription.customer}`);
      console.log(`   Status: ${subscription.status}`);
      console.log(`   Valor: R$ ${(subscription.items.data[0].price.unit_amount / 100).toFixed(2)}`);
      console.log(`   Criada em: ${new Date(subscription.created * 1000).toLocaleDateString('pt-BR')}`);
      console.log(`   📅 DIA DE COBRANÇA: ${billingDay}`);
      console.log(`   Billing Cycle Anchor: ${billingDate.toLocaleDateString('pt-BR')}`);
      
      if (subscription.current_period_end) {
        console.log(`   Próxima cobrança: ${new Date(subscription.current_period_end * 1000).toLocaleDateString('pt-BR')}`);
      }
      
      if (subscription.canceled_at) {
        console.log(`   ❌ CANCELADA EM: ${new Date(subscription.canceled_at * 1000).toLocaleDateString('pt-BR')}`);
      }
      
      console.log(`\n   📜 Histórico de Invoices (${invoices.data.length} encontradas):`);
      invoices.data.forEach((inv, idx) => {
        const status = inv.status === 'paid' ? '✅' : inv.status === 'open' ? '⏳' : '❌';
        console.log(`      ${idx + 1}. ${status} ${new Date(inv.created * 1000).toLocaleDateString('pt-BR')} - R$ ${(inv.amount_paid / 100).toFixed(2)} (${inv.status})`);
      });
      
      console.log('\n' + '-'.repeat(80));
      
    } catch (error) {
      console.error(`❌ Erro ao buscar subscription ${subId}:`, error.message);
    }
  }
  
  console.log('\n✅ Análise concluída!\n');
}

getSubscriptionDetails();
