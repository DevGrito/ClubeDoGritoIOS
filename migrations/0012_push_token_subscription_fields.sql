-- Campos extras em fcm_tokens: user_id, user_agent, chaves Web Push

ALTER TABLE fcm_tokens ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE fcm_tokens ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE fcm_tokens ADD COLUMN IF NOT EXISTS push_endpoint TEXT;
ALTER TABLE fcm_tokens ADD COLUMN IF NOT EXISTS push_p256dh TEXT;
ALTER TABLE fcm_tokens ADD COLUMN IF NOT EXISTS push_auth TEXT;

CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id) WHERE user_id IS NOT NULL;

-- Backfill user_id a partir de user_key numérico (doador/staff) quando users.id existe
UPDATE fcm_tokens ft
SET user_id = ft.user_key::integer
WHERE ft.user_id IS NULL
  AND ft.user_type <> 'aluno'
  AND ft.user_key ~ '^[0-9]+$'
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = ft.user_key::integer);

-- Backfill aluno via CPF
UPDATE fcm_tokens ft
SET user_id = u.id
FROM users u
WHERE ft.user_id IS NULL
  AND ft.user_type = 'aluno'
  AND REGEXP_REPLACE(COALESCE(u.cpf, ''), '[^0-9]', '', 'g') = ft.user_key;
