-- Migration: Acesso de coordenador para Negócios Sociais e Almoxarifado
-- Login: /login/coordenador (tabela coordenadores)
--
-- Contas criadas (alterar senha após primeiro acesso em produção):
--   almoxarifado@institutoogrito.org  / Almoxa2026!
--   negocios@institutoogrito.com.br        / Negocios123

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'coord_setor' AND e.enumlabel = 'negocios_sociais'
  ) THEN
    ALTER TYPE coord_setor ADD VALUE 'negocios_sociais';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'coord_setor' AND e.enumlabel = 'almoxarifado'
  ) THEN
    ALTER TYPE coord_setor ADD VALUE 'almoxarifado';
  END IF;
END $$;

INSERT INTO coordenadores (
  nome,
  email,
  password_hash,
  setor,
  redirect_path,
  ativo,
  primeiro_acesso
)
SELECT v.nome, v.email, v.password_hash, v.setor, v.redirect_path, v.ativo, v.primeiro_acesso
FROM (VALUES
  (
    'Almoxarifado',
    'almoxarifado@institutoogrito.org',
    '$2a$10$M7ziitztb3wRuNVg4WwO0ulDBmo.yeyzHBYgKIBQXZJdXWkw1K5KC',
    'almoxarifado'::coord_setor,
    '/coordenador/almoxarifado',
    true,
    false
  ),
  (
    'Negócios Sociais',
    'negocios@institutoogrito.com.br',
    '$2a$10$bBmMrIOXlQwk/SPSNzF4T.lZ2cCQ3PZcMwrbMJk0xIKjA/10kZCny',
    'negocios_sociais'::coord_setor,
    '/coordenador/negocios-sociais',
    true,
    false
  )
) AS v(nome, email, password_hash, setor, redirect_path, ativo, primeiro_acesso)
WHERE NOT EXISTS (
  SELECT 1 FROM coordenadores c WHERE lower(c.email) = lower(v.email)
);

COMMENT ON COLUMN coordenadores.setor IS 'Vertente: psicossocial, esporte_cultura, inclusao_produtiva, tecnica_psico, negocios_sociais, almoxarifado';
