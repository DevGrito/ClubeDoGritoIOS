import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: '143.198.136.16',
  port: 5433,  // Porta correta do docker-compose
  user: 'postgres',
  password: 'I34y*efn12#j',
  database: 'clubedogrito',
  ssl: false,
  connectionTimeoutMillis: 10000
});

async function testConnection() {
  try {
    console.log('🔌 Conectando ao PostgreSQL Digital Ocean (143.198.136.16:5433)...');
    
    await client.connect();
    console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!\n');
    
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas no banco Digital Ocean:');
    if (tables.rows.length === 0) {
      console.log('  ⚠️  Nenhuma tabela encontrada (banco vazio)');
    } else {
      tables.rows.forEach(row => console.log(`  ✓ ${row.table_name}`));
    }
    
    console.log('\n📊 Verificando dados...');
    
    // Verificar se há dados em tabelas principais
    try {
      const counts = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as users,
          (SELECT COUNT(*) FROM gv_monthly_data) as gv_data,
          (SELECT COUNT(*) FROM gv_indicator_assignments) as gv_indicators
      `);
      
      console.log(`  - Usuários: ${counts.rows[0].users}`);
      console.log(`  - Dados GV mensais: ${counts.rows[0].gv_data}`);
      console.log(`  - Indicadores GV: ${counts.rows[0].gv_indicators}`);
    } catch (e) {
      console.log('  (algumas tabelas ainda não existem)');
    }
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

testConnection();
