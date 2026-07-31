-- Agendamentos de acolhimento (monitor/coordenador psico ↔ portal do aluno)
CREATE TABLE IF NOT EXISTS psico_acolhimentos (
  id SERIAL PRIMARY KEY,
  aluno_cpf VARCHAR(11) NOT NULL,
  aluno_nome VARCHAR(200) NOT NULL,
  data DATE NOT NULL,
  hora_inicio VARCHAR(8) NOT NULL,
  hora_fim VARCHAR(8),
  local TEXT,
  profissional_user_id INTEGER REFERENCES users(id),
  profissional_nome TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'agendado',
  observacao_interna TEXT,
  registro_id INTEGER,
  registro_tipo VARCHAR(40),
  criado_por_user_id INTEGER NOT NULL,
  criado_por_role VARCHAR(50),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_psico_acolhimentos_cpf ON psico_acolhimentos (aluno_cpf);
CREATE INDEX IF NOT EXISTS idx_psico_acolhimentos_data ON psico_acolhimentos (data);
CREATE INDEX IF NOT EXISTS idx_psico_acolhimentos_status ON psico_acolhimentos (status);
CREATE INDEX IF NOT EXISTS idx_psico_acolhimentos_profissional ON psico_acolhimentos (profissional_user_id);
