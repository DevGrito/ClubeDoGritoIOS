-- Antes de aplicar, verifique duplicatas:
-- SELECT turma_id, data, COUNT(*) AS qtd, array_agg(id ORDER BY id) AS ids
-- FROM plano_aula
-- GROUP BY turma_id, data
-- HAVING COUNT(*) > 1;
--
-- Se houver duplicatas, mantenha apenas o registro mais antigo (menor id) por par (turma_id, data):
-- DELETE FROM plano_aula pa
-- USING (
--   SELECT turma_id, data, MIN(id) AS keep_id
--   FROM plano_aula
--   GROUP BY turma_id, data
--   HAVING COUNT(*) > 1
-- ) d
-- WHERE pa.turma_id = d.turma_id AND pa.data = d.data AND pa.id <> d.keep_id;

CREATE UNIQUE INDEX IF NOT EXISTS plano_aula_turma_data_unique ON plano_aula (turma_id, data);
