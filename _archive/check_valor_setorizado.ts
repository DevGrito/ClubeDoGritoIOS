import XLSX from 'xlsx';

const workbook = XLSX.readFile('attached_assets/PLANEJAMENTO FINANCEIRO 2025 COM FAVELA (1)_1759772504530.xlsx');

console.log('=== VERIFICANDO ABA VALOR SETORIZADO ===\n');

const sheet = workbook.Sheets['VALOR SETORIZADO'];
if (!sheet) {
  console.log('Aba VALOR SETORIZADO não encontrada');
} else {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  
  console.log('Primeiras 30 linhas da aba VALOR SETORIZADO:\n');
  for (let i = 0; i < 30 && i < data.length; i++) {
    if (data[i][0] || data[i][1] || data[i][2]) {
      console.log(`Linha ${i+1}:`, data[i].slice(0, 8));
    }
  }
}
