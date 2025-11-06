# Sistema de Eventos e Webhooks - Clube do Grito

Sistema completo de eventos, webhooks e automações para CRM e email marketing.

## 📋 Funcionalidades

- ✅ **Criação de eventos** com idempotência
- ✅ **Webhooks automáticos** para integrações externas  
- ✅ **Automações de email** baseadas em eventos
- ✅ **Worker dispatcher** com retry exponencial
- ✅ **Tradução de eventos Stripe** para eventos internos
- ✅ **Segurança** com API keys e assinaturas HMAC
- ✅ **Observabilidade** com logs e health check

## 🎯 Eventos Disponíveis

| Evento | Descrição | Payload |
|--------|-----------|---------|
| `user.signed_up` | Usuário se cadastrou | `{name, email, phone}` |
| `donation.created` | Doação criada | `{amount, plan, customerId}` |
| `plan.subscribed` | Plano assinado (Stripe) | `{stripeSessionId, amount}` |
| `payment.succeeded` | Pagamento bem-sucedido | `{invoiceId, amount}` |
| `payment.failed` | Falha no pagamento | `{invoiceId, failureCode}` |

## 🔧 Como Usar

### 1. Criar um Evento

```bash
curl -X POST http://localhost:5000/events \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $EVENTS_API_KEY" \
  -d '{
    "event_name": "user.signed_up",
    "user_id": 123,
    "source": "web",
    "payload": {
      "name": "João Silva",
      "email": "joao@email.com",
      "phone": "+5511999999999"
    },
    "idempotency_key": "signup_123_20240925"
  }'
```

### 2. Cadastrar Webhook

```sql
INSERT INTO grito_webhook_subscriptions 
  (destination_name, endpoint_url, secret, event_filter, is_active)
VALUES 
  (
    'Meu-CRM',
    'https://meu-sistema.com/webhooks/grito',
    'MEU_SECRET_SUPER_SEGURO',
    ARRAY['user.signed_up', 'donation.created'],
    true
  );
```

### 3. Criar Automação de Email

```sql
INSERT INTO grito_automations 
  (name, match_event, action, is_active)
VALUES 
  (
    'Email Boas-vindas',
    'user.signed_up',
    '{
      "type": "email",
      "template_id": "welcome_template",
      "to": "{{payload.email}}",
      "variables": {
        "nome": "{{payload.name}}"
      }
    }',
    true
  );
```

### 4. Verificar Saúde do Sistema

```bash
curl http://localhost:5000/health
```

## 🔒 Segurança

### API Key para Eventos
Configure a variável de ambiente:
```bash
EVENTS_API_KEY=sua_api_key_super_secreta
```

### Webhook do Stripe
Configure a variável de ambiente:
```bash
STRIPE_WEBHOOK_SECRET=whsec_sua_secret_do_stripe
```

### Assinatura HMAC de Webhooks
Os webhooks são assinados com HMAC SHA256:
```
X-Grito-Signature: sha256=abc123...
```

## 🚀 Executar Worker de Webhooks

Para processar a fila de webhooks:

```bash
# Via tsx (desenvolvimento)
npx tsx server/workers/webhook-dispatcher.ts

# Via node (produção)
node dist/workers/webhook-dispatcher.js
```

## 📊 Monitoramento

### Health Check
- **URL**: `GET /health`
- **Resposta**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2024-09-25T20:15:00.000Z",
    "database": "connected",
    "pendingWebhooks": 0
  }
  ```

### Logs Estruturados
```
🎯 [EVENT CREATED] user.signed_up for user 123 from web
📤 [WEBHOOK QUEUED] user.signed_up → CRM-Doadores
📧 [AUTOMATION EMAIL] Boas-vindas enviado para joao@email.com
✅ [WEBHOOK SUCCESS] CRM-Doadores: 200
```

## 🔄 Retry e Backoff

O worker de webhooks implementa retry automático:
- **Máximo**: 6 tentativas
- **Backoff**: 2, 4, 8, 16, 32 minutos
- **Status**: PENDING → OK/FAIL

## 📚 Estrutura do Banco

### Tabelas
- `grito_events` - Eventos do sistema
- `grito_webhook_subscriptions` - Assinaturas de webhooks
- `grito_webhook_deliveries` - Fila de entregas
- `grito_automations` - Automações configuradas

### Dados de Exemplo
- ✅ Webhook subscription para CRM-Doadores
- ✅ Automação de email de boas-vindas

## 🎨 Templates de Variáveis

Use `{{payload.campo}}` para substituir variáveis:
- `{{payload.name}}` → Nome do usuário
- `{{payload.email}}` → Email do usuário  
- `{{payload.amount}}` → Valor da doação
- `{{payload.plan}}` → Plano escolhido

## 📝 Logs de Debug

```bash
# Ver eventos criados
SELECT * FROM grito_events ORDER BY created_at DESC LIMIT 10;

# Ver webhooks pendentes
SELECT COUNT(*) FROM grito_webhook_deliveries WHERE status = 'PENDING';

# Ver automações ativas
SELECT name, match_event FROM grito_automations WHERE is_active = true;
```