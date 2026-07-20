import ExcelJS from 'exceljs';
import templateUrl from '../../../../packages/shared/excel/template.xlsx?url';

// --- إعدادات خلايا الإكسل ---
// قم بتغيير أسماء الخلايا (A1, B2) بناءً على ملفك الحقيقي
const CELL_MAP = {
  teacherName: 'K36', // الخلية التي سيكتب فيها اسم المعلم
  schoolName: 'F36',  // اسم المدرسة
  directorate: 'D36', // المديرية
  phone: 'E38',       // رقم الهاتف
  date: 'B3',         // التاريخ
};



export const exportOrderToExcel = async (order: any, orderItems: any[]) => {
  try {
    // 1. تحميل القالب مباشرة عبر استيراد Vite (لا يحتاج لمجلد public)
    const response = await fetch(templateUrl);
    const arrayBuffer = await response.arrayBuffer();

    // -- مؤقت: طباعة خلايا الإكسل في الكونسول لتسهيل تعبئة GRID_MAP --
    try {
      const tempWb = new ExcelJS.Workbook();
      await tempWb.xlsx.load(arrayBuffer);
      const ws = tempWb.worksheets[0];
      const results: any = {};
      ws.eachRow((row) => {
        row.eachCell((cell) => {
          if (cell.text) {
            const val = cell.text.trim();
            if (['عربي', 'دين', 'علوم', 'رياضيات', 'E', 'اجتماعيات', 'اول', 'ثاني', 'ثالث', 'اسم المعلم', 'اسم المدرسة', 'اسم المديرية', 'رقم الهاتف'].some(k => val.includes(k))) {
              results[val] = cell.address;
            }
          }
        });
      });
      console.log('--- أرقام خلايا الإكسل من القالب ---');
      console.log(JSON.stringify(results, null, 2));
    } catch(e) {
      console.error('Error parsing template for cells', e);
    }
    // ----------------------------------------------------------------

    // تجميع المواد حسب اسم المعلم لإنشاء ملف منفصل لكل معلم
    const itemsByTeacher = orderItems.reduce((acc: any, item: any) => {
      if (!acc[item.teacher_name]) acc[item.teacher_name] = [];
      acc[item.teacher_name].push(item);
      return acc;
    }, {});

    for (const [teacherName, items] of Object.entries(itemsByTeacher)) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      // اختيار آخر ورقة (Tab) في ملف الإكسل
      const worksheet = workbook.worksheets[workbook.worksheets.length - 1];

      // 2. تعبئة البيانات الأساسية
      if (worksheet.getCell(CELL_MAP.teacherName)) worksheet.getCell(CELL_MAP.teacherName).value = teacherName;
      if (worksheet.getCell(CELL_MAP.schoolName)) worksheet.getCell(CELL_MAP.schoolName).value = order.school_name;
      if (worksheet.getCell(CELL_MAP.directorate)) worksheet.getCell(CELL_MAP.directorate).value = order.directorate;
      if (worksheet.getCell(CELL_MAP.phone)) worksheet.getCell(CELL_MAP.phone).value = order.phone;
      
      const today = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
      if (worksheet.getCell(CELL_MAP.date)) worksheet.getCell(CELL_MAP.date).value = today;

      // 3. دالة البحث عن المادة والصف تحتها
      const cleanText = (str: any) => {
        if (!str) return '';
        return str.toString()
          .replace(/[أإآ]/g, 'ا')
          .replace(/ة/g, 'ه')
          .toLowerCase()
          .split(' ')
          .map((w: string) => w.replace(/^ال/, ''))
          .join(' ')
          .trim();
      };

      const fillStyle: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };

      // تحويل اسم العمود (A, B, AA...) إلى رقم
      const colLetterToNumber = (col: string): number => {
        let n = 0;
        for (let i = 0; i < col.length; i++) {
          n = n * 26 + (col.charCodeAt(i) - 64);
        }
        return n;
      };

      // استخراج نطاقات الدمج من موديل الورقة
      const getMergeRanges = (): Array<{ r1: number; c1: number; r2: number; c2: number }> => {
        try {
          const model = (worksheet as any).model;
          const merges: string[] = model?.merges || [];
          return merges.map((m: string) => {
            const match = m.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
            if (!match) return null;
            return {
              c1: colLetterToNumber(match[1]), r1: parseInt(match[2]),
              c2: colLetterToNumber(match[3]), r2: parseInt(match[4])
            };
          }).filter(Boolean) as any[];
        } catch (e) {
          return [];
        }
      };

      const mergeRanges = getMergeRanges();

      // إيجاد الخلية الرئيسية (master) لأي موضع داخل نطاق دمج
      const getMasterCell = (row: number, col: number): { row: number; col: number } | null => {
        for (const range of mergeRanges) {
          if (row >= range.r1 && row <= range.r2 && col >= range.c1 && col <= range.c2) {
            return { row: range.r1, col: range.c1 };
          }
        }
        return null;
      };

      // تطبيق التظليل مع معالجة صحيحة للخلايا المدمجة
      const applyFill = (rowNum: number, colNum: number) => {
        try {
          const master = getMasterCell(rowNum, colNum);
          const targetRow = master ? master.row : rowNum;
          const targetCol = master ? master.col : colNum;
          worksheet.getRow(targetRow).getCell(targetCol).fill = fillStyle;
        } catch (e) {
          // ignore
        }
      };

      const teacherItems: any[] = items as any[];
      teacherItems.forEach((item) => {
        const targetSubject = cleanText(item.subject);
        const targetGrade = cleanText(item.grade);

        let subjectCol = -1;
        let subjectRow = -1;

        // الخطوة 1: البحث عن عمود المادة (بدون eachRow - نستخدم حلقة عادية قابلة للإيقاف)
        const totalRows = worksheet.rowCount;
        outer1:
        for (let r = 1; r <= totalRows; r++) {
          const row = worksheet.getRow(r);
          const totalCols = row.cellCount;
          for (let c = 1; c <= totalCols + 5; c++) {
            try {
              const cell = row.getCell(c);
              const text = cell.text || (cell.value ? cell.value.toString() : '');
              if (text) {
                const cleaned = cleanText(text);
                if (cleaned === targetSubject || cleaned.includes(targetSubject) || targetSubject.includes(cleaned)) {
                  subjectCol = c;
                  subjectRow = r;
                  break outer1;
                }
              }
            } catch (e) {}
          }
        }

        if (subjectCol === -1) {
          console.warn(`لم يتم العثور على المادة: ${item.subject}`);
          return;
        }

        // الخطوة 2: البحث عن صف الدرجة تحت المادة - تطابق تام أولاً
        let foundRowNumber = -1;
        const searchStart = subjectRow + 1;
        const searchEnd = subjectRow + 60;
        const searchColStart = Math.max(1, subjectCol - 3);
        const searchColEnd = subjectCol + 3;

        // محاولة التطابق التام
        outer2:
        for (let r = searchStart; r <= searchEnd; r++) {
          for (let c = searchColStart; c <= searchColEnd; c++) {
            try {
              const cell = worksheet.getRow(r).getCell(c);
              const text = cell.text || (cell.value ? cell.value.toString() : '');
              if (text) {
                const cleaned = cleanText(text);
                if (cleaned === targetGrade || cleaned.replace(/\s+/g, '') === targetGrade.replace(/\s+/g, '')) {
                  foundRowNumber = r;
                  break outer2;
                }
              }
            } catch (e) {}
          }
        }

        // إذا لم يوجد تطابق تام، نجرب التطابق الجزئي
        if (foundRowNumber === -1) {
          outer3:
          for (let r = searchStart; r <= searchEnd; r++) {
            for (let c = searchColStart; c <= searchColEnd; c++) {
              try {
                const cell = worksheet.getRow(r).getCell(c);
                const text = cell.text || (cell.value ? cell.value.toString() : '');
                if (text) {
                  const cleaned = cleanText(text);
                  if (cleaned.includes(targetGrade) || targetGrade.includes(cleaned)) {
                    foundRowNumber = r;
                    break outer3;
                  }
                }
              } catch (e) {}
            }
          }
        }

        if (foundRowNumber === -1) {
          console.warn(`لم يتم العثور على الصف "${item.grade}" تحت المادة "${item.subject}"`);
          return;
        }

        // الخطوة 3: تظليل الصف المطلوب - نطاق أوسع لتغطية الخلايا المدمجة
        const shadeStart = Math.max(1, subjectCol - 3);
        const shadeEnd = subjectCol + 5;

        for (let c = shadeStart; c <= shadeEnd; c++) {
          applyFill(foundRowNumber, c);
        }
      });

      // 4. حفظ وتنزيل الملف
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // إنشاء رابط التنزيل
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `طلب_${order.id}_${teacherName}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // تأخير بسيط لمنع المتصفح من حظر التنزيلات المتعددة
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return true;
  } catch (error: any) {
    console.error('Error exporting excel:', error);
    alert(`حدث خطأ أثناء إنشاء ملف الإكسل: ${error.message || error}`);
    return false;
  }
};
