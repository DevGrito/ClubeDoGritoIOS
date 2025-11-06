CREATE TABLE IF NOT EXISTS conselho_dados_realizados (
  id SERIAL PRIMARY KEY,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  departamento VARCHAR(100) NOT NULL,
  contas_a_receber NUMERIC(15,2) DEFAULT 0,
  contas_a_pagar NUMERIC(15,2) DEFAULT 0,
  saldo NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ano, mes, departamento)
);

INSERT INTO conselho_dados_realizados (ano, mes, departamento, contas_a_receber, contas_a_pagar, saldo)
VALUES
  (2025, 1, 'COMUNICAÇÃO INTEGRADA', 0, -14552.82, -14552.82),
  (2025, 1, 'CONTROLE & GESTÃO', 182726.24, -61355.89, 121370.35),
  (2025, 1, 'ESPORTE & CULTURA', 130000.00, -32936.51, 97063.49),
  (2025, 1, 'INCLUSÃO PRODUTIVA', 0, -10934.90, -10934.90),
  (2025, 1, 'NEGÓCIOS SOCIAIS', 5740.48, -13923.46, -8182.98),
  (2025, 1, 'PSICOSSOCIAL', 0, -2489.19, -2489.19),
  (2025, 1, 'TOTAL', 318466.72, -136192.77, 182273.95)
ON CONFLICT (ano, mes, departamento) DO NOTHING;
