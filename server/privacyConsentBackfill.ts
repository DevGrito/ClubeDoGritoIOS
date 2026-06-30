import type { Pool } from "pg";
import { computeServerConsentIntegrity } from "./privacyConsentLgpd";
import { getPolicyBundleId } from "../shared/lgpdPolicyVersions";
import { upsertPrivacyConsentForUser } from "./privacyConsentUser";

export type LgpdCoverageMetrics = {
  totalUsers: number;
  usersWithTermos: number;
  usersWithLinkedConsent: number;
  usersWithTermosSemPrivacy: number;
  consentRecordsTotal: number;
  consentLinkedRecords: number;
  anonymousOnlyRecords: number;
  fullyOrphanRecords: number;
  missingHmacRecords: number;
  staleAnonymous7d: number;
  linkedConsentPct: number;
  termosCoveragePct: number;
};

export async function queryLgpdCoverageMetrics(pool: Pool): Promise<LgpdCoverageMetrics> {
  const result = await pool.query<{
    total_users: number;
    users_with_termos: number;
    users_with_linked_consent: number;
    users_with_termos_sem_privacy: number;
    consent_records_total: number;
    consent_linked_records: number;
    anonymous_only_records: number;
    fully_orphan_records: number;
    missing_hmac_records: number;
    stale_anonymous_7d: number;
  }>(`
    SELECT
      (SELECT COUNT(*)::int FROM users) AS total_users,
      (SELECT COUNT(*)::int FROM users WHERE termos_uso_aceito_em IS NOT NULL) AS users_with_termos,
      (SELECT COUNT(DISTINCT user_id)::int FROM privacy_consents WHERE user_id IS NOT NULL) AS users_with_linked_consent,
      (SELECT COUNT(*)::int FROM users u
        WHERE u.termos_uso_aceito_em IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM privacy_consents pc WHERE pc.user_id = u.id)
      ) AS users_with_termos_sem_privacy,
      (SELECT COUNT(*)::int FROM privacy_consents) AS consent_records_total,
      (SELECT COUNT(*)::int FROM privacy_consents WHERE user_id IS NOT NULL) AS consent_linked_records,
      (SELECT COUNT(*)::int FROM privacy_consents
        WHERE user_id IS NULL AND anonymous_consent_id IS NOT NULL) AS anonymous_only_records,
      (SELECT COUNT(*)::int FROM privacy_consents
        WHERE user_id IS NULL AND anonymous_consent_id IS NULL) AS fully_orphan_records,
      (SELECT COUNT(*)::int FROM privacy_consents WHERE consent_hmac IS NULL) AS missing_hmac_records,
      (SELECT COUNT(*)::int FROM privacy_consents
        WHERE user_id IS NULL
          AND anonymous_consent_id IS NOT NULL
          AND updated_at < NOW() - INTERVAL '7 days') AS stale_anonymous_7d
  `);

  const row = result.rows[0];
  const totalUsers = row?.total_users ?? 0;
  const usersWithLinkedConsent = row?.users_with_linked_consent ?? 0;
  const usersWithTermos = row?.users_with_termos ?? 0;

  return {
    totalUsers,
    usersWithTermos,
    usersWithLinkedConsent,
    usersWithTermosSemPrivacy: row?.users_with_termos_sem_privacy ?? 0,
    consentRecordsTotal: row?.consent_records_total ?? 0,
    consentLinkedRecords: row?.consent_linked_records ?? 0,
    anonymousOnlyRecords: row?.anonymous_only_records ?? 0,
    fullyOrphanRecords: row?.fully_orphan_records ?? 0,
    missingHmacRecords: row?.missing_hmac_records ?? 0,
    staleAnonymous7d: row?.stale_anonymous_7d ?? 0,
    linkedConsentPct:
      totalUsers > 0 ? Math.round((usersWithLinkedConsent / totalUsers) * 1000) / 10 : 0,
    termosCoveragePct:
      usersWithTermos > 0
        ? Math.round(((usersWithTermos - (row?.users_with_termos_sem_privacy ?? 0)) / usersWithTermos) * 1000) / 10
        : 0,
  };
}

export type BackfillResult = {
  dryRun: boolean;
  termosBackfill: { candidates: number; inserted: number };
  hmacBackfill: { candidates: number; updated: number };
  legacyTagged: { candidates: number; updated: number };
  metricsAfter: LgpdCoverageMetrics;
};

/** Backfill one-time: termos aceitos → privacy_consents, HMAC legado, tag órfãos. */
export async function runPrivacyConsentBackfill(
  pool: Pool,
  options?: { dryRun?: boolean; termosLimit?: number; hmacLimit?: number }
): Promise<BackfillResult> {
  const dryRun = options?.dryRun === true;
  const termosLimit = Math.min(5000, Math.max(1, options?.termosLimit ?? 2000));
  const hmacLimit = Math.min(5000, Math.max(1, options?.hmacLimit ?? 2000));

  const termosCandidates = await pool.query<{
    id: number;
    termos_uso_aceito_em: string;
    termos_uso_versao: string | null;
  }>(
    `SELECT u.id, u.termos_uso_aceito_em, u.termos_uso_versao
       FROM users u
      WHERE u.termos_uso_aceito_em IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM privacy_consents pc WHERE pc.user_id = u.id)
      ORDER BY u.termos_uso_aceito_em ASC
      LIMIT $1`,
    [termosLimit]
  );

  let termosInserted = 0;
  if (!dryRun) {
    for (const row of termosCandidates.rows) {
      await upsertPrivacyConsentForUser(
        row.id,
        {
          necessary: true,
          analytics: false,
          functional: false,
          marketing: false,
          image_use: false,
          communications: false,
        },
        {
          ip: null,
          ua: "lgpd-backfill/termos",
          source: "backfill_termos",
          consentArea: "general",
        }
      );
      termosInserted++;
    }
  }

  const hmacCandidates = await pool.query<{ id: number }>(
    `SELECT id FROM privacy_consents
      WHERE consent_hmac IS NULL
      ORDER BY updated_at ASC
      LIMIT $1`,
    [hmacLimit]
  );

  let hmacUpdated = 0;
  if (!dryRun) {
    for (const { id } of hmacCandidates.rows) {
      const rowRes = await pool.query(
        `SELECT consent_area, consent_version, privacy_policy_version, cookie_policy_version,
                terms_version, image_policy_version, necessary, analytics, functional,
                marketing, image_use, communications
           FROM privacy_consents WHERE id = $1`,
        [id]
      );
      const r = rowRes.rows[0];
      if (!r) continue;

      const integrity = computeServerConsentIntegrity({
        consent_area: r.consent_area || "general",
        consent_version: r.consent_version || "1.0",
        privacy_policy_version: r.privacy_policy_version || "1.0",
        cookie_policy_version: r.cookie_policy_version || "1.0",
        terms_version: r.terms_version || "1.0",
        image_policy_version: r.image_policy_version || "1.0",
        necessary: r.necessary !== false,
        analytics: !!r.analytics,
        functional: !!r.functional,
        marketing: !!r.marketing,
        image_use: !!r.image_use,
        communications: !!r.communications,
      });

      await pool.query(
        `UPDATE privacy_consents
            SET consent_hmac = $1,
                policy_hash = COALESCE(policy_hash, $2),
                policy_bundle_id = COALESCE(policy_bundle_id, $3),
                updated_at = updated_at
          WHERE id = $4`,
        [integrity.consentHmac, integrity.policyHash, getPolicyBundleId(), id]
      );
      hmacUpdated++;
    }
  }

  const legacyCandidates = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM privacy_consents
      WHERE user_id IS NULL
        AND anonymous_consent_id IS NULL
        AND COALESCE(source, '') NOT IN ('legacy_pre_anon', 'data_request')`
  );
  const legacyCount = Number(legacyCandidates.rows[0]?.count ?? 0);

  let legacyUpdated = 0;
  if (!dryRun && legacyCount > 0) {
    const tagRes = await pool.query(
      `UPDATE privacy_consents
          SET source = 'legacy_pre_anon'
        WHERE user_id IS NULL
          AND anonymous_consent_id IS NULL
          AND COALESCE(source, '') NOT IN ('legacy_pre_anon', 'data_request')`
    );
    legacyUpdated = tagRes.rowCount ?? 0;
  }

  const metricsAfter = await queryLgpdCoverageMetrics(pool);

  return {
    dryRun,
    termosBackfill: {
      candidates: termosCandidates.rows.length,
      inserted: dryRun ? 0 : termosInserted,
    },
    hmacBackfill: {
      candidates: hmacCandidates.rows.length,
      updated: dryRun ? 0 : hmacUpdated,
    },
    legacyTagged: {
      candidates: legacyCount,
      updated: dryRun ? 0 : legacyUpdated,
    },
    metricsAfter,
  };
}
