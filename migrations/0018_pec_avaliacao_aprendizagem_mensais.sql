-- Avaliação de Aprendizagem PEC — scores mensais (modelo semestral, como NPS PEC)
CREATE TABLE IF NOT EXISTS pec_avaliacao_aprendizagem_mensais (
  id SERIAL PRIMARY KEY,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  score NUMERIC(5,1) NOT NULL,
  calculado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  UNIQUE (ano, mes)
);

CREATE INDEX IF NOT EXISTS idx_pec_avaliacao_ano_mes
  ON pec_avaliacao_aprendizagem_mensais (ano, mes);
