import ExcelJS from 'exceljs';

export const exportOrderToExcel = async (order: any, itemsParam?: any[]) => {
  try {
    const workbook = new ExcelJS.Workbook();
    // Enable RTL view for Arabic
    const worksheet = workbook.addWorksheet('تفاصيل الطلب', {
      views: [{ rightToLeft: true }]
    });

    // Formatting defaults
    worksheet.properties.defaultColWidth = 25;
    worksheet.properties.defaultRowHeight = 24;

    // Columns width adjustments for wide spacious layout
    worksheet.getColumn(1).width = 30; // Column 1: الاسم / نوع التعليم / اسم المعلم
    worksheet.getColumn(2).width = 25; // Column 2: الهاتف 1 / المحافظة / المادة
    worksheet.getColumn(3).width = 32; // Column 3: هاتف 2 (الرقم البديل) / اللواء / الصف
    worksheet.getColumn(4).width = 42; // Column 4: المدرسة / موقع المدرسة / نوع الخدمة
    worksheet.getColumn(5).width = 35; // Column 5: نوع المدرسة / موقع البيت / السعر
    
    // Function to set header styles
    const setHeaderStyle = (cell: any) => {
      cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    };

    const setDataStyle = (cell: any) => {
      cell.font = { name: 'Arial', size: 11, color: { argb: 'FF334155' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    };

    const setSectionTitle = (cell: any, title: string) => {
      const rowIndex = cell.row;
      worksheet.mergeCells(rowIndex, 1, rowIndex, 5);
      
      const titleCell = worksheet.getCell(rowIndex, 1);
      titleCell.value = `  📌  ${title}`;
      titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF1E3A8A' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'right' };
      
      const lightBgColor = 'FFE0E7FF'; // Soft light pastel indigo background
      const borderColor = 'FFC7D2FE';  // Soft indigo border
      
      for (let c = 1; c <= 5; c++) {
        const cCell = worksheet.getCell(rowIndex, c);
        cCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: lightBgColor }
        };
        cCell.border = {
          top: { style: 'thin', color: { argb: borderColor } },
          bottom: { style: 'thin', color: { argb: borderColor } },
          left: { style: 'thin', color: { argb: borderColor } },
          right: { style: 'thin', color: { argb: borderColor } }
        };
      }
    };

    const applyMergedBoxStyle = (
      startRow: number,
      startCol: number,
      endRow: number,
      endCol: number,
      isSelected: boolean
    ) => {
      worksheet.mergeCells(startRow, startCol, endRow, endCol);
      const fillColor = isSelected ? 'FFFEF08A' : 'FFF8FAFC'; // Soft light pastel yellow if selected, light slate if unselected
      const borderColor = isSelected ? 'FFEAB308' : 'FFCBD5E1'; // Soft amber vs light slate border

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const cell = worksheet.getCell(r, c);
          cell.value = ''; // Empty inside the box as requested
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: fillColor }
          };
          cell.border = {
            top: { style: 'medium', color: { argb: borderColor } },
            bottom: { style: 'medium', color: { argb: borderColor } },
            left: { style: 'medium', color: { argb: borderColor } },
            right: { style: 'medium', color: { argb: borderColor } }
          };
        }
      }
    };

    // --- 1. Order Info Section (معلومات الطلب) ---
    const orderTitleRow = worksheet.addRow([]);
    setSectionTitle(orderTitleRow.getCell(1), 'معلومات الطلب');
    worksheet.addRow([]);

    const orderHeaders = worksheet.addRow(['رقم الطلب', 'تاريخ الطلب', '', '', '']);
    setHeaderStyle(orderHeaders.getCell(1));
    setHeaderStyle(orderHeaders.getCell(2));

    const formattedCreatedAt = order.created_at
      ? new Date(order.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
      : '—';

    const orderValues = worksheet.addRow([
      `#${order.id || ''}`,
      formattedCreatedAt,
      '', '', ''
    ]);
    setDataStyle(orderValues.getCell(1));
    setDataStyle(orderValues.getCell(2));

    worksheet.addRow([]);
    worksheet.addRow([]);

    // --- 2. Customer Info Section (معلومات العميل) ---
    const custTitleRow = worksheet.addRow([]);
    setSectionTitle(custTitleRow.getCell(1), 'معلومات العميل');
    worksheet.addRow([]);

    // Headers Row 1
    const infoHeaders1 = worksheet.addRow(['الاسم', 'الهاتف 1', 'الهاتف 2 (الرقم البديل)', 'المدرسة', 'نوع المدرسة']);
    infoHeaders1.eachCell(setHeaderStyle);
    
    // Values Row 1
    const infoValues1 = worksheet.addRow([
      order.customer_name || '',
      order.phone || '',
      order.phone2 || 'غير متوفر',
      order.school_name || '',
      order.school_type || '—'
    ]);
    infoValues1.eachCell(setDataStyle);

    worksheet.addRow([]);

    // Headers Row 2
    const infoHeaders2 = worksheet.addRow(['نوع التعليم', 'المحافظة', 'اللواء / المنطقة', 'موقع المدرسة', 'موقع البيت']);
    infoHeaders2.eachCell(setHeaderStyle);
    
    // Values Row 2
    const infoValues2 = worksheet.addRow([
      order.directorate || '—',
      order.governorate || '—',
      order.district || '—',
      order.school_location || 'غير متوفر',
      order.home_location || 'غير متوفر'
    ]);
    infoValues2.eachCell(setDataStyle);

    worksheet.addRow([]);
    worksheet.addRow([]);

    // --- 3. Teachers and Subjects Section (تفاصيل المعلمين والمواد) ---
    const itemsTitleRow = worksheet.addRow([]);
    setSectionTitle(itemsTitleRow.getCell(1), 'تفاصيل المعلمين والمواد');
    worksheet.addRow([]);

    // Items Headers
    const itemsHeaders = worksheet.addRow(['اسم المعلم', 'المادة', 'الصف', 'نوع الخدمة', 'السعر']);
    itemsHeaders.eachCell(setHeaderStyle);

    const serviceTypeName = (type: number | string) => {
      if (type === 0 || type === '0') return 'خطة فصلية';
      if (type === 1 || type === '1') return 'تحضير يومي';
      if (type === 2 || type === '2') return 'بكج كامل (خطة وتحضير وتحليل)';
      return String(type || 'غير محدد');
    };

    // Add Items
    const items = itemsParam || order.order_items || order.items || [];
    if (items && items.length > 0) {
      items.forEach((item: any) => {
        const itemRow = worksheet.addRow([
          item.teacher_name || '',
          item.subject || '',
          item.grade || '',
          serviceTypeName(item.service_type),
          `${item.price || 0} د.أ`
        ]);
        itemRow.eachCell(setDataStyle);
      });
    } else {
      const emptyRow = worksheet.addRow(['لا توجد مواد']);
      worksheet.mergeCells(emptyRow.number, 1, emptyRow.number, 5);
      emptyRow.getCell(1).alignment = { horizontal: 'center' };
      setDataStyle(emptyRow.getCell(1));
    }
    
    // Add Delivery Cost Row if Delivery
    const isDelivery = String(order.delivery_type) === '1' || Number(order.delivery_cost) > 0;
    const deliveryCostVal = Number(order.delivery_cost) || (isDelivery ? 3 : 0);

    if (isDelivery || deliveryCostVal > 0) {
      const deliveryRow = worksheet.addRow(['', '', '', 'أجور التوصيل:', `${deliveryCostVal} د.أ`]);
      deliveryRow.getCell(4).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1F2937' } };
      deliveryRow.getCell(4).alignment = { horizontal: 'left' };
      deliveryRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      deliveryRow.getCell(5).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1F2937' } };
      deliveryRow.getCell(5).alignment = { horizontal: 'center' };
      deliveryRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      deliveryRow.getCell(4).border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
      deliveryRow.getCell(5).border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    }
    
    // Add Total Row
    const totalRow = worksheet.addRow(['', '', '', 'الإجمالي:', `${order.total_amount || 0} د.أ`]);
    totalRow.getCell(4).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E293B' } };
    totalRow.getCell(4).alignment = { horizontal: 'left' };
    totalRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    totalRow.getCell(5).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF059669' } };
    totalRow.getCell(5).alignment = { horizontal: 'center' };
    totalRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    totalRow.getCell(4).border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };
    totalRow.getCell(5).border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };

    // --- 4. Delivery Option Highlight Boxes (في أسفل الجدول) ---
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Header Row above boxes (توصيل يمين ، استلام من المكتبة شمال)
    const deliveryHeadersRow = worksheet.addRow(['توصيل', '', '', 'استلام من المكتبة', '']);
    worksheet.mergeCells(deliveryHeadersRow.number, 1, deliveryHeadersRow.number, 2);
    worksheet.mergeCells(deliveryHeadersRow.number, 4, deliveryHeadersRow.number, 5);

    const setBoxTitleStyle = (startCol: number, endCol: number, cell: any) => {
      cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      for (let c = startCol; c <= endCol; c++) {
        const headerCell = worksheet.getCell(deliveryHeadersRow.number, c);
        headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        headerCell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
      }
    };
    setBoxTitleStyle(1, 2, deliveryHeadersRow.getCell(1));
    setBoxTitleStyle(4, 5, deliveryHeadersRow.getCell(4));

    // Large Box Rows below header (spanning 3 rows and 2 columns each)
    const boxRow1 = worksheet.addRow(['', '', '', '', '']);
    worksheet.addRow(['', '', '', '', '']);
    const boxRow3 = worksheet.addRow(['', '', '', '', '']);

    const startR = boxRow1.number;
    const endR = boxRow3.number;

    // Right Box: توصيل (Columns 1 & 2)
    applyMergedBoxStyle(startR, 1, endR, 2, isDelivery);

    // Left Box: استلام من المكتبة (Columns 4 & 5)
    applyMergedBoxStyle(startR, 4, endR, 5, !isDelivery);

    // Generate Excel File buffer and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Trigger download in browser
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `طلب_${order.id || 'جديد'}.xlsx`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

  } catch (error) {
    console.error('Error generating Excel file:', error);
    alert('حدث خطأ أثناء تصدير ملف الإكسل');
  }
};
