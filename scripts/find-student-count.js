import fs from 'fs';
import * as fs from 'node:fs';
import * as path from 'node:path'; // quando usar path


function findStudentCounts() {
  try {
    const data = JSON.parse(fs.readFileSync('extracted-gestao-vista-data.json', 'utf8'));
    
    console.log('🔍 Searching for student counts in spreadsheet data...\n');
    
    let totalActiveStudents = 0;
    let findings = [];
    
    // Search through all sheets
    Object.keys(data).forEach(sheetName => {
      const sheetData = data[sheetName];
      
      // Look for rows containing student-related keywords
      sheetData.forEach((row, rowIndex) => {
        if (row && Array.isArray(row)) {
          row.forEach((cell, cellIndex) => {
            if (cell && typeof cell === 'string') {
              const cellText = cell.toString().toLowerCase();
              
              // Check for student count indicators
              if (cellText.includes('quantidade de alunos') || 
                  cellText.includes('alunos') || 
                  cellText.includes('participantes') ||
                  cellText.includes('atendidos')) {
                
                console.log(`📊 Found student indicator in ${sheetName}:`);
                console.log(`  Row ${rowIndex + 1}, Cell ${cellIndex + 1}: "${cell}"`);
                
                // Look for numbers in the same row
                const numbersInRow = row.filter(c => typeof c === 'number' && c > 0);
                if (numbersInRow.length > 0) {
                  console.log(`  Numbers in same row: ${numbersInRow.join(', ')}`);
                  
                  // For "QUANTIDADE DE ALUNOS", use the number as active count
                  if (cellText.includes('quantidade de alunos')) {
                    const count = Math.max(...numbersInRow);
                    totalActiveStudents += count;
                    findings.push({
                      sheet: sheetName,
                      indicator: cell,
                      count: count,
                      row: rowIndex + 1
                    });
                  }
                }
                console.log('---');
              }
            }
          });
        }
      });
    });
    
    console.log('\n📋 SUMMARY OF FINDINGS:');
    console.log('='.repeat(50));
    
    if (findings.length > 0) {
      findings.forEach(finding => {
        console.log(`${finding.sheet} - ${finding.indicator}: ${finding.count} students`);
      });
      
      console.log(`\n🎓 TOTAL ACTIVE STUDENTS: ${totalActiveStudents}`);
    } else {
      console.log('No clear student count indicators found in the spreadsheet.');
    }
    
    // Also check if there's a "Lista de Atendidos" file
    const listaFile = 'attached_assets/Lista de Atendidos da organizacao_reserva_1752254170357.xlsx';
    if (fs.existsSync(listaFile)) {
      console.log('\n📄 Note: Found "Lista de Atendidos" file which may contain detailed student records.');
      console.log('This file likely contains the comprehensive list of individual students.');
    }
    
    return { totalActiveStudents, findings };
    
  } catch (error) {
    console.error('Error analyzing student data:', error);
    return { totalActiveStudents: 0, findings: [] };
  }
}

// Run the analysis
const result = findStudentCounts();
console.log('\n' + '='.repeat(50));
console.log(`📊 FINAL RESULT: ${result.totalActiveStudents} active students found in Gestão à Vista spreadsheet`);
console.log('='.repeat(50));