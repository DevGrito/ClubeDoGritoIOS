import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DO_DB_HOST,
  port: parseInt(process.env.DO_DB_PORT || '5433'),
  user: process.env.DO_DB_USER,
  password: process.env.DO_DB_PASSWORD,
  database: process.env.DO_DB_NAME,
  ssl: false,
});

const INSTAGRAM_BUSINESS_ID = process.env.INSTAGRAM_BUSINESS_ID || '17841404647336835';
const BASE_URL = 'https://graph.facebook.com/v19.0';

// Token cache em memória (evita query ao banco a cada chamada)
let _tokenCache: { value: string; loadedAt: number } | null = null;
const TOKEN_CACHE_TTL = 5 * 60 * 1000; // 5 min

async function getTokenFromDb(): Promise<string | null> {
  try {
    const r = await pool.query(`SELECT valor FROM configuracoes_meta WHERE chave = 'page_access_token' LIMIT 1`);
    return r.rows[0]?.valor || null;
  } catch {
    return null;
  }
}

export async function getToken(): Promise<string | null> {
  const now = Date.now();
  if (_tokenCache && (now - _tokenCache.loadedAt) < TOKEN_CACHE_TTL) {
    return _tokenCache.value;
  }
  const dbToken = await getTokenFromDb();
  const token = dbToken || process.env.META_PAGE_ACCESS_TOKEN || null;
  if (token) _tokenCache = { value: token, loadedAt: now };
  return token;
}

export async function saveToken(token: string, expiresAt?: Date): Promise<void> {
  _tokenCache = null;
  await pool.query(
    `INSERT INTO configuracoes_meta (chave, valor, expires_at, updated_at)
     VALUES ('page_access_token', $1, $2, NOW())
     ON CONFLICT (chave) DO UPDATE SET valor = $1, expires_at = $2, updated_at = NOW()`,
    [token, expiresAt || null]
  );
  console.log('[Instagram] Token salvo no banco.' + (expiresAt ? ` Expira em: ${expiresAt.toISOString()}` : ' (sem expiração)'));
}

// Troca token curto por token de longa duração (60 dias)
export async function exchangeForLongLivedToken(shortToken: string, appId: string, appSecret: string): Promise<{ token: string; expiresIn: number }> {
  const url = new URL(`${BASE_URL}/oauth/access_token`);
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('client_secret', appSecret);
  url.searchParams.set('fb_exchange_token', shortToken);

  const res = await fetch(url.toString());
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error?.message || 'Falha ao trocar token');

  return { token: body.access_token, expiresIn: body.expires_in || 5183944 };
}

// Busca o Page Access Token permanente a partir de um user token (long-lived)
export async function getPageAccessToken(userToken: string): Promise<{ token: string; pageId: string; pageName: string } | null> {
  const url = new URL(`${BASE_URL}/me/accounts`);
  url.searchParams.set('access_token', userToken);
  const res = await fetch(url.toString());
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error?.message || 'Falha ao buscar páginas');

  const pages = body.data || [];
  if (pages.length === 0) return null;

  // Preferir página com nome contendo "grito" (ou retorna a primeira)
  const page = pages.find((p: any) => p.name?.toLowerCase().includes('grito')) || pages[0];
  return { token: page.access_token, pageId: page.id, pageName: page.name };
}

// Verifica se o token atual está válido
export async function checkTokenStatus(): Promise<{ valid: boolean; expiresAt?: Date; daysLeft?: number; error?: string }> {
  try {
    const token = await getToken();
    if (!token) return { valid: false, error: 'Token não configurado' };

    const url = new URL(`${BASE_URL}/debug_token`);
    url.searchParams.set('input_token', token);
    url.searchParams.set('access_token', token);
    const res = await fetch(url.toString());
    const body = await res.json();

    if (!res.ok || !body.data?.is_valid) {
      return { valid: false, error: body.data?.error?.message || 'Token inválido' };
    }

    const expiresAt = body.data.expires_at ? new Date(body.data.expires_at * 1000) : undefined;
    const daysLeft = expiresAt ? Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : undefined;

    return { valid: true, expiresAt, daysLeft };
  } catch (e: any) {
    return { valid: false, error: e.message };
  }
}

async function graphGet(path: string, params: Record<string, string> = {}): Promise<any> {
  const token = await getToken();
  if (!token) throw new Error('Token Meta não configurado');

  const url = new URL(`${BASE_URL}/${path}`);
  url.searchParams.set('access_token', token);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta API ${res.status}: ${body}`);
  }
  return res.json();
}

async function safeInsight(metric: string): Promise<number> {
  try {
    const data = await graphGet(`${INSTAGRAM_BUSINESS_ID}/insights`, {
      metric,
      metric_type: 'total_value',
      period: 'day',
    });
    return Number(data?.data?.[0]?.total_value?.value ?? 0);
  } catch (e: any) {
    console.warn(`⚠️ [Instagram] Falha ao buscar "${metric}":`, e.message);
    return 0;
  }
}

export async function fetchInstagramMetrics(): Promise<{
  followersTotal: number;
  followersGained: number;
  followersLost: number;
  mediaCount: number;
  reach: number;
  profileViews: number;
  websiteClicks: number;
  accountsEngaged: number;
}> {
  const [profile, reach, profileViews, websiteClicks, accountsEngaged, followerCountData] =
    await Promise.all([
      graphGet(`${INSTAGRAM_BUSINESS_ID}`, {
        fields: 'followers_count,media_count',
      }),
      safeInsight('reach'),
      safeInsight('profile_views'),
      safeInsight('website_clicks'),
      safeInsight('accounts_engaged'),
      (async () => {
        try {
          // follower_count diário = novos seguidores que seguiram hoje
          const now = Math.floor(Date.now() / 1000);
          const since = now - 86400; // últimas 24h
          return await graphGet(`${INSTAGRAM_BUSINESS_ID}/insights`, {
            metric: 'follower_count',
            period: 'day',
            since: String(since),
            until: String(now),
          });
        } catch {
          return null;
        }
      })(),
    ]);

  const followersTotal = Number(profile?.followers_count ?? 0);
  const mediaCount = Number(profile?.media_count ?? 0);

  // follower_count = novos seguidores do dia (GANHOS)
  let followersGained = 0;
  const fcValues = followerCountData?.data?.[0]?.values;
  if (Array.isArray(fcValues) && fcValues.length > 0) {
    followersGained = fcValues.reduce((sum: number, v: any) => sum + (Number(v.value) || 0), 0);
  }

  // PERDIDOS = calculado depois comparando com total anterior no banco
  // (calculado em saveInstagramMetrics após buscar o prev_total)
  const followersLost = 0;

  return { followersTotal, followersGained, followersLost, mediaCount, reach, profileViews, websiteClicks, accountsEngaged };
}

export async function saveInstagramMetrics(periodLabel: 'morning' | 'evening' = 'morning'): Promise<void> {
  const token = await getToken();
  if (!token) {
    console.warn('⚠️ [Instagram] Token não configurado — sync ignorado');
    return;
  }

  try {
    console.log(`📸 [Instagram] Iniciando sync (${periodLabel})...`);
    const metrics = await fetchInstagramMetrics();
    const now = new Date();

    // Buscar total anterior para calcular perdidos
    const prevRow = await pool.query(
      `SELECT followers_total FROM instagram_metrics ORDER BY date DESC, created_at DESC LIMIT 1`
    );
    const prevTotal = prevRow.rows.length > 0 ? Number(prevRow.rows[0].followers_total) : metrics.followersTotal;
    const netChange = metrics.followersTotal - prevTotal;
    const followersLost = Math.max(0, metrics.followersGained - netChange);

    console.log(`📊 [Instagram] Prev=${prevTotal} Atual=${metrics.followersTotal} Ganhos=${metrics.followersGained} Perdidos=${followersLost}`);

    await pool.query(
      `INSERT INTO instagram_metrics
        (date, period_label, followers_total, followers_gained, followers_lost, media_count,
         reach, profile_views, website_clicks, accounts_engaged, source, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'instagram_graph_api', NOW())`,
      [
        now,
        periodLabel,
        metrics.followersTotal,
        metrics.followersGained,
        followersLost,
        metrics.mediaCount,
        metrics.reach,
        metrics.profileViews,
        metrics.websiteClicks,
        metrics.accountsEngaged,
      ]
    );

    console.log(`✅ [Instagram] Métricas salvas: ${metrics.followersTotal} seguidores`);

    // Atualizar tabela mensal automaticamente a partir do histórico
    await syncMonthlyFollowersFromHistory();
  } catch (e: any) {
    console.error('❌ [Instagram] Erro ao salvar métricas:', e.message);
    throw e;
  }
}

export async function getLatestMetrics(): Promise<any | null> {
  try {
    const result = await pool.query(
      `SELECT * FROM instagram_metrics ORDER BY created_at DESC LIMIT 1`
    );
    return result.rows[0] || null;
  } catch (e: any) {
    console.error('❌ [Instagram] Erro ao buscar última métrica:', e.message);
    return null;
  }
}

export async function getMetricsHistory(limit = 30): Promise<any[]> {
  try {
    const result = await pool.query(
      `SELECT * FROM instagram_metrics ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (e: any) {
    console.error('❌ [Instagram] Erro ao buscar histórico:', e.message);
    return [];
  }
}

// Agrega histórico de instagram_metrics por mês e atualiza marketing_seguidores_mensal automaticamente
export async function syncMonthlyFollowersFromHistory(): Promise<void> {
  try {
    // Busca primeiro e último valor de followers_total por mês/ano
    const result = await pool.query(`
      WITH monthly AS (
        SELECT
          EXTRACT(YEAR FROM date)::int  AS ano,
          EXTRACT(MONTH FROM date)::int AS mes,
          MIN(date) AS primeira_data,
          MAX(date) AS ultima_data,
          SUM(followers_gained)         AS total_ganhos_sync,
          SUM(followers_lost)           AS total_perdidos_sync
        FROM instagram_metrics
        GROUP BY 1, 2
      )
      SELECT
        m.ano, m.mes,
        m.total_ganhos_sync,
        m.total_perdidos_sync,
        (SELECT followers_total FROM instagram_metrics WHERE date = m.primeira_data ORDER BY created_at ASC  LIMIT 1) AS total_inicio,
        (SELECT followers_total FROM instagram_metrics WHERE date = m.ultima_data  ORDER BY created_at DESC LIMIT 1) AS total_fim
      FROM monthly m
      ORDER BY m.ano, m.mes
    `);

    for (const row of result.rows) {
      const { ano, mes, total_inicio, total_fim, total_ganhos_sync, total_perdidos_sync } = row;
      const inicio   = Number(total_inicio);
      const fim      = Number(total_fim);
      const delta    = fim - inicio;
      const syncGanhos   = Number(total_ganhos_sync) || 0;
      const syncPerdidos = Number(total_perdidos_sync) || 0;

      // Se os syncs já têm dados de ganhos capturados, usa eles; senão, usa delta
      const ganhos   = syncGanhos > 0 ? syncGanhos : (delta > 0 ? delta : 0);
      const perdidos = syncGanhos > 0 ? syncPerdidos : (delta < 0 ? Math.abs(delta) : 0);

      await pool.query(`
        INSERT INTO marketing_seguidores_mensal
          (ano, mes, total_seguidores, seguidores_ganhos, seguidores_perdidos, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (ano, mes) DO UPDATE SET
          total_seguidores    = EXCLUDED.total_seguidores,
          seguidores_ganhos   = CASE WHEN EXCLUDED.seguidores_ganhos > 0 THEN EXCLUDED.seguidores_ganhos ELSE marketing_seguidores_mensal.seguidores_ganhos END,
          seguidores_perdidos = CASE WHEN EXCLUDED.seguidores_ganhos > 0 THEN EXCLUDED.seguidores_perdidos ELSE marketing_seguidores_mensal.seguidores_perdidos END,
          updated_at          = NOW()
      `, [ano, mes, fim, ganhos, perdidos]);

      console.log(`📊 [Instagram] Mês ${mes}/${ano}: ganhos=${ganhos} perdidos=${perdidos} total=${fim}`);
    }

    console.log(`✅ [Instagram] Sincronização mensal concluída — ${result.rows.length} meses atualizados`);
  } catch (e: any) {
    console.error('❌ [Instagram] Erro na sincronização mensal:', e.message);
  }
}
