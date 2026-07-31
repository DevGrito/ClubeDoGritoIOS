-- Migration: Atualizar e-mail do coordenador de almoxarifado para domínio .org
-- Login: /login/coordenador

DELETE FROM coordenadores d
WHERE lower(d.email) = 'almoxarifado@institutoogrito.org'
  AND EXISTS (
    SELECT 1 FROM coordenadores o
    WHERE lower(o.email) = 'almoxarifado@institutoogrito.com.br'
  )
  AND d.id > (
    SELECT min(c.id) FROM coordenadores c
    WHERE lower(c.email) IN (
      'almoxarifado@institutoogrito.com.br',
      'almoxarifado@institutoogrito.org'
    )
  );

UPDATE coordenadores
SET email = 'almoxarifado@institutoogrito.org'
WHERE lower(email) = 'almoxarifado@institutoogrito.com.br';
