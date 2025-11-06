import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: process.env.DO_DB_HOST,
  port: parseInt(process.env.DO_DB_PORT || '5433'),
  user: process.env.DO_DB_USER,
  password: process.env.DO_DB_PASSWORD,
  database: process.env.DO_DB_NAME,
  ssl: false,
  connectionTimeoutMillis: 10000
});

async function testConnection() {
  try {
    console.log('🔌 Tentando conectar ao PostgreSQL Digital Ocean...');
    console.log(`Host: ${process.env.DO_DB_HOST}:${process.env.DO_DB_PORT}`);
    console.log(`Database: ${process.env.DO_DB_NAME}`);
    
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');
    
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas encontradas no banco Digital Ocean:');
    if (tables.rows.length === 0) {
      console.log('  (nenhuma tabela encontrada)');
    } else {
      tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    }
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    console.error('Código:', error.code);
    process.exit(1);
  }
}

testConnection();
