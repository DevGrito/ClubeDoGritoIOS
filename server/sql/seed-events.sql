-- ================ SEED DADOS PARA SISTEMA DE EVENTOS E WEBHOOKS ================

-- Inserir uma assinatura de webhook para CRM de doadores
INSERT INTO grito_webhook_subscriptions 
  (destination_name, endpoint_url, secret, event_filter, is_active)
VALUES 
  (
    'CRM-Doadores',
    'https://meu-crm.org/webhooks/grito',
    'SECRETO_LONGO_WEBHOOK_CRM_DOADORES_2024',
    ARRAY['user.signed_up', 'donation.created', 'plan.subscribed', 'payment.failed'],
    true
  )
ON CONFLICT (destination_name) DO UPDATE SET
  endpoint_url = EXCLUDED.endpoint_url,
  event_filter = EXCLUDED.event_filter,
  updated_at = NOW();

-- Inserir automação de boas-vindas por email
INSERT INTO grito_automations 
  (name, match_event, action, is_active)
VALUES 
  (
    'Boas-vindas',
    'user.signed_up',
    '{
      "type": "email",
      "template_id": "welcome_01",
      "to": "{{payload.email}}",
      "variables": {
        "nome": "{{payload.name}}"
      }
    }',
    true
  )
ON CONFLICT (name) DO UPDATE SET
  action = EXCLUDED.action,
  updated_at = NOW();

-- Inserir automação de email para falha de pagamento
INSERT INTO grito_automations 
  (name, match_event, action, is_active)
VALUES 
  (
    'Falha de Pagamento - Email',
    'payment.failed',
    '{
      "type": "email",
      "template_id": "payment_failed_01",
      "to": "{{payload.email}}",
      "variables": {
        "nome": "{{payload.name}}",
        "valor": "{{payload.amount}}",
        "plano": "{{payload.plan}}"
      }
    }',
    true
  )
ON CONFLICT (name) DO UPDATE SET
  action = EXCLUDED.action,
  updated_at = NOW();

-- Inserir automação de webhook para novos doadores
INSERT INTO grito_automations 
  (name, match_event, action, is_active)
VALUES 
  (
    'Notificação CRM - Novo Doador',
    'donation.created',
    '{
      "type": "webhook",
      "endpoint_ref": "CRM-Doadores"
    }',
    true
  )
ON CONFLICT (name) DO UPDATE SET
  action = EXCLUDED.action,
  updated_at = NOW();

-- Inserir automação de email para assinatura de plano
INSERT INTO grito_automations 
  (name, match_event, action, is_active)
VALUES 
  (
    'Confirmação de Plano',
    'plan.subscribed',
    '{
      "type": "email",
      "template_id": "plan_confirmed_01",
      "to": "{{payload.email}}",
      "variables": {
        "nome": "{{payload.name}}",
        "plano": "{{payload.plan}}",
        "valor": "{{payload.amount}}"
      }
    }',
    true
  )
ON CONFLICT (name) DO UPDATE SET
  action = EXCLUDED.action,
  updated_at = NOW();

-- Verificar dados inseridos
SELECT 
  'Webhook Subscriptions' as tipo,
  COUNT(*) as total,
  STRING_AGG(destination_name, ', ') as items
FROM grito_webhook_subscriptions
WHERE is_active = true

UNION ALL

SELECT 
  'Automations' as tipo,
  COUNT(*) as total,
  STRING_AGG(name, ', ') as items
FROM grito_automations
WHERE is_active = true;