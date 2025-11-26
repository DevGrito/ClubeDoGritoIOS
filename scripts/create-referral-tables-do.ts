import pg from 'pg';

const { Pool } = pg;

async function createReferralTables() {
  const pool = new Pool({
    host: process.env.DO_DB_HOST,
    port: parseInt(process.env.DO_DB_PORT || '5433'),
    database: process.env.DO_DB_NAME,
    user: process.env.DO_DB_USER,
    password: process.env.DO_DB_PASSWORD
  });

  try {
    console.log('🔌 Conectando ao Digital Ocean PostgreSQL...');
    
    // Criar tabela indicacoes
    console.log('📋 Criando tabela indicacoes...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS indicacoes (
        id SERIAL PRIMARY KEY,
        indicou_id INTEGER NOT NULL REFERENCES users(id),
        indicado_id INTEGER NOT NULL REFERENCES users(id),
        ref_code VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'pendente',
        criada_em TIMESTAMP DEFAULT NOW(),
        confirmada_em TIMESTAMP,
        validade TIMESTAMP,
        UNIQUE(indicou_id, indicado_id)
      );
    `);
    console.log('✅ indicacoes criada!');

    // Criar tabela indicacao_pontos_ledger
    console.log('📋 Criando tabela indicacao_pontos_ledger...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS indicacao_pontos_ledger (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        indicacao_id INTEGER REFERENCES indicacoes(id),
        pontos INTEGER NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        descricao TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ indicacao_pontos_ledger criada!');

    // Criar índices para performance
    console.log('📋 Criando índices...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_indicacoes_indicou ON indicacoes(indicou_id);
      CREATE INDEX IF NOT EXISTS idx_indicacoes_indicado ON indicacoes(indicado_id);
      CREATE INDEX IF NOT EXISTS idx_pontos_ledger_user ON indicacao_pontos_ledger(user_id);
    `);
    console.log('✅ Índices criados!');

    console.log('\n🎉 Todas as tabelas de referral foram criadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createReferralTables()
  .then(() => {
    console.log('✨ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script falhou:', error);
    process.exit(1);
  });
