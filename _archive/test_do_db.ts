import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DO_DATABASE_URL,
  ssl: false
});

async function testConnection() {
  try {
    console.log('🔌 Tentando conectar ao PostgreSQL Digital Ocean...');
    
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tabelas encontradas no banco Digital Ocean:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    const countResult = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM gv_monthly_data) as gv_data_count,
        (SELECT COUNT(*) FROM gv_indicator_assignments) as gv_indicators_count
    `);
    
    console.log('\n📊 Resumo de dados no banco Digital Ocean:');
    console.log(`  - Usuários: ${countResult.rows[0].users_count}`);
    console.log(`  - Dados mensais GV: ${countResult.rows[0].gv_data_count}`);
    console.log(`  - Indicadores GV: ${countResult.rows[0].gv_indicators_count}`);
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    console.error('Código do erro:', error.code);
    process.exit(1);
  }
}

testConnection();
