import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';

interface FinancialRecord {
  id: number;
  ano: number;
  mes: number;
  departamento: string;
  contas_a_receber: string;
  contas_a_pagar: string;
  saldo: string;
}

async function migrateFinancialData() {
  let doPool: Pool | null = null;
  
  try {
    console.log('🔄 Iniciando migração de dados financeiros...\n');

    // Conexão com Replit (Neon) - ORIGEM
    const replitDb = neon(process.env.DATABASE_URL!);
    console.log('✅ Conectado ao banco Replit (Neon)');

    // Conexão com Digital Ocean - DESTINO (usando pg tradicional)
    doPool = new Pool({
      host: process.env.DO_DB_HOST,
      port: parseInt(process.env.DO_DB_PORT || '5432'),
      user: process.env.DO_DB_USER,
      password: process.env.DO_DB_PASSWORD,
      database: process.env.DO_DB_NAME,
      ssl: false
    });
    console.log('✅ Conectado ao banco Digital Ocean\n');

    // 1. Buscar dados do Replit
    console.log('📊 Buscando dados do Replit (Neon)...');
    const replitData = await replitDb`
      SELECT id, ano, mes, departamento, contas_a_receber, contas_a_pagar, saldo
      FROM conselho_dados_realizados
      WHERE ano = 2025
      ORDER BY departamento, mes
    ` as FinancialRecord[];
    console.log(`✅ ${replitData.length} registros encontrados no Replit\n`);

    // 2. Verificar se tabela existe no Digital Ocean
    console.log('🔍 Verificando estrutura no Digital Ocean...');
    const tableExistsResult = await doPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'conselho_dados_realizados'
      )
    `);
    
    if (!tableExistsResult.rows[0].exists) {
      console.log('⚠️  Tabela não existe no Digital Ocean. Criando...');
      await doPool.query(`
        CREATE TABLE conselho_dados_realizados (
          id SERIAL PRIMARY KEY,
          ano INTEGER NOT NULL,
          mes INTEGER NOT NULL,
          departamento VARCHAR(100) NOT NULL,
          contas_a_receber DECIMAL(15,2) DEFAULT 0,
          contas_a_pagar DECIMAL(15,2) DEFAULT 0,
          saldo DECIMAL(15,2) DEFAULT 0,
          UNIQUE(ano, mes, departamento)
        )
      `);
      console.log('✅ Tabela criada com sucesso\n');
    } else {
      console.log('✅ Tabela já existe no Digital Ocean\n');
    }

    // 3. Limpar dados antigos de 2025 no Digital Ocean (para evitar duplicatas)
    console.log('🧹 Limpando dados antigos de 2025 no Digital Ocean...');
    const deleteResult = await doPool.query(`
      DELETE FROM conselho_dados_realizados
      WHERE ano = 2025
    `);
    console.log(`✅ ${deleteResult.rowCount || 0} registros antigos removidos\n`);

    // 4. Inserir dados do Replit no Digital Ocean
    console.log('📥 Inserindo dados no Digital Ocean...');
    let insertedCount = 0;

    for (const record of replitData) {
      await doPool.query(`
        INSERT INTO conselho_dados_realizados (ano, mes, departamento, contas_a_receber, contas_a_pagar, saldo)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        record.ano,
        record.mes,
        record.departamento,
        record.contas_a_receber,
        record.contas_a_pagar,
        record.saldo
      ]);
      insertedCount++;
      
      if (insertedCount % 10 === 0) {
        console.log(`  → ${insertedCount}/${replitData.length} registros inseridos...`);
      }
    }
    console.log(`✅ Todos os ${insertedCount} registros inseridos com sucesso!\n`);

    // 5. Verificar integridade dos dados no Digital Ocean
    console.log('🔍 Verificando integridade dos dados no Digital Ocean...');
    const doDataResult = await doPool.query(`
      SELECT departamento, COUNT(DISTINCT mes) as meses_unicos, COUNT(*) as total_registros
      FROM conselho_dados_realizados
      WHERE ano = 2025
      GROUP BY departamento
      ORDER BY departamento
    `);
    const doData = doDataResult.rows;

    console.log('\n📊 Resumo dos dados no Digital Ocean:');
    console.log('┌─────────────────────────────┬──────────────┬─────────────────┐');
    console.log('│ Departamento                │ Meses Únicos │ Total Registros │');
    console.log('├─────────────────────────────┼──────────────┼─────────────────┤');
    
    for (const row of doData) {
      const dept = row.departamento.padEnd(27);
      const meses = String(row.meses_unicos).padStart(12);
      const total = String(row.total_registros).padStart(15);
      console.log(`│ ${dept} │ ${meses} │ ${total} │`);
    }
    console.log('└─────────────────────────────┴──────────────┴─────────────────┘');

    // Validação final
    const allValid = doData.every(row => row.meses_unicos === 12 && row.total_registros === 12);
    
    if (allValid && doData.length === 7) {
      console.log('\n✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('✅ Todos os 7 departamentos têm 12 meses únicos');
      console.log('✅ Total de 84 registros migrados corretamente');
    } else {
      console.log('\n⚠️  ATENÇÃO: Verifique os dados - pode haver inconsistências');
    }

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    // Fechar conexão com Digital Ocean
    if (doPool) {
      await doPool.end();
      console.log('\n🔌 Conexão com Digital Ocean encerrada');
    }
  }
}

// Executar migração
migrateFinancialData();
