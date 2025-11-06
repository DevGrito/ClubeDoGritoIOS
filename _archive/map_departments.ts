import XLSX from 'xlsx';

const workbook = XLSX.readFile('attached_assets/PLANEJAMENTO FINANCEIRO 2025 COM FAVELA (1)_1759772504530.xlsx');

console.log('=== SOMANDO RECEITAS E DESPESAS DE CADA ABA ===\n');

const abasDepartamentos = ['ADM', 'MARKETING', 'PEC', 'CASA SONHAR', 'Q. PROF.', 'PSICOSSOCIAL', 'GRIFFTE', 'OUTLET'];

abasDepartamentos.forEach(abaName => {
  if (!workbook.Sheets[abaName]) {
    console.log(`Aba ${abaName} não encontrada\n`);
    return;
  }
  
  const sheet = workbook.Sheets[abaName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  
  let totalReceitas = 0;
  let totalDespesas = 0;
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[1] === 'RECEITAS' && typeof row[14] === 'number') {
      totalReceitas = row[14];
    }
    if (row[1] === 'DESPESAS' && typeof row[14] === 'number') {
      totalDespesas = row[14];
    }
  }
  
  console.log(`${abaName}:`);
  console.log(`  Receitas: R$ ${totalReceitas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
  console.log(`  Despesas: R$ ${totalDespesas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
  console.log(`  Saldo: R$ ${(totalReceitas - totalDespesas).toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n`);
});
