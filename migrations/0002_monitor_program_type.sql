-- Migration: Add program type support to monitor_participantes
-- Date: 2025-11-14
-- Description: Allow monitors to choose students from PEC or Inclusão Produtiva

-- Create enum type for program selection
CREATE TYPE program_type AS ENUM ('pec', 'inclusao');

-- Add new columns to monitor_participantes
ALTER TABLE monitor_participantes 
  ADD COLUMN program_type program_type NOT NULL DEFAULT 'inclusao',
  ADD COLUMN inclusao_participante_id INTEGER REFERENCES participantes_inclusao(id),
  ADD COLUMN pec_aluno_cpf TEXT REFERENCES aluno(cpf);

-- Migrate existing data: rename participante_id to inclusao_participante_id
UPDATE monitor_participantes
SET inclusao_participante_id = participante_id
WHERE participante_id IS NOT NULL;

-- Drop old column (after data migration)
ALTER TABLE monitor_participantes DROP COLUMN IF EXISTS participante_id;

-- Add constraint: exactly one FK must be populated
ALTER TABLE monitor_participantes
ADD CONSTRAINT check_one_student_source CHECK (
  (program_type = 'pec' AND pec_aluno_cpf IS NOT NULL AND inclusao_participante_id IS NULL) OR
  (program_type = 'inclusao' AND inclusao_participante_id IS NOT NULL AND pec_aluno_cpf IS NULL)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_monitor_participantes_inclusao ON monitor_participantes(inclusao_participante_id) WHERE inclusao_participante_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_monitor_participantes_pec ON monitor_participantes(pec_aluno_cpf) WHERE pec_aluno_cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_monitor_participantes_program_type ON monitor_participantes(program_type);
