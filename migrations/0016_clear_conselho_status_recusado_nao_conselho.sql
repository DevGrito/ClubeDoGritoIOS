-- Remove conselho_status = 'recusado' de contas que NÃO são do conselho.
-- Complementa a 0015: cobre doadores/usuários comuns que não eram
-- detectados como doador (tipo/role/subscription_status), mas que tinham
-- um status "recusado" antigo de solicitação ao conselho e por isso eram
-- barrados indevidamente no login por telefone.

UPDATE users
SET
  conselho_status = NULL,
  conselho_approved_by = NULL,
  conselho_approved_at = NULL
WHERE conselho_status = 'recusado'
  AND COALESCE(role, '') NOT IN ('conselho', 'conselheiro');
