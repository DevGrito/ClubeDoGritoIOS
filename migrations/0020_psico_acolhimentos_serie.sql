-- Série recorrente de acolhimentos (cancelar/excluir em lote)
ALTER TABLE psico_acolhimentos
  ADD COLUMN IF NOT EXISTS serie_id VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_psico_acolhimentos_serie ON psico_acolhimentos (serie_id);
