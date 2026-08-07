-- 1. إضافة عمود completed_at لجدول الطلبات (إذا لم يكن موجوداً)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 2. دالة الـ Trigger لتحديث وقت الاكتمال تلقائياً
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا تغيرت الحالة إلى 3 (مكتمل) وكانت الحالة السابقة مختلفة
  IF NEW.status = 3 AND (OLD.status IS NULL OR OLD.status <> 3) THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. ربط الـ Trigger بجدول الطلبات
DROP TRIGGER IF EXISTS trigger_set_completed_at ON orders;
CREATE TRIGGER trigger_set_completed_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_completed_at();

-- 4. تفعيل pg_cron وإنشاء دالة الحذف
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION delete_old_completed_orders()
RETURNS void AS $$
BEGIN
  -- حذف الطلبات المكتملة والتي مر على وقت اكتمالها 3 أيام
  DELETE FROM orders 
  WHERE status = 3 
  AND completed_at < NOW() - INTERVAL '3 days';
END;
$$ LANGUAGE plpgsql;

-- 5. جدولة عملية التنظيف لتعمل يومياً عند منتصف الليل
SELECT cron.schedule(
  'delete-completed-orders-daily', -- اسم المهمة المجدولة
  '0 0 * * *',                     -- التوقيت: كل يوم الساعة 12 منتصف الليل
  'SELECT delete_old_completed_orders();'
);
