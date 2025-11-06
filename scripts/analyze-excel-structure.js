import XLSX from 'xlsx';
import fs from 'fs';
import * as fs from 'node:fs';
import * as path from 'node:path'; // quando usar path


function analyzeExcelFiles() {
  try {
    const gestaoFile = 'attached_assets/GESTAO A VISTA FDC_1752006150975.xlsx';
    const listaFile = 'attached_assets/Lista de Atendidos da organizacao_reserva_1752254170357.xlsx';
    
    console.log('🔍 Analyzing Excel file structures...\n');
    
    // Analyze Gestão à Vista file
    if (fs.existsSync(gestaoFile)) {
      console.log('📊 GESTAO A VISTA FDC file analysis:');
      const workbook = XLSX.readFile(gestaoFile);
      
      workbook.SheetNames.forEach((sheetName, index) => {
        console.log(`\n📄 Sheet ${index + 1}: ${sheetName}`);
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        console.log(`  Rows: ${data.length}`);
        if (data.length > 0) {
          console.log(`  Headers: ${JSON.stringify(data[0])}`);
          
          // Show first few rows of data
          if (data.length > 1) {
            console.log(`  Sample data rows:`);
            for (let i = 1; i < Math.min(4, data.length); i++) {
              console.log(`    Row ${i}: ${JSON.stringify(data[i])}`);
            }
          }
          
          // Look for student-related keywords
          const allText = JSON.stringify(data).toLowerCase();
          const studentKeywords = ['aluno', 'atendido', 'participante', 'estudante', 'ativo', 'inativo'];
          const foundKeywords = studentKeywords.filter(keyword => allText.includes(keyword));
          if (foundKeywords.length > 0) {
            console.log(`  🎓 Student-related keywords found: ${foundKeywords.join(', ')}`);
          }
        }
      });
    }
    
    // Analyze Lista de Atendidos file
    if (fs.existsSync(listaFile)) {
      console.log('\n\n📋 LISTA DE ATENDIDOS file analysis:');
      const workbook = XLSX.readFile(listaFile);
      
      workbook.SheetNames.forEach((sheetName, index) => {
        console.log(`\n📄 Sheet ${index + 1}: ${sheetName}`);
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        console.log(`  Rows: ${data.length}`);
        if (data.length > 0) {
          console.log(`  Headers: ${JSON.stringify(data[0])}`);
          
          // Show first few rows of data
          if (data.length > 1) {
            console.log(`  Sample data rows:`);
            for (let i = 1; i < Math.min(4, data.length); i++) {
              console.log(`    Row ${i}: ${JSON.stringify(data[i])}`);
            }
          }
          
          // Count non-empty rows
          let nonEmptyRows = 0;
          for (let i = 1; i < data.length; i++) {
            if (data[i] && data[i].some(cell => cell !== null && cell !== undefined && cell !== '')) {
              nonEmptyRows++;
            }
          }
          console.log(`  Non-empty data rows: ${nonEmptyRows}`);
          
          // Look for status indicators
          const statusKeywords = ['ativo', 'inativo', 'status', 'situacao', 'participante'];
          const foundStatusKeywords = [];
          
          if (data.length > 0) {
            const headers = data[0];
            headers.forEach((header, index) => {
              if (header && typeof header === 'string') {
                const headerLower = header.toLowerCase();
                statusKeywords.forEach(keyword => {
                  if (headerLower.includes(keyword)) {
                    foundStatusKeywords.push(`${header} (column ${index})`);
                  }
                });
              }
            });
            
            if (foundStatusKeywords.length > 0) {
              console.log(`  📊 Status-related columns: ${foundStatusKeywords.join(', ')}`);
            }
          }
        }
      });
    }
    
  } catch (error) {
    console.error('Error analyzing Excel files:', error);
    throw error;
  }
}

// Run the analysis
analyzeExcelFiles();