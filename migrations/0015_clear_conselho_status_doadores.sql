-- Remove conselho_status de contas de doador que não são membros do conselho.
-- Evita bloqueio indevido no login por telefone quando há status antigo de solicitação ao conselho.

UPDATE users
SET
  conselho_status = NULL,
  conselho_approved_by = NULL,
  conselho_approved_at = NULL
WHERE conselho_status IS NOT NULL
  AND COALESCE(role, '') NOT IN ('conselho', 'conselheiro')
  AND (
    tipo = 'doador'
    OR role = 'doador'
    OR subscription_status = 'active'
  );
