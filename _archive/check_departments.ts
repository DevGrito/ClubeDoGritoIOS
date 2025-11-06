import XLSX from 'xlsx';

const workbook = XLSX.readFile('attached_assets/PLANEJAMENTO FINANCEIRO 2025 COM FAVELA (1)_1759772504530.xlsx');

console.log('=== VERIFICANDO ESTRUTURA DE DEPARTAMENTOS NA PLANILHA ===\n');

const sheet = workbook.Sheets['GERAL'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

console.log('Linha 3 (cabeçalho):', data[2]);
console.log('\nProcurando por linhas RECEITAS e DESPESAS com valores:\n');

let found = 0;
for (let i = 0; i < Math.min(150, data.length) && found < 20; i++) {
  const firstCell = String(data[i][0] || '').toUpperCase();
  const secondCell = String(data[i][1] || '').toUpperCase();
  
  if (secondCell.includes('RECEITA') || secondCell.includes('DESPESA')) {
    console.log(`Linha ${i+1}: Col1="${data[i][0]}" | Col2="${data[i][1]}" | Col3=${data[i][2]}`);
    found++;
  }
}

console.log('\n=== VERIFICANDO OUTRAS ABAS (por departamento) ===\n');
workbook.SheetNames.forEach(name => {
  if (!['RESUMO', 'GERAL', 'VALOR SETORIZADO', 'PREVISTO X REALIZADO'].includes(name)) {
    console.log(`Aba: ${name}`);
  }
});
