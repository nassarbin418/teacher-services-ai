import ExcelJS from 'exceljs';
import excelTemplateUrl from '../../../../packages/shared/excel/excel_template/order_template2.xlsx?url';

export const exportOrderToExcel = async (order: any, itemsParam?: any[]) => {
  try {
    // 1. Fetch and load the exact Excel template file
    const response = await fetch(excelTemplateUrl);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.worksheets[0];

    // Ensure Right-To-Left view for Arabic sheet
    worksheet.views = [{ rightToLeft: true }];

    // Format createdAt date & time string with ' | ' separator
    let formattedCreatedAt = '—';
    if (order.created_at) {
      const d = new Date(order.created_at);
      const dateStr = d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
      const timeStr = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
      formattedCreatedAt = `${dateStr} | ${timeStr}`;
    }

    // Service Type Label Mapper
    const serviceTypeName = (type: number | string) => {
      if (type === 0 || type === '0') return 'خطة فصلية';
      if (type === 1 || type === '1') return 'تحضير يومي';
      if (type === 2 || type === '2') return 'بكج كامل (خطة وتحضير وتحليل)';
      return String(type || 'غير محدد');
    };

    // Styling helpers for static cells
    const setHeaderStyle = (cell: any) => {
      cell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF000000' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
    };

    const setValueStyle = (cell: any) => {
      cell.font = { name: 'Segoe UI', size: 11, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    };

    // --- 1. Fill Order Info (معلومات الطلب) ---
    // Cell A3: Order ID
    const cellA3 = worksheet.getCell('A3');
    cellA3.value = `#${order.id || ''}`;

    // Cell B3: Order Creation Date
    const cellB3 = worksheet.getCell('B3');
    cellB3.value = formattedCreatedAt;

    // --- 2. Fill Customer Info (معلومات العميل) ---
    // Row 7 (Values 1): المدرسة | اللواء/المنطقة | الاسم | نوع التعليم | نوع المدرسة
    worksheet.getCell('A7').value = order.school_name || '';
    worksheet.getCell('B7').value = order.district || '—';
    worksheet.getCell('C7').value = order.customer_name || '';
    worksheet.getCell('D7').value = order.directorate || '—';
    worksheet.getCell('E7').value = order.school_type || '—';

    // --- 3. Fill Teachers & Items (تفاصيل المعلمين والمواد) ---
    const itemsRaw = itemsParam || order.order_items || order.items || [];
    // Sort items alphabetically by subject name
    const items = [...itemsRaw].sort((a: any, b: any) => {
      const subA = a.subject || '';
      const subB = b.subject || '';
      return subA.localeCompare(subB, 'ar');
    });
    // Style helper for data cells using Segoe UI font matching Windows Excel template
    const setDataStyle = (cell: any) => {
      cell.font = { name: 'Segoe UI', size: 11, bold: false, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    };

    const safeMerge = (startRow: number, startCol: number, endRow: number, endCol: number) => {
      try {
        worksheet.mergeCells(startRow, startCol, endRow, endCol);
      } catch (e) {
        // Cell range is already merged in template - safe to proceed
      }
    };

    // Items start at Row 11
    let currentRowIndex = 11;

    // --- CLEAN SLATE FOR DYNAMIC SECTION ---
    // 1. Unmerge template's fixed boxes so we don't get merge conflicts when drawing dynamically
    try { worksheet.unMergeCells('A19:B19'); } catch (e) {}
    try { worksheet.unMergeCells('D19:E19'); } catch (e) {}
    try { worksheet.unMergeCells('A20:B22'); } catch (e) {}
    try { worksheet.unMergeCells('D20:E22'); } catch (e) {}

    if (items && items.length > 0) {
      items.forEach((item: any, index: number) => {
        const r = 11 + index;
        if (index > 0) {
          worksheet.getRow(r).height = 24;
        }

        const cellA = worksheet.getCell(`A${r}`); cellA.style = {}; cellA.value = item.teacher_name || ''; setDataStyle(cellA);
        const cellB = worksheet.getCell(`B${r}`); cellB.style = {}; cellB.value = item.subject || ''; setDataStyle(cellB);
        const cellC = worksheet.getCell(`C${r}`); cellC.style = {}; cellC.value = item.grade || ''; setDataStyle(cellC);
        const cellD = worksheet.getCell(`D${r}`); cellD.style = {}; cellD.value = serviceTypeName(item.service_type); setDataStyle(cellD);
        const cellE = worksheet.getCell(`E${r}`); cellE.style = {}; cellE.value = `${item.price || 0} د.أ`; setDataStyle(cellE);
      });
      currentRowIndex = 11 + items.length;
    } else {
      const emptyCell = worksheet.getCell('A11');
      emptyCell.value = 'لا توجد مواد';
      safeMerge(11, 1, 11, 5);
      setDataStyle(emptyCell);
      currentRowIndex = 12;
    }

    // 2. Clear all formatting and text from currentRowIndex to row 35 to erase the old template footprint
    for (let r = currentRowIndex; r <= Math.max(35, currentRowIndex + 15); r++) {
      for (let c = 1; c <= 5; c++) {
        const cell = worksheet.getCell(r, c);
        cell.value = '';
        cell.fill = { type: 'pattern', pattern: 'none' };
        cell.border = {};
      }
    }

    // --- 4. Delivery Cost & Total Amount Rows (Dynamic placement) ---
    const isDelivery = String(order.delivery_type) === '1' || Number(order.delivery_cost) > 0;
    const deliveryCostVal = Number(order.delivery_cost) || (isDelivery ? 3 : 0);

    if (isDelivery || deliveryCostVal > 0) {
      // Write Delivery Cost at currentRowIndex
      const deliveryCellLabel = worksheet.getCell(`D${currentRowIndex}`);
      deliveryCellLabel.value = 'أجور التوصيل:';
      deliveryCellLabel.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF1F2937' } };
      deliveryCellLabel.alignment = { horizontal: 'left', vertical: 'middle' };
      deliveryCellLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      deliveryCellLabel.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };

      const deliveryCellVal = worksheet.getCell(`E${currentRowIndex}`);
      deliveryCellVal.value = `${deliveryCostVal} د.أ`;
      deliveryCellVal.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF1F2937' } };
      deliveryCellVal.alignment = { horizontal: 'center', vertical: 'middle' };
      deliveryCellVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      deliveryCellVal.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };

      currentRowIndex++;
    }

    // Write Total Amount at currentRowIndex
    const totalCellLabel = worksheet.getCell(`D${currentRowIndex}`);
    totalCellLabel.value = 'الإجمالي:';
    totalCellLabel.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF1E293B' } };
    totalCellLabel.alignment = { horizontal: 'left', vertical: 'middle' };
    totalCellLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    totalCellLabel.border = { top: { style: 'thin', color: { argb: 'FF94A3B8' } }, left: { style: 'thin', color: { argb: 'FF94A3B8' } }, bottom: { style: 'thin', color: { argb: 'FF94A3B8' } }, right: { style: 'thin', color: { argb: 'FF94A3B8' } } };

    const totalCellVal = worksheet.getCell(`E${currentRowIndex}`);
    totalCellVal.value = `${order.total_amount || 0} د.أ`;
    totalCellVal.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF059669' } };
    totalCellVal.alignment = { horizontal: 'center', vertical: 'middle' };
    totalCellVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    totalCellVal.border = { top: { style: 'thin', color: { argb: 'FF94A3B8' } }, left: { style: 'thin', color: { argb: 'FF94A3B8' } }, bottom: { style: 'thin', color: { argb: 'FF94A3B8' } }, right: { style: 'thin', color: { argb: 'FF94A3B8' } } };

    // Increment currentRowIndex by 1 for empty space row
    currentRowIndex += 1;

    // --- 4.5 Fill Customer Info Part 2 (Dynamic placement after total) ---
    // Customer Info 2 Headers
    const ciHeaders = ['المحافظة', 'موقع المدرسة', 'موقع البيت', 'الهاتف 1', 'الهاتف 2'];
    worksheet.getRow(currentRowIndex).height = 20;
    ciHeaders.forEach((text, i) => {
      const cell = worksheet.getCell(currentRowIndex, i + 1);
      cell.value = text;
      cell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF000000' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
    });
    currentRowIndex++;

    // Customer Info 2 Values
    const ciValues = [
      order.governorate || '—',
      order.school_location || 'غير متوفر',
      order.home_location || 'غير متوفر',
      order.phone ? String(order.phone) : '',
      order.phone2 ? String(order.phone2) : 'غير متوفر'
    ];
    worksheet.getRow(currentRowIndex).height = 24;
    ciValues.forEach((val, i) => {
      const cell = worksheet.getCell(currentRowIndex, i + 1);
      cell.value = val;
      cell.font = { name: 'Segoe UI', size: 11, color: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      if (i >= 3) cell.numFmt = '@'; // Phone numbers
      cell.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });
    
    // Increment currentRowIndex by 2 (leave a gap before delivery boxes)
    currentRowIndex += 2;

    // --- 5. Delivery / Pickup Highlight Boxes (Dynamic placement after total) ---
    const boxHeaderRow = Math.max(19, currentRowIndex);
    const boxStartRow = boxHeaderRow + 1;
    const boxEndRow = boxHeaderRow + 3;

    // Right Header (Cols 1 & 2 in RTL view): توصيل
    safeMerge(boxHeaderRow, 1, boxHeaderRow, 2);
    const headerDeliveryCell = worksheet.getCell(boxHeaderRow, 1);
    headerDeliveryCell.value = 'توصيل';
    headerDeliveryCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF1E293B' } };
    headerDeliveryCell.alignment = { vertical: 'middle', horizontal: 'center' };
    headerDeliveryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    
    // Apply borders to the merged header cells (both Col 1 and Col 2)
    worksheet.getCell(boxHeaderRow, 1).border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
    worksheet.getCell(boxHeaderRow, 2).border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };

    // Left Header (Cols 4 & 5 in RTL view): استلام من المكتبة
    safeMerge(boxHeaderRow, 4, boxHeaderRow, 5);
    const headerPickupCell = worksheet.getCell(boxHeaderRow, 4);
    headerPickupCell.value = 'استلام من المكتبة';
    headerPickupCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF1E293B' } };
    headerPickupCell.alignment = { vertical: 'middle', horizontal: 'center' };
    headerPickupCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    
    // Apply borders to the merged header cells (both Col 4 and Col 5)
    worksheet.getCell(boxHeaderRow, 4).border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
    worksheet.getCell(boxHeaderRow, 5).border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };

    const styleExistingBox = (
      startRow: number,
      startCol: number,
      endRow: number,
      endCol: number,
      isSelected: boolean
    ) => {
      safeMerge(startRow, startCol, endRow, endCol);

      const fillColor = isSelected ? 'FFFFF275' : 'FFFFFFFF';
      const borderColor = isSelected ? 'FFE5B800' : 'FFCBD5E1';

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const cell = worksheet.getCell(r, c);
          cell.value = '';
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
          cell.border = {
            top: { style: 'thin', color: { argb: borderColor } },
            bottom: { style: 'thin', color: { argb: borderColor } },
            left: { style: 'thin', color: { argb: borderColor } },
            right: { style: 'thin', color: { argb: borderColor } }
          };
        }
      }

      if (isSelected) {
        const topCell = worksheet.getCell(startRow, startCol);
        topCell.value = '✓';
        topCell.font = { name: 'Segoe UI', size: 24, bold: true, color: { argb: 'FF000000' } };
        topCell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    };

    // Right Box: Cols 1 & 2 (Delivery on RIGHT)
    styleExistingBox(boxStartRow, 1, boxEndRow, 2, isDelivery);

    // Style the Gap: Col 3
    for (let r = boxHeaderRow; r <= boxEndRow; r++) {
      const gapCell = worksheet.getCell(r, 3);
      gapCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      gapCell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    }

    // Left Box: Cols 4 & 5 (Pickup on LEFT)
    styleExistingBox(boxStartRow, 4, boxEndRow, 5, !isDelivery);

    // --- 6. Force Apply Static Styles at the Very End ---
    // This prevents ExcelJS shared style mutation bugs when many items overwrite cells that shared styles with headers in the template
    ['A2', 'B2', 'A6', 'B6', 'C6', 'D6', 'E6', 'A10', 'B10', 'C10', 'D10', 'E10'].forEach(ref => {
      setHeaderStyle(worksheet.getCell(ref));
    });
    ['A3', 'B3', 'A7', 'B7', 'C7', 'D7', 'E7'].forEach(ref => {
      setValueStyle(worksheet.getCell(ref));
    });

    // Generate Excel File buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `طلب_${order.id || 'جديد'}.xlsx`;

    try {
      // Use modern File System Access API if supported (prompts "Save As" dialogue)
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'Excel File',
            accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(buffer);
        await writable.close();
        return;
      }
    } catch (err: any) {
      // If user cancels the prompt, just return without fallback
      if (err.name === 'AbortError') return;
      console.error('SaveFilePicker error:', err);
    }

    // Fallback for browsers that don't support showSaveFilePicker
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error generating excel from template:', error);
  }
};
