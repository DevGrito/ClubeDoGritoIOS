import fs from 'fs';
import { db } from '../server/db.ts';
import { 
  gvProjects, gvSectors, gvMgmtIndicators, 
  gvIndicatorAssignments, gvMonthlyData 
} from '../shared/schema.ts';
import { eq, and } from 'drizzle-orm';

// Lê o arquivo CSV
const csvFile = 'attached_assets/GESTAO A VISTA 2025 ok(INDICADORES GERAL FDC) (1)_1758889374847.csv';
console.log('📊 Processando arquivo:', csvFile);

const fileContent = fs.readFileSync(csvFile, 'latin1'); // Usando latin1 para evitar problemas de codificação
const lines = fileContent.split('\n').filter(line => line.trim());

console.log(`📋 Total de linhas: ${lines.length}`);
console.log(`🔸 Cabeçalho: ${lines[1]}`);

// Processar linhas de dados (pular cabeçalho e linha de instrução)
const dataLines = lines.slice(3).filter(line => {
  const columns = line.split(';');
  return columns[0] && columns[0].trim() && columns[0] !== 'PROGRAMA';
});

console.log(`📈 Linhas de dados: ${dataLines.length}`);

// Função para normalizar strings
function normalizeString(str) {
  if (!str) return '';
  return str.trim()
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ÁÀÂÃÄ]/g, 'A')
    .replace(/[ÉÈÊË]/g, 'E')
    .replace(/[ÍÌÎÏ]/g, 'I')
    .replace(/[ÓÒÔÕÖ]/g, 'O')
    .replace(/[ÚÙÛÜ]/g, 'U')
    .replace(/[Ç]/g, 'C')
    .replace(/\s+/g, ' ')
    .trim();
}

// Função para criar slug
function createSlug(text) {
  return normalizeString(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Função para converter valor para número
function parseValue(value) {
  if (!value || value.trim() === '' || value.toLowerCase() === 'no se aplica') {
    return null;
  }
  
  // Remover % e outros caracteres
  const cleanValue = value.toString()
    .replace(/[%]/g, '')
    .replace(/[^\d,.-]/g, '')
    .replace(/,/g, '.');
    
  const number = parseFloat(cleanValue);
  return isNaN(number) ? null : number;
}

async function importData() {
  try {
    console.log('🚀 Iniciando importação...');
    
    // Encontrar ou criar setor "Programas"
    let setor = await db.select().from(gvSectors).where(eq(gvSectors.slug, 'programas')).limit(1);
    if (setor.length === 0) {
      setor = await db.insert(gvSectors).values({
        name: 'Programas Institucionais',
        slug: 'programas',
        description: 'Programas do Instituto O Grito',
        active: true
      }).returning();
    }
    const sectorId = setor[0].id;
    
    const processedData = [];
    
    for (const line of dataLines) {
      const columns = line.split(';');
      
      const programa = normalizeString(columns[0]);
      const projeto = normalizeString(columns[1]);
      const indicador = normalizeString(columns[2]);
      const meta = columns[3]?.trim();
      const recorrencia = normalizeString(columns[4]);
      
      if (!programa || !projeto || !indicador) {
        console.log(`⚠️  Linha inválida ignorada: ${line.substring(0, 100)}...`);
        continue;
      }
      
      console.log(`📊 Processando: ${programa} > ${projeto} > ${indicador}`);
      
      // Encontrar ou criar projeto
      let projectRecord = await db.select()
        .from(gvProjects)
        .where(eq(gvProjects.slug, createSlug(projeto)))
        .limit(1);
        
      if (projectRecord.length === 0) {
        projectRecord = await db.insert(gvProjects).values({
          name: projeto,
          slug: createSlug(projeto),
          description: `${programa} - ${projeto}`,
          sector_id: sectorId,
          active: true
        }).returning();
      }
      const projectId = projectRecord[0].id;
      
      // Encontrar ou criar indicador
      let indicatorRecord = await db.select()
        .from(gvMgmtIndicators)
        .where(eq(gvMgmtIndicators.name, indicador))
        .limit(1);
        
      if (indicatorRecord.length === 0) {
        indicatorRecord = await db.insert(gvMgmtIndicators).values({
          name: indicador,
          description: `${indicador} - ${programa}`,
          unit: meta.includes('%') ? 'percentage' : 'count',
          calculation_method: 'manual',
          data_source: 'excel_import',
          update_frequency: recorrencia || 'monthly',
          active: true
        }).returning();
      }
      const indicatorId = indicatorRecord[0].id;
      
      // Encontrar ou criar assignment
      let assignmentRecord = await db.select()
        .from(gvIndicatorAssignments)
        .where(and(
          eq(gvIndicatorAssignments.indicator_id, indicatorId),
          eq(gvIndicatorAssignments.project_id, projectId)
        ))
        .limit(1);
        
      if (assignmentRecord.length === 0) {
        assignmentRecord = await db.insert(gvIndicatorAssignments).values({
          indicator_id: indicatorId,
          project_id: projectId,
          is_primary: true,
          weight: 1.0,
          active: true
        }).returning();
      }
      const assignmentId = assignmentRecord[0].id;
      
      // Processar dados mensais - MAPEAMENTO CORRETO DAS COLUNAS
      // O CSV tem colunas de MÉDIA entre os meses, então precisamos mapear corretamente:
      // JANEIRO=5, FEVEREIRO=6, MARÇO=7, ABRIL=8, [MÉDIA]=9,
      // MAIO=10, JUNHO=11, [MÉDIA]=12,
      // JULHO=13, AGOSTO=14, SETEMBRO=15, [MÉDIA]=16,
      // OUTUBRO=17, NOVEMBRO=18, DEZEMBRO=19, [MÉDIA]=20, ANUAL=21
      const monthColumnMap = [
        { name: 'JANEIRO', index: 5, monthNumber: 1 },
        { name: 'FEVEREIRO', index: 6, monthNumber: 2 },
        { name: 'MARÇO', index: 7, monthNumber: 3 },
        { name: 'ABRIL', index: 8, monthNumber: 4 },
        { name: 'MAIO', index: 10, monthNumber: 5 },
        { name: 'JUNHO', index: 11, monthNumber: 6 },
        { name: 'JULHO', index: 13, monthNumber: 7 },
        { name: 'AGOSTO', index: 14, monthNumber: 8 },
        { name: 'SETEMBRO', index: 15, monthNumber: 9 },
        { name: 'OUTUBRO', index: 17, monthNumber: 10 },
        { name: 'NOVEMBRO', index: 18, monthNumber: 11 },
        { name: 'DEZEMBRO', index: 19, monthNumber: 12 }
      ];
      
      for (const monthInfo of monthColumnMap) {
        if (monthInfo.index < columns.length) {
          const rawValue = columns[monthInfo.index];
          const actualValue = parseValue(rawValue);
          
          if (actualValue !== null) {
            // Deletar dados existentes para evitar duplicação
            await db.delete(gvMonthlyData)
              .where(and(
                eq(gvMonthlyData.assignment_id, assignmentId),
                eq(gvMonthlyData.year, 2025),
                eq(gvMonthlyData.month, monthInfo.monthNumber)
              ));
            
            // Inserir novo dado
            await db.insert(gvMonthlyData).values({
              assignment_id: assignmentId,
              year: 2025,
              month: monthInfo.monthNumber,
              month_name: monthInfo.name,
              target_value: meta || null,
              actual_value: actualValue.toString(),
              recurrence: recorrencia || 'monthly',
              data_source: 'GESTAO A VISTA 2025 ok(INDICADORES GERAL FDC)',
              imported_at: new Date(),
            });
            
            console.log(`  ✅ ${monthInfo.name}: ${actualValue}`);
          }
        }
      }
      
      processedData.push({
        programa,
        projeto,
        indicador,
        meta,
        assignmentId
      });
    }
    
    console.log(`🎉 Importação concluída! ${processedData.length} indicadores processados.`);
    
    // Estatísticas finais
    const stats = await db.select().from(gvMonthlyData)
      .where(eq(gvMonthlyData.data_source, 'GESTAO A VISTA 2025 ok(INDICADORES GERAL FDC)'));
    
    console.log(`📊 Total de registros mensais importados: ${stats.length}`);
    
    return processedData;
    
  } catch (error) {
    console.error('❌ Erro na importação:', error);
    throw error;
  }
}

// Executar importação
importData()
  .then((result) => {
    console.log('✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro no script:', error);
    process.exit(1);
  });