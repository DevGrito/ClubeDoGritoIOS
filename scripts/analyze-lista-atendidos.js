import XLSX from 'xlsx';
import fs from 'fs';
import * as fs from 'node:fs';
import * as path from 'node:path';


function analyzeListaAtendidos() {
  try {
    const listaFile = '../attached_assets/Lista de Atendidos da organizacao_reserva_1752254170357.xlsx';
    
    if (!fs.existsSync(listaFile)) {
      console.log('Lista de Atendidos file not found.');
      return { activeStudents: 0, totalStudents: 0 };
    }
    
    console.log('📋 Analyzing Lista de Atendidos spreadsheet...\n');
    
    const workbook = XLSX.readFile(listaFile);
    let totalActiveStudents = 0;
    let totalStudents = 0;
    
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log(`\n📄 Sheet ${index + 1}: ${sheetName}`);
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      if (data.length > 0) {
        const headers = data[0];
        console.log(`Headers: ${JSON.stringify(headers)}`);
        
        // Count non-empty rows (excluding header)
        let nonEmptyRows = 0;
        let activeCount = 0;
        
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (row && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
            nonEmptyRows++;
            
            // Check for active status indicators
            const hasActiveIndicator = row.some(cell => {
              if (cell === null || cell === undefined) return false;
              const cellStr = cell.toString().toLowerCase();
              return cellStr.includes('ativo') || 
                     cellStr.includes('active') || 
                     cellStr === 'sim' || 
                     cellStr === 'yes' || 
                     cellStr === '1';
            });
            
            if (hasActiveIndicator) {
              activeCount++;
            }
          }
        }
        
        console.log(`Total records: ${nonEmptyRows}`);
        console.log(`Active records: ${activeCount}`);
        
        // Assume all records are active if no specific status indicators found
        if (activeCount === 0 && nonEmptyRows > 0) {
          console.log('No explicit status indicators found - assuming all records are active');
          activeCount = nonEmptyRows;
        }
        
        totalStudents += nonEmptyRows;
        totalActiveStudents += activeCount;
      }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 LISTA DE ATENDIDOS SUMMARY:`);
    console.log(`Total individual student records: ${totalStudents}`);
    console.log(`Active student records: ${totalActiveStudents}`);
    console.log('='.repeat(50));
    
    return { activeStudents: totalActiveStudents, totalStudents: totalStudents };
    
  } catch (error) {
    console.error('Error analyzing Lista de Atendidos:', error);
    return { activeStudents: 0, totalStudents: 0 };
  }
}

// Run the analysis
const result = analyzeListaAtendidos();
console.log(`\n🎓 FINAL COUNT FROM LISTA DE ATENDIDOS: ${result.activeStudents} active students`);