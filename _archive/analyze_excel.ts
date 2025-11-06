import XLSX from 'xlsx';

const workbook = XLSX.readFile('attached_assets/PLANEJAMENTO FINANCEIRO 2025 COM FAVELA (1)_1759772504530.xlsx');

console.log('=== ANALISANDO TODAS AS ABAS ===\n');

workbook.SheetNames.forEach(sheetName => {
  console.log('============================================================');
  console.log('ABA:', sheetName);
  console.log('============================================================');
  
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  
  console.log('Total de linhas:', data.length);
  
  // Procurar por valores negativos grandes (podem ser "Pago ou Recebido")
  let foundLargeNegatives = false;
  for (let i = 0; i < Math.min(50, data.length); i++) {
    for (let j = 0; j < data[i].length; j++) {
      const val = data[i][j];
      if (typeof val === 'number' && val < -50000) {
        console.log(`  Valor negativo grande na linha ${i+1}, col ${j+1}: ${val}`);
        console.log(`    Contexto:`, data[i].slice(0, 5));
        foundLargeNegatives = true;
      }
    }
  }
  
  if (!foundLargeNegatives) {
    console.log('  (sem valores negativos grandes)');
  }
  console.log('');
});
