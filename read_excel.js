const ExcelJS = require('exceljs');
const fs = require('fs');

async function main() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('e:/AntigravityProject/teacher-services-ai/packages/shared/excel/excel_template/order_template2.xlsx');
  const worksheet = workbook.worksheets[0];
  
  let output = '';
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      output += `Row ${rowNumber}, Col ${colNumber} (Cell ${cell.address}): ${cell.value}\n`;
    });
  });
  
  // also dump merged cells to see their layout
  output += '\nMerged Cells:\n';
  const merges = worksheet.model.merges;
  if (merges) {
    merges.forEach(merge => {
      output += `${merge}\n`;
    });
  }

  fs.writeFileSync('e:/AntigravityProject/teacher-services-ai/excel_output.txt', output);
}

main().catch(err => {
  fs.writeFileSync('e:/AntigravityProject/teacher-services-ai/excel_output.txt', err.toString());
});
