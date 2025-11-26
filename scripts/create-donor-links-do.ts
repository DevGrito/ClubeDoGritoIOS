import pkg from "pg";
const { Pool } = pkg;

// Conectar ao Digital Ocean PostgreSQL
const pool = new Pool({
  host: process.env.DO_DB_HOST!,
  port: parseInt(process.env.DO_DB_PORT || '5432'),
  user: process.env.DO_DB_USER!,
  password: process.env.DO_DB_PASSWORD!,
  database: process.env.DO_DB_NAME!,
  ssl: false,
});

async function createDonorLinks() {
  try {
    console.log('🔌 Conectando ao Digital Ocean PostgreSQL...');
    
    // Buscar todos os doadores ativos
    const result = await pool.query(`
      SELECT id, nome, sobrenome, telefone
      FROM users
      WHERE plano IN ('eco', 'voz', 'grito', 'platinum', 'diamante')
        AND ativo = true
      ORDER BY nome
    `);
    
    console.log(`✅ Encontrados ${result.rows.length} doadores ativos`);
    
    // Buscar campanha ativa
    const campaignResult = await pool.query(`
      SELECT id, name
      FROM marketing_campaigns
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (campaignResult.rows.length === 0) {
      console.log('❌ Nenhuma campanha ativa encontrada');
      return;
    }
    
    const campaign = campaignResult.rows[0];
    console.log(`📢 Campanha ativa: "${campaign.name}" (ID: ${campaign.id})`);
    
    // Criar links para cada doador
    let created = 0;
    let skipped = 0;
    
    for (const donor of result.rows) {
      // Gerar slug baseado no nome
      const fullName = `${donor.nome} ${donor.sobrenome || ''}`.trim();
      let slug = fullName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Adicionar ID se slug existir
      const existingCheck = await pool.query(
        'SELECT id FROM marketing_links WHERE code = $1',
        [slug]
      );
      
      if (existingCheck.rows.length > 0) {
        slug = `${slug}-${donor.id}`;
      }
      
      // Verificar se já existe link para este doador nesta campanha
      const linkCheck = await pool.query(
        'SELECT id FROM marketing_links WHERE reward_to_user_id = $1 AND campaign_id = $2',
        [donor.id, campaign.id]
      );
      
      if (linkCheck.rows.length > 0) {
        console.log(`  ⏭️ Doador ${donor.nome} já tem link (pulando)`);
        skipped++;
        continue;
      }
      
      // Criar link
      await pool.query(`
        INSERT INTO marketing_links (
          campaign_id,
          code,
          medium,
          source,
          utm_source,
          utm_medium,
          utm_campaign,
          is_active,
          reward_to_user_id,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      `, [
        campaign.id,
        slug,
        'referral',
        'doador',
        'doador-link',
        'referral',
        campaign.name,
        true,
        donor.id
      ]);
      
      console.log(`  ✅ Link criado: ${slug} → ${donor.nome}`);
      created++;
    }
    
    console.log(`\n✅ Concluído! ${created} links criados, ${skipped} pulados`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

createDonorLinks();
