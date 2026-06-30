import { pool } from "../db";

const META_API_VERSION = process.env.META_API_VERSION || "v25.0";
const BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// Token cache em memória (evita query ao banco a cada chamada)
let _tokenCache: { value: string; loadedAt: number } | null = null;
const TOKEN_CACHE_TTL = 5 * 60 * 1000; // 5 min

async function getTokenFromDb(): Promise<string | null> {
  try {
    const r = await pool.query(`
      SELECT valor 
      FROM configuracoes_meta 
      WHERE chave = 'page_access_token' 
      LIMIT 1
    `);

    console.log("[Instagram][TokenDB] Linhas encontradas:", r.rowCount);
    console.log("[Instagram][TokenDB] Tem valor?", !!r.rows[0]?.valor);
    console.log(
      "[Instagram][TokenDB] Início do token:",
      r.rows[0]?.valor ? r.rows[0].valor.slice(0, 12) + "..." : "VAZIO"
    );

    return r.rows[0]?.valor || null;
  } catch (error) {
    console.error("[Instagram][TokenDB] Erro ao buscar token no banco:", error);
    return null;
  }
}

async function getMetaConfig(chave: string): Promise<string | null> {
  try {
    const result = await pool.query(
      `SELECT valor FROM configuracoes_meta WHERE chave = $1 LIMIT 1`,
      [chave]
    );

    return result.rows[0]?.valor || null;
  } catch (e: any) {
    console.error(`[Instagram] Erro ao buscar config ${chave}:`, e.message);
    return null;
  }
}

export async function saveMetaConfig(chave: string, valor: string): Promise<void> {
  await pool.query(
    `INSERT INTO configuracoes_meta (chave, valor, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()`,
    [chave, valor]
  );
}

async function getInstagramBusinessId(): Promise<string> {
  const fromDb = await getMetaConfig("instagram_business_account_id");
  const fromEnv = process.env.INSTAGRAM_BUSINESS_ID;

  const id = fromDb || fromEnv;

  if (!id) {
    throw new Error("Instagram Business Account ID não configurado.");
  }

  return id;
}

export async function getToken(): Promise<string | null> {
  const now = Date.now();

  if (_tokenCache && (now - _tokenCache.loadedAt) < TOKEN_CACHE_TTL) {
      return _tokenCache.value;
  }

  const dbToken = await getTokenFromDb();
  const envToken = process.env.META_PAGE_ACCESS_TOKEN || null;

  console.log("[Instagram][Token] Token no banco?", !!dbToken);
  console.log("[Instagram][Token] Token no ambiente?", !!envToken);

  const token = dbToken || envToken || null;

  if (token) {
    console.log("[Instagram][Token] Token final carregado:", token.slice(0, 12) + "...");
    _tokenCache = { value: token, loadedAt: now };
  } else {
    console.log("[Instagram][Token] Nenhum token encontrado");
  }

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

export type PageTokenResult = {
  token: string;
  pageId: string;
  pageName: string;
  instagramBusinessAccountId?: string;
  instagramUsername?: string;
};

// Busca o Page Access Token permanente a partir de um user token (long-lived)
export async function getPageAccessToken(userToken: string): Promise<PageTokenResult | null> {
  const url = new URL(`${BASE_URL}/me/accounts`);
  url.searchParams.set('access_token', userToken);
  url.searchParams.set(
    'fields',
    'id,name,access_token,instagram_business_account{id,username}'
  );
  const res = await fetch(url.toString());
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error?.message || 'Falha ao buscar páginas');

  const pages = body.data || [];
  if (pages.length === 0) {
    console.warn('[Instagram] /me/accounts retornou vazio — verifique pages_show_list e se o usuário é admin da Página');
    return null;
  }

  // Preferir página com Instagram vinculado; depois nome contendo "grito"; senão a primeira
  const withInstagram = pages.filter((p: any) => p.instagram_business_account?.id);
  const candidates = withInstagram.length > 0 ? withInstagram : pages;
  const page =
    candidates.find((p: any) => p.name?.toLowerCase().includes('grito')) || candidates[0];

  const ig = page.instagram_business_account;
  return {
    token: page.access_token,
    pageId: page.id,
    pageName: page.name,
    instagramBusinessAccountId: ig?.id,
    instagramUsername: ig?.username,
  };
}

// Resolve Instagram Business Account a partir de um token (user ou page)
export async function resolveInstagramBusinessAccount(
  token: string,
  pageId?: string
): Promise<{ instagramBusinessAccountId: string; instagramUsername?: string; pageId: string; pageName?: string; pageAccessToken?: string } | null> {
  const accountsFields = 'id,name,access_token,instagram_business_account{id,username}';
  let pageAccessToken: string | undefined;
  let pageName: string | undefined;

  // Caminho 1: token de usuário — listar páginas administradas
  if (!pageId) {
    const accountsUrl = new URL(`${BASE_URL}/me/accounts`);
    accountsUrl.searchParams.set('access_token', token);
    accountsUrl.searchParams.set('fields', accountsFields);
    const accountsBody = await fetch(accountsUrl.toString()).then(r => r.json());

    if (!accountsBody.error && Array.isArray(accountsBody.data) && accountsBody.data.length > 0) {
      const withInstagram = accountsBody.data.filter((p: any) => p.instagram_business_account?.id);
      const candidates = withInstagram.length > 0 ? withInstagram : accountsBody.data;
      const page =
        candidates.find((p: any) => p.name?.toLowerCase().includes('grito')) || candidates[0];

      if (page.instagram_business_account?.id) {
        return {
          instagramBusinessAccountId: page.instagram_business_account.id,
          instagramUsername: page.instagram_business_account.username,
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: page.access_token,
        };
      }

      pageId = page.id;
      pageName = page.name;
      pageAccessToken = page.access_token;
    }
  }

  // Caminho 2: token de página — /me retorna a própria página
  let resolvedPageId = pageId || null;

  if (!resolvedPageId) {
    const me = await fetch(
      `${BASE_URL}/me?fields=id,name&access_token=${encodeURIComponent(token)}`
    ).then(r => r.json());
    if (me.error) {
      throw new Error(
        'Não foi possível listar páginas. Gere o token no Graph API Explorer com pages_show_list, ' +
        'instagram_basic e instagram_manage_insights, usando uma conta admin da Página do Facebook.'
      );
    }
    resolvedPageId = me.id;
    pageName = me.name;
    pageAccessToken = token;
  }

  const page = await fetch(
    `${BASE_URL}/${resolvedPageId}?fields=name,instagram_business_account{id,username}&access_token=${encodeURIComponent(pageAccessToken || token)}`
  ).then(r => r.json());

  if (page.error) {
    const msg = page.error.message || '';
    if (msg.includes('nonexisting field') && msg.includes('instagram_business_account')) {
      throw new Error(
        'Token sem acesso à Página do Facebook. Use App ID + App Secret para obter o Page Access Token, ' +
        'com permissões pages_show_list, instagram_basic e instagram_manage_insights.'
      );
    }
    throw new Error(page.error.message || 'Falha ao buscar conta Instagram vinculada');
  }

  if (!page.instagram_business_account?.id) {
    throw new Error(
      `A página "${page.name || resolvedPageId}" não tem conta Instagram Business/Creator vinculada no Meta Business.`
    );
  }

  return {
    instagramBusinessAccountId: page.instagram_business_account.id,
    instagramUsername: page.instagram_business_account.username,
    pageId: resolvedPageId!,
    pageName: page.name || pageName,
    pageAccessToken,
  };
}

export async function validateInstagramConnection(
  instagramBusinessAccountId?: string
): Promise<{
  ok: boolean;
  instagramBusinessAccountId?: string;
  instagramUsername?: string;
  facebookPageId?: string;
  facebookPageName?: string;
  followersCount?: number;
  tokenValid?: boolean;
  error?: string;
}> {
  try {
    const tokenStatus = await checkTokenStatus();
    if (!tokenStatus.valid) {
      return { ok: false, tokenValid: false, error: tokenStatus.error || 'Token inválido' };
    }

    const instagramBusinessId =
      instagramBusinessAccountId || (await getInstagramBusinessId());
    const profile = await graphGet(`${instagramBusinessId}`, {
      fields: 'username,followers_count,media_count',
    });

    const facebookPageId = await getMetaConfig('facebook_page_id');
    const facebookPageName = await getMetaConfig('facebook_page_name');

    return {
      ok: true,
      tokenValid: true,
      instagramBusinessAccountId: instagramBusinessId,
      instagramUsername: profile?.username,
      facebookPageId: facebookPageId || undefined,
      facebookPageName: facebookPageName || undefined,
      followersCount: Number(profile?.followers_count ?? 0),
    };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
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

  if (!token) {
    throw new Error("Token Meta não configurado");
  }

  const url = new URL(`${BASE_URL}/${path}`);
  url.searchParams.set("access_token", token);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString());
  const body = await res.json();

  if (!res.ok || body.error) {
    throw new Error(`Meta API ${res.status}: ${JSON.stringify(body)}`);
  }

  return body;
}

async function safeInsight(metric: string): Promise<number> {
  try {
    const instagramBusinessId = await getInstagramBusinessId();

    const data = await graphGet(`${instagramBusinessId}/insights`, {
      metric,
      metric_type: "total_value",
      period: "day"
    });

    return Number(data?.data?.[0]?.total_value?.value ?? 0);
  } catch (e: any) {
    console.warn(`⚠️ [Instagram] Falha ao buscar "${metric}":`, e.message);
    return 0;
  }
}

function getYearRange(year = new Date().getFullYear()) {
  const since = Math.floor(new Date(year, 0, 1, 0, 0, 0).getTime() / 1000);
  const until = Math.floor(new Date(year + 1, 0, 1, 0, 0, 0).getTime() / 1000);

  return { since, until };
}

async function fetchInstagramMediaFromYear(year = new Date().getFullYear()): Promise<any[]> {
  const instagramBusinessId = await getInstagramBusinessId();
  const { since, until } = getYearRange(year);

  const fields = [
    "id",
    "caption",
    "media_type",
    "media_product_type",
    "timestamp",
    "like_count",
    "comments_count",
    "permalink"
  ].join(",");

  let url =
    `${BASE_URL}/${instagramBusinessId}/media` +
    `?fields=${encodeURIComponent(fields)}` +
    `&limit=100` +
    `&since=${since}` +
    `&until=${until}` +
    `&access_token=${await getToken()}`;

  const allMedia: any[] = [];

  while (url) {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(`Erro ao buscar mídias do Instagram: ${JSON.stringify(data)}`);
    }

    allMedia.push(...(data.data || []));

    url = data.paging?.next || "";
  }

  return allMedia;
}

async function fetchMediaInsights(
  mediaId: string,
  mediaProductType?: string,
  mediaType?: string
): Promise<Record<string, number>> {
  const isReel =
    mediaType === "REELS" ||
    mediaProductType === "REELS";

  const metricAttempts = isReel
    ? [
        ["views", "reach", "saved", "shares", "total_interactions"],
        ["reach", "saved", "shares", "total_interactions"],
      ]
    : [
        ["reach", "saved", "shares", "total_interactions"],
      ];

  for (const metrics of metricAttempts) {
    try {
      const data = await graphGet(`${mediaId}/insights`, {
        metric: metrics.join(","),
      });

      const normalized: Record<string, number> = {};

      for (const item of data.data || []) {
        normalized[item.name] = Number(item.values?.[0]?.value || 0);
      }

      return normalized;
    } catch (e: any) {
      const message = e?.message || "";

      if (
        message.includes("does not support") ||
        message.includes("no longer supported") ||
        message.includes("Unsupported")
      ) {
        continue;
      }

      console.warn(`[Instagram] Falha ao buscar insights da mídia ${mediaId}:`, message);
    }
  }

  return {};
}

async function fetchYearContentMetrics(year = new Date().getFullYear()): Promise<{
  postsInstagramYear: number;
  reelsViews: number;
  instagramEngagement: number;
}> {
  const media = await fetchInstagramMediaFromYear(year);

  let postsInstagramYear = 0;
  let reelsViews = 0;
  let instagramEngagement = 0;

  for (const item of media) {
    postsInstagramYear += 1;

    const likes = Number(item.like_count || 0);
    const comments = Number(item.comments_count || 0);

    instagramEngagement += likes + comments;

    const isReel =
      item.media_type === "REELS" ||
      item.media_product_type === "REELS";

    const insights = await fetchMediaInsights(
      item.id,
      item.media_product_type,
      item.media_type
    );

    if (isReel) {
      reelsViews += Number(
        insights.plays ||
        insights.views ||
        0
      );
    }

    // Se existir total_interactions, ele é melhor do que só likes + comments.
    // Para não duplicar, removemos likes/comments e usamos total_interactions.
    if (insights.total_interactions) {
      instagramEngagement -= likes + comments;
      instagramEngagement += Number(insights.total_interactions || 0);
    } else {
      instagramEngagement += Number(insights.saved || 0);
      instagramEngagement += Number(insights.shares || 0);
    }
  }

  return {
    postsInstagramYear,
    reelsViews,
    instagramEngagement
  };
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
  postsInstagramYear: number;
  reelsViews: number;
  instagramEngagement: number;
}> {
  const instagramBusinessId = await getInstagramBusinessId();
  const currentYear = new Date().getFullYear();

  const [
    profile,
    reach,
    profileViews,
    websiteClicks,
    accountsEngaged,
    followerCountData,
    contentMetrics
  ] = await Promise.all([
    graphGet(`${instagramBusinessId}`, {
      fields: "followers_count,media_count"
    }),

    safeInsight("reach"),
    safeInsight("profile_views"),
    safeInsight("website_clicks"),
    safeInsight("accounts_engaged"),

    (async () => {
      try {
        const now = Math.floor(Date.now() / 1000);
        const since = now - 86400;

        return await graphGet(`${instagramBusinessId}/insights`, {
          metric: "follower_count",
          period: "day",
          since: String(since),
          until: String(now)
        });
      } catch {
        return null;
      }
    })(),

    fetchYearContentMetrics(currentYear)
  ]);

  const followersTotal = Number(profile?.followers_count ?? 0);
  const mediaCount = Number(profile?.media_count ?? 0);

  let followersGained = 0;
  let followersLostFromAPI = 0;

  const fcValues = followerCountData?.data?.[0]?.values;

  if (Array.isArray(fcValues) && fcValues.length > 0) {
    for (const value of fcValues) {
      const val = Number(value.value) || 0;

      if (val > 0) {
        followersGained += val;
      } else if (val < 0) {
        followersLostFromAPI += Math.abs(val);
      }
    }
  }

  return {
    followersTotal,
    followersGained,
    followersLost: followersLostFromAPI,
    mediaCount,
    reach,
    profileViews,
    websiteClicks,
    accountsEngaged,
    postsInstagramYear: contentMetrics.postsInstagramYear,
    reelsViews: contentMetrics.reelsViews,
    instagramEngagement: contentMetrics.instagramEngagement
  };
}

export async function saveInstagramMetrics(periodLabel: "morning" | "evening" = "morning"): Promise<void> {
  const token = await getToken();

  if (!token) {
    console.warn("⚠️ [Instagram] Token não configurado — sync ignorado");
    return;
  }

  try {
    console.log(`📸 [Instagram] Iniciando sync (${periodLabel})...`);

    const metrics = await fetchInstagramMetrics();
    const now = new Date();

    const prevRow = await pool.query(
      `SELECT followers_total FROM instagram_metrics ORDER BY date DESC, created_at DESC LIMIT 1`
    );

    const prevTotal =
      prevRow.rows.length > 0
        ? Number(prevRow.rows[0].followers_total)
        : metrics.followersTotal;

    const netChange = metrics.followersTotal - prevTotal;

    const apiLost = metrics.followersLost;
    const derivedLost = Math.max(0, metrics.followersGained - netChange);
    const followersLost = Math.max(apiLost, derivedLost);

    console.log(
      `📊 [Instagram] Prev=${prevTotal} Atual=${metrics.followersTotal} ` +
      `Ganhos=${metrics.followersGained} Perdidos=${followersLost} ` +
      `PostsAno=${metrics.postsInstagramYear} ReelsViews=${metrics.reelsViews} ` +
      `Engajamento=${metrics.instagramEngagement}`
    );

    await pool.query(
      `
      INSERT INTO instagram_metrics
        (
          date,
          period_label,
          followers_total,
          followers_gained,
          followers_lost,
          media_count,
          reach,
          profile_views,
          website_clicks,
          accounts_engaged,
          posts_instagram_year,
          reels_views,
          instagram_engagement,
          source,
          updated_at
        )
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'instagram_graph_api',NOW())
      `,
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
        metrics.postsInstagramYear,
        metrics.reelsViews,
        metrics.instagramEngagement
      ]
    );

    console.log(`✅ [Instagram] Métricas salvas: ${metrics.followersTotal} seguidores`);

    await syncMonthlyFollowersFromHistory();
  } catch (e: any) {
    const msg = e.message || '';
    const isOAuth = msg.includes('190') || /session has expired/i.test(msg) || /access token/i.test(msg);
    if (isOAuth) {
      console.warn('⚠️ [Instagram] Token da Meta expirado ou inválido. Reconecte em /api/meta/login');
    } else {
      console.error('❌ [Instagram] Erro ao salvar métricas:', msg);
    }
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
    // Usa variação sequencial de followers_total para derivar ganhos e perdas reais.
    // Compara cada registro com o anterior — quando o total cai, houve perda líquida naquele intervalo.
    const result = await pool.query(`
      WITH ordered AS (
        SELECT
          EXTRACT(YEAR FROM date)::int  AS ano,
          EXTRACT(MONTH FROM date)::int AS mes,
          followers_total,
          followers_gained,
          followers_lost,
          LAG(followers_total) OVER (ORDER BY date, created_at) AS prev_total
        FROM instagram_metrics
      ),
      monthly AS (
        SELECT
          ano, mes,
          MAX(followers_total) FILTER (WHERE prev_total IS NOT NULL OR TRUE)  AS total_fim,
          -- Ganhos: soma dos incrementos sequenciais positivos (variações reais de subida)
          SUM(GREATEST(followers_total - COALESCE(prev_total, followers_total), 0)) AS ganhos_seq,
          -- Perdas: soma dos decrementos sequenciais negativos (variações reais de queda)
          SUM(GREATEST(COALESCE(prev_total, followers_total) - followers_total, 0)) AS perdidos_seq,
          -- Também soma os campos já capturados em syncs recentes (fórmula nova)
          SUM(followers_gained) AS ganhos_sync,
          SUM(followers_lost)   AS perdidos_sync
        FROM ordered
        GROUP BY 1, 2
      )
      SELECT * FROM monthly ORDER BY ano, mes
    `);

    for (const row of result.rows) {
      const { ano, mes, total_fim, ganhos_seq, perdidos_seq, ganhos_sync, perdidos_sync } = row;
      const fim            = Number(total_fim)     || 0;
      const ganhosSeq      = Number(ganhos_seq)    || 0;
      const perdidosSeq    = Number(perdidos_seq)  || 0;
      const ganhosSync     = Number(ganhos_sync)   || 0;
      const perdidosSync   = Number(perdidos_sync) || 0;

      // Usa o método sequencial (mais preciso) como base;
      // perdidos_sync (fórmula nova) serve de piso mínimo para meses recentes
      const ganhos   = ganhosSeq  > 0 ? ganhosSeq  : ganhosSync;
      const perdidos = Math.max(perdidosSeq, perdidosSync);

      await pool.query(`
        INSERT INTO marketing_seguidores_mensal
          (ano, mes, total_seguidores, seguidores_ganhos, seguidores_perdidos, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (ano, mes) DO UPDATE SET
          total_seguidores    = EXCLUDED.total_seguidores,
          seguidores_ganhos   = EXCLUDED.seguidores_ganhos,
          seguidores_perdidos = EXCLUDED.seguidores_perdidos,
          updated_at          = NOW()
      `, [ano, mes, fim, ganhos, perdidos]);

      console.log(`📊 [Instagram] Mês ${mes}/${ano}: ganhos=${ganhos} perdidos=${perdidos} total=${fim}`);
    }

    console.log(`✅ [Instagram] Sincronização mensal concluída — ${result.rows.length} meses atualizados`);
  } catch (e: any) {
    console.error('❌ [Instagram] Erro na sincronização mensal:', e.message);
  }
}
