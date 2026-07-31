-- P0/P1: auditoria push universal + opt-out + backfill público in-app

ALTER TABLE push_logs ADD COLUMN IF NOT EXISTS origem TEXT;
ALTER TABLE push_logs ADD COLUMN IF NOT EXISTS canal TEXT DEFAULT 'push';
ALTER TABLE push_logs ADD COLUMN IF NOT EXISTS disparado_por_user_id INTEGER REFERENCES users(id);
ALTER TABLE push_logs ADD COLUMN IF NOT EXISTS skipped_reason TEXT;

ALTER TABLE fcm_tokens ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE fcm_tokens ADD COLUMN IF NOT EXISTS opt_out_at TIMESTAMPTZ;
ALTER TABLE fcm_tokens ADD COLUMN IF NOT EXISTS opt_out_reason TEXT;

UPDATE in_app_notifications SET target_audience = 'donors_only' WHERE target_audience = 'donors';
