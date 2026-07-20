const ExcelJS = require('exceljs');
const path = require('path');

async function findCells() {
  const workbook = new ExcelJS.Workbook();
  // Read the template
  await workbook.xlsx.readFile(path.join(__dirname, 'excel/template.xlsx'));
  const worksheet = workbook.worksheets[0];
  
  const results = {};
  
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      if (cell.value && typeof cell.value === 'string') {
        const val = cell.value.trim();
        // Record coordinates of interesting labels
        if (['عربي', 'دين', 'علوم', 'رياضيات', 'E', 'اجتماعيات', 'اول', 'ثاني', 'ثالث', 'اسم المعلم', 'اسم المدرسة', 'اسم المديرية', 'رقم الهاتف'].some(k => val.includes(k))) {
          results[val] = cell.address;
        }
      }
    });
  });
  
  console.log(JSON.stringify(results, null, 2));
}

findCells().catch(console.error);
