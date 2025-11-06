import XLSX from 'xlsx';
import fs from 'fs';

// Read the Excel file
const workbook = XLSX.readFile('../attached_assets/GESTAO A VISTA FDC_1752006150975.xlsx');

// Get all sheet names
const sheetNames = workbook.SheetNames;
console.log('Available sheets:', sheetNames);

// Read all sheets and their data
const allData = {};
sheetNames.forEach(sheetName => {
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  allData[sheetName] = jsonData;
  
  console.log(`\n=== Sheet: ${sheetName} ===`);
  console.log('First 10 rows:');
  jsonData.slice(0, 10).forEach((row, index) => {
    console.log(`Row ${index + 1}:`, row);
  });
});

// Save the extracted data to a JSON file for analysis
fs.writeFileSync('extracted-gestao-vista-data.json', JSON.stringify(allData, null, 2));
console.log('\nData extracted and saved to extracted-gestao-vista-data.json');