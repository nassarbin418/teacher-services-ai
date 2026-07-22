const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function parse() {
  const filePath = path.resolve(__dirname, '../../packages/shared/excel/template.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const worksheet = workbook.worksheets[workbook.worksheets.length - 1];
  const nodes = {};
  
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      if (cell.value) {
        let val = typeof cell.value === 'object' ? cell.text || (cell.value && cell.value.richText && cell.value.richText.map(rt => rt.text).join('')) || cell.value.toString() : cell.value.toString();
        val = val.trim().replace(/\n/g, ' ');
        if (val) {
          nodes[cell.address] = val;
        }
      }
    });
  });
  
  fs.writeFileSync(path.resolve(__dirname, 'nodes.json'), JSON.stringify(nodes, null, 2));
  console.log("تم حفظ الملف بنجاح!");
}

parse().catch(console.error);
