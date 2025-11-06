import fs from 'fs';

// Read the extracted data
const data = JSON.parse(fs.readFileSync('extracted-gestao-vista-data.json', 'utf8'));

console.log('=== ANÁLISE DAS ABAS DA PLANILHA ===\n');

// List all available sheets
const sheets = Object.keys(data);
console.log('Abas disponíveis:');
sheets.forEach((sheet, index) => {
  console.log(`${index + 1}. ${sheet}`);
});

console.log('\n=== MAPEAMENTO PARA DASHBOARDS ===\n');

// Analyze each sheet for specific sections
const sectionMapping = {
  'Favela 3D': [],
  'Inclusão Produtiva': [],
  'PEC': [],
  'Psicossocial': []
};

// Potential mappings based on sheet names
sheets.forEach(sheet => {
  if (sheet.toLowerCase().includes('casa') || sheet.toLowerCase().includes('sonhar')) {
    sectionMapping['Favela 3D'].push(sheet);
  }
  if (sheet.toLowerCase().includes('psico') || sheet.toLowerCase().includes('marketing')) {
    sectionMapping['Psicossocial'].push(sheet);
  }
  if (sheet.toLowerCase().includes('polo') || sheet.toLowerCase().includes('gloria')) {
    sectionMapping['Inclusão Produtiva'].push(sheet);
  }
  if (sheet.toLowerCase().includes('ponte') || sheet.toLowerCase().includes('patrimar')) {
    sectionMapping['PEC'].push(sheet);
  }
});

// Display mappings
Object.entries(sectionMapping).forEach(([section, mappedSheets]) => {
  console.log(`${section}:`);
  if (mappedSheets.length > 0) {
    mappedSheets.forEach(sheet => console.log(`  - ${sheet}`));
  } else {
    console.log('  - Nenhuma aba identificada automaticamente');
  }
  console.log();
});

console.log('=== ANÁLISE DETALHADA POR ABA ===\n');

// Analyze each sheet structure
sheets.forEach(sheet => {
  console.log(`--- ${sheet} ---`);
  const sheetData = data[sheet];
  
  if (sheetData && sheetData.length > 0) {
    console.log(`Linhas: ${sheetData.length}`);
    
    // Show first few rows with content
    const firstRows = sheetData.slice(0, 5).filter(row => 
      row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== '')
    );
    
    console.log('Primeiras linhas com conteúdo:');
    firstRows.forEach((row, index) => {
      const cleanRow = row.filter(cell => cell !== null && cell !== undefined && cell !== '');
      if (cleanRow.length > 0) {
        console.log(`  ${index + 1}: [${cleanRow.slice(0, 5).join(', ')}...]`);
      }
    });
  } else {
    console.log('Aba vazia ou sem dados estruturados');
  }
  console.log();
});