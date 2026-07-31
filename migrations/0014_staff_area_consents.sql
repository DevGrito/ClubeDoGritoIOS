-- Aceites por área vinculados à ficha de staff (prova LGPD independente de users.id)

CREATE TABLE IF NOT EXISTS staff_area_consents (
  id SERIAL PRIMARY KEY,
  staff_kind VARCHAR(30) NOT NULL,
  staff_id INTEGER NOT NULL,
  consent_area VARCHAR(50) NOT NULL,
  policy_bundle_id VARCHAR(200) NOT NULL,
  privacy_policy_version VARCHAR(10) DEFAULT '1.0',
  terms_version VARCHAR(10) DEFAULT '1.0',
  image_use BOOLEAN NOT NULL DEFAULT FALSE,
  communications BOOLEAN NOT NULL DEFAULT FALSE,
  marketing BOOLEAN NOT NULL DEFAULT FALSE,
  source VARCHAR(100),
  ip_address VARCHAR(100),
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT staff_area_consents_unique UNIQUE (staff_kind, staff_id, consent_area, policy_bundle_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_area_consents_lookup
  ON staff_area_consents (staff_kind, staff_id, consent_area);
