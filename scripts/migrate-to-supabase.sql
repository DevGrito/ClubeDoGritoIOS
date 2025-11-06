-- ================ MIGRAÇÃO PARA SUPABASE - ESTRUTURA UNIFICADA ================

-- 1. CRIAR NOVA ESTRUTURA UNIFICADA
CREATE TABLE IF NOT EXISTS usuarios_sistema (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE,
  
  -- Dados pessoais básicos
  nome VARCHAR(255) NOT NULL,
  sobrenome VARCHAR(255),
  cpf VARCHAR(11) UNIQUE,
  telefone VARCHAR(20) UNIQUE,
  email VARCHAR(255) UNIQUE,
  data_nascimento DATE,
  
  -- Identificação e acesso
  tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('super_admin', 'admin', 'professor', 'aluno', 'doador', 'responsavel', 'desenvolvedor')),
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  verificado BOOLEAN DEFAULT false,
  
  -- Dados específicos por tipo (JSONB para flexibilidade)
  dados_especificos JSONB DEFAULT '{}',
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  
  -- Campos de migração (temporários)
  migrated_from TEXT,
  original_id TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios_sistema(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios_sistema(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_verificado ON usuarios_sistema(verificado);
CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios_sistema(cpf);
CREATE INDEX IF NOT EXISTS idx_usuarios_telefone ON usuarios_sistema(telefone);

-- 2. TABELAS DE RELACIONAMENTO
CREATE TABLE IF NOT EXISTS usuario_turma_rel (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios_sistema(id) ON DELETE CASCADE,
  turma_id INTEGER REFERENCES turma(id) ON DELETE CASCADE,
  tipo_relacao TEXT NOT NULL CHECK (tipo_relacao IN ('professor', 'aluno', 'professor_lider')),
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_fim DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuario_familia_rel (
  id SERIAL PRIMARY KEY,
  responsavel_id INTEGER REFERENCES usuarios_sistema(id) ON DELETE CASCADE,
  aluno_id INTEGER REFERENCES usuarios_sistema(id) ON DELETE CASCADE,
  tipo_relacao TEXT NOT NULL CHECK (tipo_relacao IN ('pai', 'mae', 'responsavel')),
  contato_emergencia BOOLEAN DEFAULT false,
  mora_junto BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuario_sessoes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios_sistema(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  tipo_acesso TEXT NOT NULL CHECK (tipo_acesso IN ('web', 'mobile', 'api', 'dev')),
  ip_address TEXT,
  user_agent TEXT,
  ultimo_acesso TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ================ MIGRAÇÃO DE DADOS ================

-- 3. MIGRAR DESENVOLVEDORES
INSERT INTO usuarios_sistema (
  nome, email, tipo_usuario, verificado, dados_especificos, created_at, migrated_from, original_id
)
SELECT 
  nome,
  email,
  'desenvolvedor',
  ativo,
  jsonb_build_object(
    'usuario', usuario,
    'ultimo_acesso', ultimo_acesso,
    'permissoes', 'admin_total',
    'senha_hash', senha
  ),
  created_at,
  'developers',
  id::text
FROM developers
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios_sistema 
  WHERE migrated_from = 'developers' AND original_id = developers.id::text
);

-- 4. MIGRAR USUÁRIOS (Professores/Doadores)
INSERT INTO usuarios_sistema (
  nome, sobrenome, cpf, telefone, email, tipo_usuario, verificado, dados_especificos, created_at, migrated_from, original_id
)
SELECT 
  nome,
  sobrenome,
  cpf,
  telefone,
  email,
  CASE 
    WHEN professor_tipo = 'lider' THEN 'professor'
    WHEN role = 'professor' OR professor_tipo = 'professor' THEN 'professor'
    ELSE 'doador'
  END,
  COALESCE(verificado, false),
  jsonb_build_object(
    'plano', plano,
    'formacao', formacao,
    'experiencia', experiencia,
    'especializacao', especializacao,
    'disciplinas', disciplinas,
    'conselho_status', conselho_status,
    'professor_tipo', professor_tipo,
    'role_original', role
  ),
  created_at,
  'users',
  id::text
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios_sistema 
  WHERE migrated_from = 'users' AND original_id = users.id::text
);

-- 5. MIGRAR ALUNOS
INSERT INTO usuarios_sistema (
  nome, cpf, telefone, email, data_nascimento, tipo_usuario, dados_especificos, created_at, migrated_from, original_id
)
SELECT 
  nome_completo,
  cpf,
  COALESCE(telefone, whatsapp, 'SEM_TELEFONE_' || cpf),
  COALESCE(email, 'sem_email_' || cpf || '@temp.local'),
  data_nascimento,
  'aluno',
  jsonb_build_object(
    'numero_matricula', numero_matricula,
    'professor_id_original', professor_id,
    'dados_escolares', jsonb_build_object(
      'escola', nome_escola,
      'serie', serie_ano,
      'turno', turno,
      'escolaridade', escolaridade
    ),
    'endereco', jsonb_build_object(
      'cep', cep,
      'logradouro', logradouro,
      'numero', numero,
      'bairro', bairro,
      'cidade', cidade,
      'estado', estado,
      'complemento', complemento
    ),
    'dados_sociais', jsonb_build_object(
      'renda_familiar', renda_familiar,
      'bolsa_familia', bolsa_familia,
      'bpc', bpc,
      'cartao_alimentacao', cartao_alimentacao,
      'outros_beneficios', outros_beneficios
    ),
    'dados_saude', jsonb_build_object(
      'possui_alergia', possui_alergia,
      'qual_alergia', qual_alergia,
      'medicamentos', qual_medicamento,
      'problemas_saude', qual_problema_saude,
      'deficiencia', qual_deficiencia
    ),
    'contatos', jsonb_build_object(
      'pessoa_contato', pessoa_contato,
      'telefone_contato', telefone_contato,
      'whatsapp_contato', whatsapp_contato,
      'emergencia_nome', contato_emergencia_nome,
      'emergencia_telefone', contato_emergencia_telefone
    )
  ),
  created_at,
  'aluno',
  cpf
FROM aluno
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios_sistema 
  WHERE migrated_from = 'aluno' AND original_id = aluno.cpf
);

-- 6. MIGRAR PAIS
INSERT INTO usuarios_sistema (
  nome, cpf, telefone, tipo_usuario, dados_especificos, created_at, migrated_from, original_id
)
SELECT 
  nome_completo,
  cpf,
  COALESCE(telefone, 'SEM_TELEFONE_PAI_' || cpf),
  'responsavel',
  jsonb_build_object(
    'tipo_responsavel', 'pai',
    'profissao', profissao,
    'mora_com_aluno', mora_com_aluno,
    'e_responsavel', e_responsavel
  ),
  created_at,
  'pais',
  id::text
FROM pais
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios_sistema 
  WHERE migrated_from = 'pais' AND original_id = pais.id::text
);

-- 7. MIGRAR MÃES
INSERT INTO usuarios_sistema (
  nome, cpf, telefone, tipo_usuario, dados_especificos, created_at, migrated_from, original_id
)
SELECT 
  nome_completo,
  cpf,
  COALESCE(telefone, 'SEM_TELEFONE_MAE_' || cpf),
  'responsavel',
  jsonb_build_object(
    'tipo_responsavel', 'mae',
    'profissao', profissao,
    'mora_com_aluno', mora_com_aluno,
    'e_responsavel', e_responsavel
  ),
  created_at,
  'maes',
  id::text
FROM maes
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios_sistema 
  WHERE migrated_from = 'maes' AND original_id = maes.id::text
);

-- 8. MIGRAR RESPONSÁVEIS
INSERT INTO usuarios_sistema (
  nome, cpf, telefone, email, tipo_usuario, dados_especificos, created_at, migrated_from, original_id
)
SELECT 
  nome_completo,
  cpf,
  COALESCE(telefone, 'SEM_TELEFONE_RESP_' || cpf),
  email,
  'responsavel',
  jsonb_build_object(
    'tipo_responsavel', 'responsavel',
    'grau_parentesco', grau_parentesco,
    'profissao', profissao,
    'mora_com_aluno', mora_com_aluno,
    'contato_emergencia', e_contato_emergencia
  ),
  created_at,
  'responsaveis',
  id::text
FROM responsaveis
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios_sistema 
  WHERE migrated_from = 'responsaveis' AND original_id = responsaveis.id::text
);

-- 9. ADICIONAR LEO MARTINS SE NÃO EXISTIR
INSERT INTO usuarios_sistema (
  nome, sobrenome, telefone, email, tipo_usuario, verificado, dados_especificos, created_at, migrated_from
)
SELECT 
  'Leo', 
  'Martins',
  'LEO_ESPECIAL',
  'leo@clubedogrito.com',
  'super_admin',
  true,
  jsonb_build_object(
    'acesso_especial', true,
    'permissoes', 'todas',
    'gestao_vista', true
  ),
  NOW(),
  'sistema_especial'
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios_sistema 
  WHERE tipo_usuario = 'super_admin' AND nome = 'Leo' AND sobrenome = 'Martins'
);

-- ================ CRIAR RELACIONAMENTOS ================

-- 10. RELACIONAR PROFESSORES COM TURMAS
INSERT INTO usuario_turma_rel (usuario_id, turma_id, tipo_relacao, data_inicio)
SELECT 
  us.id,
  t.id,
  CASE 
    WHEN us.dados_especificos->>'professor_tipo' = 'lider' THEN 'professor_lider'
    ELSE 'professor'
  END,
  CURRENT_DATE
FROM usuarios_sistema us
JOIN turma t ON us.dados_especificos->>'original_id' = t.professor_id::text
WHERE us.migrated_from = 'users' 
  AND us.tipo_usuario = 'professor'
  AND NOT EXISTS (
    SELECT 1 FROM usuario_turma_rel utr 
    WHERE utr.usuario_id = us.id AND utr.turma_id = t.id
  );

-- 11. RELACIONAR ALUNOS COM TURMAS
INSERT INTO usuario_turma_rel (usuario_id, turma_id, tipo_relacao, data_inicio, ativo)
SELECT 
  us.id,
  at.turma_id,
  'aluno',
  COALESCE(at.data_matricula, CURRENT_DATE),
  COALESCE(at.status = 'ativo', true)
FROM usuarios_sistema us
JOIN aluno_turma at ON us.original_id = at.aluno_cpf
WHERE us.migrated_from = 'aluno'
  AND NOT EXISTS (
    SELECT 1 FROM usuario_turma_rel utr 
    WHERE utr.usuario_id = us.id AND utr.turma_id = at.turma_id
  );

-- 12. RELACIONAR FAMÍLIAS (Pais/Mães/Responsáveis com Alunos)
-- Relacionar pais com alunos
INSERT INTO usuario_familia_rel (responsavel_id, aluno_id, tipo_relacao, mora_junto, contato_emergencia)
SELECT 
  us_resp.id,
  us_aluno.id,
  'pai',
  (us_resp.dados_especificos->>'mora_com_aluno')::boolean,
  (us_resp.dados_especificos->>'e_responsavel')::boolean
FROM usuarios_sistema us_resp
JOIN usuarios_sistema us_aluno ON us_aluno.dados_especificos->>'id_pai' = us_resp.original_id
WHERE us_resp.migrated_from = 'pais' 
  AND us_aluno.migrated_from = 'aluno'
  AND us_aluno.dados_especificos->>'id_pai' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM usuario_familia_rel ufr 
    WHERE ufr.responsavel_id = us_resp.id AND ufr.aluno_id = us_aluno.id
  );

-- Relacionar mães com alunos
INSERT INTO usuario_familia_rel (responsavel_id, aluno_id, tipo_relacao, mora_junto, contato_emergencia)
SELECT 
  us_resp.id,
  us_aluno.id,
  'mae',
  (us_resp.dados_especificos->>'mora_com_aluno')::boolean,
  (us_resp.dados_especificos->>'e_responsavel')::boolean
FROM usuarios_sistema us_resp
JOIN usuarios_sistema us_aluno ON us_aluno.dados_especificos->>'id_mae' = us_resp.original_id
WHERE us_resp.migrated_from = 'maes' 
  AND us_aluno.migrated_from = 'aluno'
  AND us_aluno.dados_especificos->>'id_mae' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM usuario_familia_rel ufr 
    WHERE ufr.responsavel_id = us_resp.id AND ufr.aluno_id = us_aluno.id
  );

-- Relacionar responsáveis com alunos
INSERT INTO usuario_familia_rel (responsavel_id, aluno_id, tipo_relacao, mora_junto, contato_emergencia)
SELECT 
  us_resp.id,
  us_aluno.id,
  'responsavel',
  (us_resp.dados_especificos->>'mora_com_aluno')::boolean,
  (us_resp.dados_especificos->>'contato_emergencia')::boolean
FROM usuarios_sistema us_resp
JOIN usuarios_sistema us_aluno ON us_aluno.dados_especificos->>'id_responsavel' = us_resp.original_id
WHERE us_resp.migrated_from = 'responsaveis' 
  AND us_aluno.migrated_from = 'aluno'
  AND us_aluno.dados_especificos->>'id_responsavel' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM usuario_familia_rel ufr 
    WHERE ufr.responsavel_id = us_resp.id AND ufr.aluno_id = us_aluno.id
  );

-- ================ VALIDAÇÃO E RELATÓRIOS ================

-- 13. RELATÓRIO DE MIGRAÇÃO
DO $$
BEGIN
  RAISE NOTICE '================ RELATÓRIO DE MIGRAÇÃO ================';
  RAISE NOTICE 'Total usuários migrados: %', (SELECT COUNT(*) FROM usuarios_sistema);
  RAISE NOTICE 'Desenvolvedores: %', (SELECT COUNT(*) FROM usuarios_sistema WHERE tipo_usuario = 'desenvolvedor');
  RAISE NOTICE 'Professores: %', (SELECT COUNT(*) FROM usuarios_sistema WHERE tipo_usuario = 'professor');
  RAISE NOTICE 'Alunos: %', (SELECT COUNT(*) FROM usuarios_sistema WHERE tipo_usuario = 'aluno');
  RAISE NOTICE 'Doadores: %', (SELECT COUNT(*) FROM usuarios_sistema WHERE tipo_usuario = 'doador');
  RAISE NOTICE 'Responsáveis: %', (SELECT COUNT(*) FROM usuarios_sistema WHERE tipo_usuario = 'responsavel');
  RAISE NOTICE 'Super Admins: %', (SELECT COUNT(*) FROM usuarios_sistema WHERE tipo_usuario = 'super_admin');
  RAISE NOTICE 'Relacionamentos turma: %', (SELECT COUNT(*) FROM usuario_turma_rel);
  RAISE NOTICE 'Relacionamentos família: %', (SELECT COUNT(*) FROM usuario_familia_rel);
  RAISE NOTICE '=====================================================';
END $$;

-- 14. VERIFICAR INTEGRIDADE
SELECT 
  'MIGRAÇÃO CONCLUÍDA' as status,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN tipo_usuario = 'desenvolvedor' THEN 1 END) as desenvolvedores,
  COUNT(CASE WHEN tipo_usuario = 'professor' THEN 1 END) as professores,
  COUNT(CASE WHEN tipo_usuario = 'aluno' THEN 1 END) as alunos,
  COUNT(CASE WHEN tipo_usuario = 'doador' THEN 1 END) as doadores,
  COUNT(CASE WHEN tipo_usuario = 'responsavel' THEN 1 END) as responsaveis,
  COUNT(CASE WHEN tipo_usuario = 'super_admin' THEN 1 END) as super_admins
FROM usuarios_sistema;