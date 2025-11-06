import pkg from 'pg';
const { Client } = pkg;

// Testar com hostname interno
const client = new Client({
  host: 'clubedogrito_db',
  port: 5432,
  user: 'postgres',
  password: 'I34y*efn12#j',
  database: 'clubedogrito',
  ssl: false,
  connectionTimeoutMillis: 5000
});

async function testConnection() {
  try {
    console.log('🔌 Tentando conectar com hostname interno (clubedogrito_db)...');
    await client.connect();
    console.log('✅ Conexão OK com hostname interno!');
    await client.end();
  } catch (error) {
    console.log('❌ Hostname interno não acessível:', error.message);
    
    // Tentar com IP externo
    const client2 = new Client({
      host: '143.198.136.16',
      port: 5432,
      user: 'postgres',
      password: 'I34y*efn12#j',
      database: 'clubedogrito',
      ssl: false,
      connectionTimeoutMillis: 5000
    });
    
    console.log('\n🔌 Tentando conectar com IP externo (143.198.136.16)...');
    try {
      await client2.connect();
      console.log('✅ Conexão OK com IP externo!');
      await client2.end();
    } catch (error2) {
      console.log('❌ IP externo também não acessível:', error2.message);
      console.log('\n⚠️  O banco PostgreSQL da Digital Ocean não está acessível do Replit.');
      console.log('Possíveis causas:');
      console.log('  1. Firewall bloqueando conexões externas');
      console.log('  2. PostgreSQL configurado apenas para localhost');
      console.log('  3. IP do Replit não está na whitelist');
    }
  }
  process.exit(0);
}

testConnection();
