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

// خريطة المواد والصفوف (الصف: المادة -> الخلية)
// يجب تعبئة هذه الخريطة بناءً على أماكن الخلايا في ملف الإكسل الخاص بك
const GRID_MAP: Record<string, Record<string, string>> = {
  'الأول': { 'عربي': 'L5', 'دين': 'J5', 'علوم': 'H5', 'رياضيات': 'F5', 'E': 'D5', 'اجتماعيات': 'C5' },
  'الثاني': { 'عربي': 'L6', 'دين': 'J6', 'علوم': 'H6', 'رياضيات': 'F6', 'E': 'D6', 'اجتماعيات': 'C6' },
  'الثالث': { 'عربي': 'L7', 'دين': 'J7', 'علوم': 'H7', 'رياضيات': 'F7', 'E': 'D7', 'اجتماعيات': 'C7' },
  // ... يمكنك إكمال باقي الصفوف بنفس الطريقة
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
      const worksheet = workbook.worksheets[0]; // افتراض أن الجدول في الورقة الأولى

      // 2. تعبئة البيانات الأساسية
      if (worksheet.getCell(CELL_MAP.teacherName)) worksheet.getCell(CELL_MAP.teacherName).value = teacherName;
      if (worksheet.getCell(CELL_MAP.schoolName)) worksheet.getCell(CELL_MAP.schoolName).value = order.school_name;
      if (worksheet.getCell(CELL_MAP.directorate)) worksheet.getCell(CELL_MAP.directorate).value = order.directorate;
      if (worksheet.getCell(CELL_MAP.phone)) worksheet.getCell(CELL_MAP.phone).value = order.phone;
      
      const today = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
      if (worksheet.getCell(CELL_MAP.date)) worksheet.getCell(CELL_MAP.date).value = today;

      // 3. تظليل الخلايا المطلوبة باللون الأصفر
      const teacherItems: any[] = items as any[];
      teacherItems.forEach((item) => {
        // البحث عن الخلية بناءً على الصف والمادة
        const gradeMap = GRID_MAP[item.grade];
        if (gradeMap) {
          const cellAddress = gradeMap[item.subject];
          if (cellAddress) {
            const cell = worksheet.getCell(cellAddress);
            // تلوين الخلية بالأصفر
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFF00' } // لون أصفر
            };
          }
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
    }
    
    return true;
  } catch (error: any) {
    console.error('Error exporting excel:', error);
    alert(`حدث خطأ أثناء إنشاء ملف الإكسل: ${error.message || error}`);
    return false;
  }
};
