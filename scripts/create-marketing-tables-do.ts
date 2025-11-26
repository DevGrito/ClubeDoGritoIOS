import pg from 'pg';

const { Pool } = pg;

async function createMarketingTables() {
  const pool = new Pool({
    host: process.env.DO_DB_HOST,
    port: parseInt(process.env.DO_DB_PORT || '5433'),
    database: process.env.DO_DB_NAME,
    user: process.env.DO_DB_USER,
    password: process.env.DO_DB_PASSWORD
  });

  try {
    console.log('🔌 Conectando ao Digital Ocean PostgreSQL...');
    
    // Criar tabela marketing_campaigns
    console.log('📋 Criando tabela marketing_campaigns...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        owner_user_id INTEGER NOT NULL,
        reward_to_user_id INTEGER,
        starts_at TIMESTAMP,
        ends_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ marketing_campaigns criada!');

    // Criar tabela marketing_links
    console.log('📋 Criando tabela marketing_links...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_links (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES marketing_campaigns(id),
        code VARCHAR(50) UNIQUE NOT NULL,
        medium VARCHAR(100),
        source VARCHAR(100),
        utm_source VARCHAR(100),
        utm_medium VARCHAR(100),
        utm_campaign VARCHAR(100),
        max_conversions INTEGER,
        expires_at TIMESTAMP,
        reward_to_user_id INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true
      );
    `);
    console.log('✅ marketing_links criada!');

    // Criar tabela mkt_clicks
    console.log('📋 Criando tabela mkt_clicks...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mkt_clicks (
        id SERIAL PRIMARY KEY,
        link_id INTEGER NOT NULL REFERENCES marketing_links(id),
        user_id INTEGER,
        ip_address VARCHAR(45),
        user_agent TEXT,
        referrer TEXT,
        clicked_at TIMESTAMP DEFAULT NOW(),
        converted_at TIMESTAMP,
        conversion_value DECIMAL(10,2)
      );
    `);
    console.log('✅ mkt_clicks criada!');

    console.log('\n🎉 Todas as tabelas de marketing foram criadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createMarketingTables()
  .then(() => {
    console.log('✨ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script falhou:', error);
    process.exit(1);
  });
