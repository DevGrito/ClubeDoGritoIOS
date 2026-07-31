-- Status de formação por matrícula na turma PEC (ativo | concluido | reprovado)
ALTER TABLE instance_enrollments
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo';

UPDATE instance_enrollments SET status = 'ativo' WHERE status IS NULL;
