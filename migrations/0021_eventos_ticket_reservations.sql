-- Reserva de ingressos antes da cobrança + vínculo com pedido
-- Espelha ensurePaymentOrdersTable() (idempotente)

ALTER TABLE ingressos_portal
  ADD COLUMN IF NOT EXISTS order_ref TEXT,
  ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS gateway TEXT,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS valor_pago INTEGER,
  ADD COLUMN IF NOT EXISTS parcelas INTEGER,
  ADD COLUMN IF NOT EXISTS beneficiario_nascimento DATE,
  ADD COLUMN IF NOT EXISTS beneficiario_genero TEXT,
  ADD COLUMN IF NOT EXISTS beneficiario_logradouro TEXT,
  ADD COLUMN IF NOT EXISTS beneficiario_numero TEXT,
  ADD COLUMN IF NOT EXISTS beneficiario_bairro TEXT,
  ADD COLUMN IF NOT EXISTS beneficiario_cidade TEXT,
  ADD COLUMN IF NOT EXISTS beneficiario_estado TEXT,
  ADD COLUMN IF NOT EXISTS beneficiario_cep TEXT;

CREATE INDEX IF NOT EXISTS idx_ingressos_portal_order_ref
  ON ingressos_portal(order_ref);

CREATE INDEX IF NOT EXISTS idx_ingressos_portal_reservado_expira
  ON ingressos_portal(status, reserved_until)
  WHERE status = 'reservado';

ALTER TABLE event_payment_orders
  ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fulfilled_em TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_epo_evento ON event_payment_orders(evento_id);
CREATE INDEX IF NOT EXISTS idx_epo_cielo_payment ON event_payment_orders(cielo_payment_id);
CREATE INDEX IF NOT EXISTS idx_epo_reserved_until ON event_payment_orders(reserved_until);
