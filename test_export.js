const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Simulate the export process
async function testExport(numItems) {
  const excelTemplateUrl = 'e:/AntigravityProject/teacher-services-ai/packages/shared/excel/excel_template/order_template2.xlsx';
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelTemplateUrl);
  const worksheet = workbook.worksheets[0];

  const setHeaderStyle = (cell) => {
    cell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF000000' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
  };

  const setValueStyle = (cell) => {
    cell.font = { name: 'Segoe UI', size: 11, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
  };

  ['A2', 'B2', 'A6', 'B6', 'C6', 'D6', 'E6', 'A10', 'B10', 'C10', 'D10', 'E10'].forEach(ref => {
    setHeaderStyle(worksheet.getCell(ref));
  });
  ['A3', 'B3', 'A7', 'B7', 'C7', 'D7', 'E7'].forEach(ref => {
    setValueStyle(worksheet.getCell(ref));
  });

  const setDataStyle = (cell) => {
    cell.font = { name: 'Segoe UI', size: 11, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };
  };

  const safeMerge = (startRow, startCol, endRow, endCol) => {
    try { worksheet.mergeCells(startRow, startCol, endRow, endCol); } catch (e) {}
  };

  let currentRowIndex = 11;
  try { worksheet.unMergeCells('A19:B19'); } catch (e) {}
  try { worksheet.unMergeCells('D19:E19'); } catch (e) {}
  try { worksheet.unMergeCells('A20:B22'); } catch (e) {}
  try { worksheet.unMergeCells('D20:E22'); } catch (e) {}

  for (let index = 0; index < numItems; index++) {
    const r = 11 + index;
    if (index > 0) worksheet.getRow(r).height = 24;
    const cellA = worksheet.getCell(`A${r}`); cellA.value = 'T'; setDataStyle(cellA);
    const cellB = worksheet.getCell(`B${r}`); cellB.value = 'S'; setDataStyle(cellB);
    const cellC = worksheet.getCell(`C${r}`); cellC.value = 'G'; setDataStyle(cellC);
    const cellD = worksheet.getCell(`D${r}`); cellD.value = 'Ty'; setDataStyle(cellD);
    const cellE = worksheet.getCell(`E${r}`); cellE.value = 'P'; setDataStyle(cellE);
  }
  currentRowIndex = 11 + numItems;

  for (let r = currentRowIndex; r <= Math.max(35, currentRowIndex + 15); r++) {
    for (let c = 1; c <= 5; c++) {
      const cell = worksheet.getCell(r, c);
      cell.value = '';
      cell.fill = { type: 'pattern', pattern: 'none' };
      cell.border = {};
    }
  }

  // Check A10 style
  const a10 = worksheet.getCell('A10');
  console.log(`Num items: ${numItems}, A10 font bold: ${a10.font?.bold}, fill fgColor: ${a10.fill?.fgColor?.argb}`);
}

async function run() {
  await testExport(2);
  await testExport(12);
}
run();
