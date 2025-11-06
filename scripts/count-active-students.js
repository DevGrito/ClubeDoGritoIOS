import XLSX from 'xlsx';
import fs from 'fs';
import * as fs from 'node:fs';
import * as path from 'node:path'; // quando usar path


function countActiveStudents() {
  try {
    // Read the main Gestão à Vista spreadsheet
    const gestaoFile = 'attached_assets/GESTAO A VISTA FDC_1752006150975.xlsx';
    const listaFile = 'attached_assets/Lista de Atendidos da organizacao_reserva_1752254170357.xlsx';
    
    let activeStudentsCount = 0;
    let totalStudentsCount = 0;
    let details = [];
    
    console.log('🔍 Analyzing student data in spreadsheets...\n');
    
    // First, analyze the main Gestão à Vista file
    if (fs.existsSync(gestaoFile)) {
      const workbook = XLSX.readFile(gestaoFile);
      console.log('📊 Sheets in GESTAO A VISTA file:');
      workbook.SheetNames.forEach(sheetName => {
        console.log(`  - ${sheetName}`);
      });
      
      // Look for student-related data in each sheet
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // Check for student/aluno related data
        if (data.length > 0) {
          const headers = data[0];
          const hasStudentData = headers.some(header => 
            header && header.toString().toLowerCase().includes('aluno') ||
            header && header.toString().toLowerCase().includes('atendido') ||
            header && header.toString().toLowerCase().includes('participante') ||
            header && header.toString().toLowerCase().includes('ativo') ||
            header && header.toString().toLowerCase().includes('status')
          );
          
          if (hasStudentData) {
            console.log(`\n🎓 Found student data in sheet: ${sheetName}`);
            console.log('Headers:', headers);
            
            // Count active students in this sheet
            for (let i = 1; i < data.length; i++) {
              const row = data[i];
              if (row && row.length > 0) {
                totalStudentsCount++;
                
                // Check for active status
                const isActive = row.some(cell => {
                  if (cell === null || cell === undefined) return false;
                  const cellStr = cell.toString().toLowerCase();
                  return cellStr.includes('ativo') || 
                         cellStr.includes('active') || 
                         cellStr === 'sim' || 
                         cellStr === 'yes' || 
                         cellStr === '1';
                });
                
                if (isActive) {
                  activeStudentsCount++;
                }
              }
            }
            
            details.push({
              sheet: sheetName,
              headers: headers,
              totalRows: data.length - 1
            });
          }
        }
      });
    }
    
    // Now analyze the Lista de Atendidos file
    if (fs.existsSync(listaFile)) {
      console.log('\n📋 Analyzing Lista de Atendidos file...');
      const workbook = XLSX.readFile(listaFile);
      console.log('📊 Sheets in Lista de Atendidos file:');
      workbook.SheetNames.forEach(sheetName => {
        console.log(`  - ${sheetName}`);
      });
      
      // This file likely contains the comprehensive list of students
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        if (data.length > 0) {
          const headers = data[0];
          console.log(`\n📝 Sheet: ${sheetName}`);
          console.log('Headers:', headers);
          
          // Look for status column
          const statusColumnIndex = headers.findIndex(header => 
            header && header.toString().toLowerCase().includes('status') ||
            header && header.toString().toLowerCase().includes('ativo') ||
            header && header.toString().toLowerCase().includes('situacao')
          );
          
          let sheetActiveCount = 0;
          let sheetTotalCount = 0;
          
          for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
              sheetTotalCount++;
              
              // Check status column or search for active indicators
              let isActive = false;
              
              if (statusColumnIndex !== -1 && row[statusColumnIndex]) {
                const statusValue = row[statusColumnIndex].toString().toLowerCase();
                isActive = statusValue.includes('ativo') || 
                          statusValue.includes('active') || 
                          statusValue === 'sim' || 
                          statusValue === 'yes' || 
                          statusValue === '1';
              } else {
                // Check all cells in the row for active indicators
                isActive = row.some(cell => {
                  if (cell === null || cell === undefined) return false;
                  const cellStr = cell.toString().toLowerCase();
                  return cellStr.includes('ativo') || 
                         cellStr.includes('active') || 
                         cellStr === 'sim' || 
                         cellStr === 'yes';
                });
              }
              
              if (isActive) {
                sheetActiveCount++;
              }
            }
          }
          
          console.log(`Total rows with data: ${sheetTotalCount}`);
          console.log(`Active students found: ${sheetActiveCount}`);
          
          // Use the largest dataset as the authoritative source
          if (sheetTotalCount > totalStudentsCount) {
            activeStudentsCount = sheetActiveCount;
            totalStudentsCount = sheetTotalCount;
            console.log(`\n✅ Using ${sheetName} as primary data source`);
          }
          
          details.push({
            sheet: sheetName,
            headers: headers,
            totalRows: sheetTotalCount,
            activeRows: sheetActiveCount,
            statusColumn: statusColumnIndex
          });
        }
      });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL RESULTS:');
    console.log('='.repeat(50));
    console.log(`Total students found: ${totalStudentsCount}`);
    console.log(`Active students: ${activeStudentsCount}`);
    console.log(`Inactive students: ${totalStudentsCount - activeStudentsCount}`);
    console.log('='.repeat(50));
    
    // Print detailed breakdown
    console.log('\n📋 Detailed breakdown by sheet:');
    details.forEach(detail => {
      console.log(`\n📄 ${detail.sheet}:`);
      console.log(`  Total rows: ${detail.totalRows}`);
      if (detail.activeRows !== undefined) {
        console.log(`  Active rows: ${detail.activeRows}`);
      }
      if (detail.statusColumn !== undefined) {
        console.log(`  Status column index: ${detail.statusColumn}`);
      }
    });
    
    return { activeStudentsCount, totalStudentsCount, details };
    
  } catch (error) {
    console.error('Error analyzing student data:', error);
    throw error;
  }
}

// Run the analysis
countActiveStudents();