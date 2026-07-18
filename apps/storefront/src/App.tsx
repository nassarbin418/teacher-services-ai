import React, { useState } from 'react';
import { BookOpen, User, Truck, CheckCircle, Plus, Trash2, ArrowLeft, Store, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';

// Pricing Data
const SUBJECTS = [
  { id: 'arabic', name: 'عربي', plan: 2, prep: 3 },
  { id: 'religion', name: 'دين', plan: 2, prep: 2.5 },
  { id: 'science', name: 'علوم', plan: 2, prep: 2.5 },
  { id: 'biology', name: 'العلوم الحياتية', plan: 1.5, prep: 2.5 },
  { id: 'chemistry', name: 'الكيمياء', plan: 1.5, prep: 2.5 },
  { id: 'physics', name: 'الفيزياء', plan: 1.5, prep: 2.5 },
  { id: 'earth', name: 'علوم الأرض', plan: 1.5, prep: 2.5 },
  { id: 'math_student', name: 'رياضيات كتاب الطالب', plan: 2, prep: 3 },
  { id: 'math_business', name: 'رياضيات الأعمال', plan: 2, prep: 3 },
  { id: 'english', name: 'انجليزي', plan: 2, prep: 3 },
  { id: 'social', name: 'دراسات اجتماعية', plan: 2, prep: 2.5 },
  { id: 'national', name: 'تربية وطنية', plan: 1, prep: 1.5 },
  { id: 'history', name: 'تاريخ', plan: 1, prep: 1.5 },
  { id: 'geo', name: 'جغرافيا', plan: 1, prep: 1.5 },
  { id: 'digital', name: 'مهارات رقمية', plan: 2, prep: 2.5 },
  { id: 'finance', name: 'ثقافة مالية', plan: 2, prep: 2.5 },
  { id: 'art', name: 'تربية فنية', plan: 2, prep: 2.5 },
  { id: 'vocational', name: 'تربية مهنية', plan: 2, prep: 2.5 },
  { id: 'psych', name: 'علم النفس والاجتماع (ثاني عشر)', plan: 2, prep: 2.5 },
  { id: 'philosophy', name: 'الفلسفة (ثاني عشر)', plan: 2, prep: 2.5 },
];

const GRADES = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر'];

const LOCATIONS: Record<string, string[]> = {
  'عمان': ['قصبة عمان', 'لواء الجامعة', 'لواء القويسمة', 'لواء ماركا', 'لواء سحاب', 'لواء الجيزة', 'لواء الموقر', 'لواء ناعور', 'لواء وادي السير', 'مرج الحمام', 'تلاع العلي', 'خلدا', 'صويلح', 'أبو نصير', 'شفا بدران', 'الجبيهة', 'طبربور', 'المقابلين', 'اليادودة', 'خريبة السوق', 'عبدون', 'الصويفية', 'دير غبار', 'الرابية', 'الشميساني', 'جبل عمان', 'اللويبدة', 'وسط البلد', 'أخرى'],
  'إربد': ['قصبة إربد', 'بني عبيد', 'المزار الشمالي', 'الرمثا', 'بني كنانة', 'الأغوار الشمالية', 'الكورة', 'الطيبة', 'الوسطية', 'الحصن', 'الصريح', 'حوارة', 'بشرى', 'أخرى'],
  'الزرقاء': ['قصبة الزرقاء', 'الرصيفة', 'الهاشمية', 'الضليل', 'الأزرق', 'أخرى'],
  'البلقاء': ['قصبة السلط', 'الشونة الجنوبية', 'دير علا', 'عين الباشا', 'الفحيص', 'ماحص', 'البقعة', 'أخرى'],
  'مادبا': ['قصبة مادبا', 'ذيبان', 'ماعين', 'أخرى'],
  'المفرق': ['قصبة المفرق', 'البادية الشمالية', 'البادية الشمالية الغربية', 'الرويشد', 'بلعما', 'أخرى'],
  'جرش': ['قصبة جرش', 'المعراض', 'برما', 'أخرى'],
  'عجلون': ['قصبة عجلون', 'كفرنجة', 'صخرة', 'أخرى'],
  'الكرك': ['قصبة الكرك', 'القصر', 'المزار الجنوبي', 'الأغوار الجنوبية', 'عي', 'فقوع', 'القطرانة', 'مؤتة', 'أخرى'],
  'الطفيلة': ['قصبة الطفيلة', 'بصيرا', 'الحسا', 'أخرى'],
  'معان': ['قصبة معان', 'البتراء (وادي موسى)', 'الشوبك', 'الحسينية', 'أخرى'],
  'العقبة': ['قصبة العقبة', 'القويرة', 'وادي عربة', 'أخرى'],
};

// Types
interface CustomerInfo {
  name: string;
  phone: string;
  schoolName: string;
  directorate: string;
  governorate: string;
  district: string;
  deliveryType: 'pickup' | 'delivery';
}

interface OrderItem {
  id: string;
  subjectId: string;
  grades: string[];
  serviceType: 'plan' | 'prep' | 'both';
}

interface Teacher {
  id: string;
  name: string;
  items: OrderItem[];
}

function SearchableSelect({ options, value, onChange, placeholder, disabled }: { options: string[], value: string, onChange: (val: string) => void, placeholder: string, disabled?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(o => o.includes(search));

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          border: '1px solid var(--border)',
          padding: '0.75rem',
          borderRadius: '8px',
          background: disabled ? '#f3f4f6' : 'rgba(255,255,255,0.8)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '45px'
        }}
      >
        <span style={{ color: value ? 'inherit' : '#9ca3af' }}>{value || placeholder}</span>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', fontSize: '0.8rem', color: '#6b7280' }}>▼</span>
      </div>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          marginTop: '4px',
          maxHeight: '250px',
          overflowY: 'auto',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ padding: '0.5rem', position: 'sticky', top: 0, background: 'white', borderBottom: '1px solid #f1f5f9' }}>
            <input 
              autoFocus
              type="text" 
              placeholder="بحث..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', outline: 'none' }}
              onClick={e => e.stopPropagation()}
            />
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '0.75rem', color: 'var(--text-light)', textAlign: 'center' }}>لا يوجد نتائج</div>
          ) : (
            filtered.map(opt => (
              <div 
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearch('');
                }}
                style={{
                  padding: '0.75rem',
                  cursor: 'pointer',
                  background: value === opt ? 'rgba(30, 58, 138, 0.1)' : 'transparent',
                  borderBottom: '1px solid #f1f5f9',
                  color: 'black'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = value === opt ? 'rgba(30, 58, 138, 0.1)' : 'transparent'}
              >
                {opt}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function MultiSelect({ options, selected, onChange, placeholder, hasError }: { options: string[], selected: string[], onChange: (val: string[]) => void, placeholder: string, hasError?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          border: hasError ? '2px dashed #ef4444' : '1px solid var(--border)',
          padding: '0.75rem',
          borderRadius: '8px',
          background: hasError ? '#fef2f2' : 'rgba(255,255,255,0.8)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '45px'
        }}
      >
        <span style={{ color: selected.length ? 'inherit' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
          {selected.length > 0 ? selected.join('، ') : placeholder}
        </span>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', fontSize: '0.8rem', color: '#6b7280' }}>▼</span>
      </div>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          marginTop: '4px',
          maxHeight: '250px',
          overflowY: 'auto',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          {options.map(opt => (
            <label 
              key={opt}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem',
                cursor: 'pointer',
                borderBottom: '1px solid #f1f5f9',
                color: 'black',
                gap: '0.5rem',
                margin: 0
              }}
              onClick={e => e.stopPropagation()}
            >
              <input 
                type="checkbox" 
                checked={selected.includes(opt)} 
                onChange={() => toggleOption(opt)} 
                style={{ width: '16px', height: '16px' }}
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const [step, setStep] = useState(1);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    schoolName: '',
    directorate: '',
    governorate: '',
    district: '',
    deliveryType: 'pickup'
  });

  const [teachers, setTeachers] = useState<Teacher[]>([
    { id: 't1', name: '', items: [] }
  ]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form handling
  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'governorate') {
        updated.district = ''; // Reset district when governorate changes
      }
      return updated;
    });
  };

  const addTeacher = () => {
    const newId = `t${Date.now()}`;
    setTeachers([...teachers, { id: newId, name: '', items: [] }]);
  };

  const removeTeacher = (id: string) => {
    if (teachers.length === 1) return; // Keep at least one
    setTeachers(teachers.filter(t => t.id !== id));
  };

  const updateTeacherName = (id: string, name: string) => {
    setTeachers(teachers.map(t => t.id === id ? { ...t, name } : t));
  };

  const toggleSubjectForTeacher = (teacherId: string, subjectId: string) => {
    setTeachers(teachers.map(t => {
      if (t.id !== teacherId) return t;
      const existing = t.items.find(i => i.subjectId === subjectId);
      if (existing) {
        setExpandedItems(prev => prev.filter(id => id !== existing.id));
        return { ...t, items: t.items.filter(i => i.id !== existing.id) };
      } else {
        const newItem: OrderItem = {
          id: `i${Date.now()}_${subjectId}`,
          subjectId,
          grades: [],
          serviceType: 'both'
        };
        setExpandedItems(prev => [...prev, newItem.id]);
        return { ...t, items: [...t.items, newItem] };
      }
    }));
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => prev.includes(itemId) ? prev.filter(i => i !== itemId) : [...prev, itemId]);
  };

  const updateItem = (teacherId: string, itemId: string, field: keyof OrderItem, value: string) => {
    setTeachers(teachers.map(t => {
      if (t.id !== teacherId) return t;
      return {
        ...t,
        items: t.items.map(i => i.id === itemId ? { ...i, [field]: value } : i)
      };
    }));
  };

  // Calculations
  const calculateItemPrice = (item: OrderItem) => {
    const subject = SUBJECTS.find(s => s.id === item.subjectId);
    if (!subject) return 0;
    let basePrice = 0;
    if (item.serviceType === 'plan') basePrice = subject.plan;
    else if (item.serviceType === 'prep') basePrice = subject.prep;
    else basePrice = subject.plan + subject.prep; // both
    
    return basePrice * item.grades.length;
  };

  const calculateTotal = () => {
    return teachers.reduce((acc, teacher) => {
      const teacherTotal = teacher.items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
      return acc + teacherTotal;
    }, 0);
  };

  // Validations
  const getMissingFieldsMessage = () => {
    const missing = [];
    if (!customerInfo.name) missing.push('الاسم الكامل');
    
    if (!customerInfo.phone) {
      missing.push('رقم الهاتف');
    } else if (!/^07[789]\d{7}$/.test(customerInfo.phone)) {
      missing.push('رقم هاتف أردني صحيح');
    }
    
    if (!customerInfo.governorate || !Object.keys(LOCATIONS).includes(customerInfo.governorate)) missing.push('المحافظة');
    if (!customerInfo.district || !(LOCATIONS[customerInfo.governorate] || []).includes(customerInfo.district)) missing.push('اللواء / المنطقة');
    if (!customerInfo.directorate) missing.push('مديرية التربية');
    if (!customerInfo.schoolName) missing.push('اسم المدرسة');
    
    if (missing.length === 0) return null;
    return missing;
  };

  const isCustomerInfoValid = () => {
    const isPhoneValid = /^07[789]\d{7}$/.test(customerInfo.phone);
    const isGovValid = Object.keys(LOCATIONS).includes(customerInfo.governorate);
    const isDistValid = isGovValid && LOCATIONS[customerInfo.governorate].includes(customerInfo.district);

    return customerInfo.name && 
           isPhoneValid && 
           customerInfo.schoolName && 
           customerInfo.directorate && 
           isGovValid && 
           isDistValid;
  };

  const submitOrder = async () => {
    setIsSubmitting(true);
    try {
      const orderTotal = calculateTotal() + (customerInfo.deliveryType === 'delivery' ? 2 : 0);
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: customerInfo.name,
          school_name: customerInfo.schoolName,
          directorate: customerInfo.directorate,
          governorate: customerInfo.governorate,
          district: customerInfo.district,
          phone: customerInfo.phone,
          delivery_type: customerInfo.deliveryType === 'delivery' ? 1 : 0,
          delivery_cost: customerInfo.deliveryType === 'delivery' ? 2 : 0,
          total_amount: orderTotal,
          status: 0
        }])
        .select()
        .single();

      if (orderError) throw orderError;
      
      const orderItemsToInsert: any[] = [];
      teachers.forEach(teacher => {
        teacher.items.forEach(item => {
          const subject = SUBJECTS.find(s => s.id === item.subjectId);
          if (!subject) return;
          
          item.grades.forEach(grade => {
            if (item.serviceType === 'plan' || item.serviceType === 'both') {
              orderItemsToInsert.push({
                order_id: orderData.id,
                teacher_name: teacher.name,
                subject: subject.name,
                grade: grade,
                service_type: 0,
                price: subject.plan,
                quantity: 1
              });
            }
            if (item.serviceType === 'prep' || item.serviceType === 'both') {
              orderItemsToInsert.push({
                order_id: orderData.id,
                teacher_name: teacher.name,
                subject: subject.name,
                grade: grade,
                service_type: 1,
                price: subject.prep,
                quantity: 1
              });
            }
          });
        });
      });

      if (orderItemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsToInsert);
        if (itemsError) throw itemsError;
      }

      alert('تم تأكيد الطلب وحفظه بنجاح!');
      // Reset form
      setCustomerInfo({ name: '', phone: '', schoolName: '', directorate: '', governorate: '', district: '', deliveryType: 'pickup' });
      setTeachers([{ id: 't1', name: '', items: [] }]);
      setExpandedItems([]);
      setStep(1);
    } catch (err: any) {
      console.error('Error submitting order:', err);
      alert('حدث خطأ أثناء حفظ الطلب: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header" style={{ marginBottom: '1rem' }}>
        <div className="header-logo">
          <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="مكتبة نصار لخدمات المعلمين" />
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ color: step >= 1 ? 'var(--primary)' : 'var(--text-light)', fontWeight: 'bold' }}>1. المعلومات</div>
        <ArrowLeft size={16} style={{ color: 'var(--border)' }} />
        <div style={{ color: step >= 2 ? 'var(--primary)' : 'var(--text-light)', fontWeight: 'bold' }}>2. الطلبات</div>
        <ArrowLeft size={16} style={{ color: 'var(--border)' }} />
        <div style={{ color: step >= 3 ? 'var(--primary)' : 'var(--text-light)', fontWeight: 'bold' }}>3. التأكيد</div>
      </div>

      {/* STEP 1: Customer Info */}
      {step === 1 && (
        <section className="glass-card fade-in">
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={24} /> معلومات صاحب الطلب
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">الاسم الكامل <span style={{color: '#ef4444'}}>*</span></label>
              <input type="text" className="form-input" name="name" value={customerInfo.name} onChange={handleCustomerChange} placeholder="اسم المعلم أو صاحب الطلب" required />
            </div>

            <div className="form-group">
              <label className="form-label">رقم الهاتف <span style={{color: '#ef4444'}}>*</span></label>
              <input 
                type="tel" 
                className="form-input" 
                name="phone" 
                value={customerInfo.phone} 
                onChange={handleCustomerChange} 
                placeholder="079XXXXXXX" 
                maxLength={10}
                required 
                style={{ 
                  borderColor: customerInfo.phone && !/^07[789]\d{7}$/.test(customerInfo.phone) ? '#ef4444' : undefined 
                }} 
              />
              {customerInfo.phone && !/^07[789]\d{7}$/.test(customerInfo.phone) && (
                <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>يرجى إدخال رقم أردني صحيح يتكون من 10 أرقام (مثال: 0791234567)</span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">المحافظة <span style={{color: '#ef4444'}}>*</span></label>
                <SearchableSelect 
                  options={Object.keys(LOCATIONS)}
                  value={customerInfo.governorate}
                  onChange={(val) => handleCustomerChange({ target: { name: 'governorate', value: val } } as any)}
                  placeholder="اختر المحافظة..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">اللواء / المنطقة <span style={{color: '#ef4444'}}>*</span></label>
                <SearchableSelect 
                  options={customerInfo.governorate ? LOCATIONS[customerInfo.governorate] : []}
                  value={customerInfo.district}
                  onChange={(val) => handleCustomerChange({ target: { name: 'district', value: val } } as any)}
                  placeholder="اختر اللواء..."
                  disabled={!customerInfo.governorate}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">مديرية التربية <span style={{color: '#ef4444'}}>*</span></label>
                <input type="text" className="form-input" name="directorate" value={customerInfo.directorate} onChange={handleCustomerChange} placeholder="الجامعة، ناعور..." required />
              </div>
              <div className="form-group">
                <label className="form-label">اسم المدرسة <span style={{color: '#ef4444'}}>*</span></label>
                <input type="text" className="form-input" name="schoolName" value={customerInfo.schoolName} onChange={handleCustomerChange} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">طريقة الاستلام <span style={{color: '#ef4444'}}>*</span></label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(255,255,255,0.8)', padding: '1rem', borderRadius: '8px', flex: 1, border: customerInfo.deliveryType === 'pickup' ? '2px solid var(--primary)' : '2px solid transparent' }}>
                  <input type="radio" name="deliveryType" value="pickup" checked={customerInfo.deliveryType === 'pickup'} onChange={handleCustomerChange} style={{ display: 'none' }} />
                  <Store size={20} color="var(--primary)" />
                  <span>استلام من المكتبة</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(255,255,255,0.8)', padding: '1rem', borderRadius: '8px', flex: 1, border: customerInfo.deliveryType === 'delivery' ? '2px solid var(--primary)' : '2px solid transparent' }}>
                  <input type="radio" name="deliveryType" value="delivery" checked={customerInfo.deliveryType === 'delivery'} onChange={handleCustomerChange} style={{ display: 'none' }} />
                  <Truck size={20} color="var(--primary)" />
                  <span>توصيل</span>
                </label>
              </div>
            </div>
          </div>

          {getMissingFieldsMessage() && (
            <div style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '2rem', background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>الرجاء إكمال/تصحيح الحقول التالية للمتابعة:</strong>
              <ul style={{ margin: 0, paddingRight: '1.5rem' }}>
                {getMissingFieldsMessage()!.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          <button 
            className="btn-primary" 
            onClick={() => setStep(2)} 
            disabled={!isCustomerInfoValid()}
            style={{ opacity: isCustomerInfoValid() ? 1 : 0.5, marginTop: '2rem' }}
          >
            التالي: اختيار المواد والمعلمين
          </button>
        </section>
      )}

      {/* STEP 2: Teachers & Subjects */}
      {step === 2 && (
        <section className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={24} /> المعلمين والمواد
            </h2>
            <button onClick={addTeacher} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              <Plus size={18} /> إضافة معلم آخر
            </button>
          </div>

          {teachers.map((teacher) => (
            <div key={teacher.id} className="glass-card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '1rem' }}>
                <div style={{ width: '70%', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '1.1rem', color: 'var(--primary)' }}>اسم المعلم:</label>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={teacher.name} 
                      onChange={(e) => updateTeacherName(teacher.id, e.target.value)} 
                      style={{ fontSize: '1.1rem', fontWeight: 'bold', background: 'transparent', border: !teacher.name.trim() ? '2px dashed #ef4444' : '1px dashed rgba(0,0,0,0.2)' }}
                      placeholder="أدخل اسم المعلم..."
                      required
                    />
                    {!teacher.name.trim() && <div style={{ color: '#ef4444', fontSize: '0.8rem', position: 'absolute', top: '100%', marginTop: '4px', fontWeight: 'bold' }}>الرجاء إدخال اسم المعلم</div>}
                  </div>
                </div>
                {teachers.length > 1 && (
                  <button onClick={() => removeTeacher(teacher.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text)', marginBottom: '0.5rem' }}>المواد المضافة:</h3>
                
                {/* Dropdown to add a new subject */}
                <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                  <h4 style={{ marginBottom: '0.8rem', fontSize: '1rem', color: 'var(--primary)' }}>+ إضافة مادة جديدة لهذا المعلم</h4>
                  <SearchableSelect 
                    options={SUBJECTS.filter(s => !teacher.items.find(i => i.subjectId === s.id)).map(s => s.name)}
                    value=""
                    onChange={(subjectName) => {
                      const s = SUBJECTS.find(sub => sub.name === subjectName);
                      if (s) toggleSubjectForTeacher(teacher.id, s.id);
                    }}
                    placeholder="ابحث عن مادة لإضافتها..."
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {teacher.items.length === 0 && (
                    <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'var(--text-light)', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)' }}>
                      لم تقم بإضافة أي مواد. ابحث في القائمة أعلاه للإضافة.
                    </div>
                  )}
                  {teacher.items.map(item => {
                    const subject = SUBJECTS.find(s => s.id === item.subjectId);
                    if (!subject) return null;
                    const isExpanded = expandedItems.includes(item.id);

                    return (
                      <div key={item.id} style={{ background: 'white', border: item.grades.length === 0 ? '2px solid #ef4444' : (isExpanded ? '2px solid var(--primary)' : '1px solid var(--border)'), borderRadius: '12px', overflow: 'hidden', boxShadow: item.grades.length === 0 ? '0 4px 15px -3px rgba(239,68,68,0.3)' : '0 4px 6px -1px rgba(0,0,0,0.05)', transition: '0.2s' }}>
                        {/* Accordion Header */}
                        <div 
                          onClick={() => toggleExpanded(item.id)}
                          style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? 'rgba(30, 58, 138, 0.03)' : 'transparent' }}
                        >
                          <div>
                            <h4 style={{ color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s', fontSize: '0.8rem' }}>▼</span>
                              {subject.name}
                            </h4>
                            {!isExpanded && (
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.3rem', marginRight: '1.5rem' }}>
                                الصفوف: {item.grades.length > 0 ? item.grades.join('، ') : 'لم يتم التحديد'} | الخدمة: {item.serviceType === 'both' ? 'خطة + تحضير' : item.serviceType === 'plan' ? 'خطة' : 'تحضير'} | السعر: {calculateItemPrice(item)} د.أ
                              </div>
                            )}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); toggleSubjectForTeacher(teacher.id, subject.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.4rem', borderRadius: '8px' }} title="إزالة المادة">
                            <Trash2 size={18} />
                          </button>
                        </div>
                        
                        {/* Accordion Body */}
                        {isExpanded && (
                          <div style={{ padding: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                            <div style={{ marginBottom: '1rem' }}>
                              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 'bold', color: 'var(--text)' }}>الصفوف المطلوبة: <span style={{color: '#ef4444'}}>*</span></label>
                              <MultiSelect 
                                options={GRADES}
                                selected={item.grades}
                                onChange={val => updateItem(teacher.id, item.id, 'grades', val as any)}
                                placeholder="اختر الصفوف..."
                              />
                              {item.grades.length === 0 && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px', fontWeight: 'bold' }}>يرجى اختيار صف واحد على الأقل للمادة</div>}
                            </div>
                            
                            <div style={{ marginBottom: '0.8rem' }}>
                               <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 'bold', color: 'var(--text)' }}>الخدمة المطلوبة للصف الواحد:</label>
                               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', cursor: 'pointer' }}>
                                    <input type="radio" name={`service-${teacher.id}-${item.id}`} value="both" checked={item.serviceType === 'both'} onChange={() => updateItem(teacher.id, item.id, 'serviceType', 'both')} />
                                    خطة + تحضير ({subject.plan + subject.prep} د.أ)
                                  </label>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', cursor: 'pointer' }}>
                                    <input type="radio" name={`service-${teacher.id}-${item.id}`} value="plan" checked={item.serviceType === 'plan'} onChange={() => updateItem(teacher.id, item.id, 'serviceType', 'plan')} />
                                    خطة فقط ({subject.plan} د.أ)
                                  </label>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', cursor: 'pointer' }}>
                                    <input type="radio" name={`service-${teacher.id}-${item.id}`} value="prep" checked={item.serviceType === 'prep'} onChange={() => updateItem(teacher.id, item.id, 'serviceType', 'prep')} />
                                    تحضير فقط ({subject.prep} د.أ)
                                  </label>
                               </div>
                            </div>
                            <div style={{ background: 'rgba(30, 58, 138, 0.03)', padding: '0.75rem 1rem', borderRadius: '8px', marginTop: '1.2rem', fontWeight: 'bold', color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', border: '1px solid rgba(30, 58, 138, 0.1)' }}>
                              <span>المجموع لهذه المادة:</span>
                              <span>{calculateItemPrice(item)} د.أ</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: '2rem' }}>
            {(!teachers.every(t => t.name.trim() !== '') || !teachers.some(t => t.items.length > 0) || !teachers.every(t => t.items.every(i => i.grades.length > 0))) && (
              <div style={{ color: '#ef4444', background: '#fef2f2', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '1rem', fontWeight: 'bold', textAlign: 'center', fontSize: '0.95rem' }}>
                يرجى إدخال أسماء جميع المعلمين، وإضافة مادة واحدة على الأقل، والتأكد من اختيار صف واحد على الأقل لكل مادة.
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" onClick={() => setStep(1)} style={{ background: 'var(--text-light)', flex: 0.5, marginTop: 0 }}>رجوع</button>
              <button 
                className="btn-primary" 
                onClick={() => setStep(3)} 
                disabled={!teachers.every(t => t.name.trim() !== '') || !teachers.some(t => t.items.length > 0) || !teachers.every(t => t.items.every(i => i.grades.length > 0))}
                style={{ opacity: (teachers.every(t => t.name.trim() !== '') && teachers.some(t => t.items.length > 0) && teachers.every(t => t.items.every(i => i.grades.length > 0))) ? 1 : 0.5, flex: 1, marginTop: 0 }}
              >
                مراجعة الطلب والتأكيد
              </button>
            </div>
          </div>
        </section>
      )}

      {/* STEP 3: Review & Confirm */}
      {step === 3 && (
        <section className="glass-card fade-in">
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid rgba(30, 58, 138, 0.1)', paddingBottom: '1rem' }}>
            <CheckCircle size={24} /> تأكيد الطلب
          </h2>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-light)' }}>معلومات العميل</h3>
            <div style={{ background: 'rgba(255,255,255,0.8)', padding: '1rem', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div><strong>الاسم:</strong> {customerInfo.name}</div>
              <div><strong>الهاتف:</strong> {customerInfo.phone}</div>
              <div><strong>المدرسة:</strong> {customerInfo.schoolName}</div>
              <div><strong>المديرية:</strong> {customerInfo.directorate}</div>
              <div><strong>العنوان:</strong> {customerInfo.governorate} - {customerInfo.district}</div>
              <div><strong>الاستلام:</strong> {customerInfo.deliveryType === 'delivery' ? 'توصيل' : 'استلام من المكتبة'}</div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-light)' }}>تفاصيل الطلب</h3>
            {teachers.map(teacher => {
              if (teacher.items.length === 0) return null;
              return (
                <div key={teacher.id} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '8px', marginBottom: '1rem', overflow: 'hidden' }}>
                  <div style={{ background: 'rgba(30, 58, 138, 0.05)', padding: '0.8rem 1rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    اسم المعلم: {teacher.name}
                  </div>
                  <div style={{ padding: '0.5rem 1rem' }}>
                    {teacher.items.map((item, idx) => {
                      const subject = SUBJECTS.find(s => s.id === item.subjectId);
                      const sType = item.serviceType === 'plan' ? 'خطة' : item.serviceType === 'prep' ? 'تحضير' : 'خطة + تحضير';
                      return (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: idx < teacher.items.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                          <div>{subject?.name} - {item.grades.length > 0 ? item.grades.join('، ') : 'لم يتم اختيار صف'} <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', marginRight: '0.5rem' }}>{sType}</span></div>
                          <div style={{ fontWeight: 'bold' }}>{calculateItemPrice(item)} د.أ</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="summary-box">
            <div className="summary-row">
              <span>المجموع الفرعي:</span>
              <span>{calculateTotal()} د.أ</span>
            </div>
            {customerInfo.deliveryType === 'delivery' && (
              <div className="summary-row">
                <span>رسوم التوصيل:</span>
                <span>2 د.أ</span>
              </div>
            )}
            <div className="summary-row total">
              <span>المجموع الإجمالي:</span>
              <span>{calculateTotal() + (customerInfo.deliveryType === 'delivery' ? 2 : 0)} د.أ</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button className="btn-primary" onClick={() => setStep(2)} style={{ background: 'var(--text-light)', flex: 0.5 }} disabled={isSubmitting}>تعديل الطلبات</button>
            <button className="btn-primary" onClick={submitOrder} disabled={isSubmitting} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={20} />}
              {isSubmitting ? 'جاري إرسال الطلب...' : 'إرسال الطلب النهائي'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
