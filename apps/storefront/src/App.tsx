import React, { useState, useEffect } from 'react';
import { BookOpen, User, Truck, CheckCircle, Plus, Trash2, Loader2, SearchIcon, Package, ChevronUp, ChevronDown, ArrowLeft, Store } from 'lucide-react';
import { supabase } from './lib/supabase';

const GRADES = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر (أكاديمي)', 'الثاني عشر (أكاديمي)'];


interface CustomerInfo {
  name: string;
  phone: string;
  phone2: string;
  schoolName: string;
  schoolType: string;
  directorate: string;
  governorate: string;
  district: string;
  otherDistrict: string;
  deliveryType: 'pickup' | 'delivery';
  schoolLocation: string;
  homeLocation: string;
}

interface OrderItem {
  id: string;
  subjectId: string | number;
  grades: string[];
  serviceType: 'plan' | 'prep' | 'both';
}

interface Teacher {
  id: string;
  name: string;
  items: OrderItem[];
}

function SearchableSelect({ options = [], value, onChange, placeholder, disabled = false, nullOption, allowAdd = false }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((opt: string) => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{ border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{ color: value ? 'inherit' : '#9ca3af' }}>{value || placeholder}</span>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', fontSize: '0.8rem', color: '#6b7280' }}>▼</span>
      </div>

      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'white', border: '1px solid var(--border)', borderRadius: '8px', marginTop: '4px', maxHeight: '250px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '6px', padding: '0.25rem 0.5rem' }}>
              <SearchIcon size={16} color="#9ca3af" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث..."
                style={{ border: 'none', background: 'transparent', outline: 'none', padding: '0.25rem 0.5rem', width: '100%', fontSize: '0.9rem' }}
                autoFocus
              />
            </div>
          </div>

          {nullOption && !search && (
            <div onClick={() => { onChange(''); setIsOpen(false); }} style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', color: '#6b7280', fontStyle: 'italic' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {nullOption}
            </div>
          )}

          {filtered.length === 0 ? (
            allowAdd && search.trim() ? (
              <div onClick={() => { onChange(search.trim()); setIsOpen(false); setSearch(''); }} style={{ padding: '0.75rem', cursor: 'pointer', color: 'var(--primary)', textAlign: 'center', fontWeight: 'bold' }}>
                <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>+</span> إضافة "{search.trim()}"
              </div>
            ) : (
              <div style={{ padding: '0.75rem', color: 'var(--text-light)', textAlign: 'center' }}>لا يوجد نتائج</div>
            )
          ) : (
            <>
              {filtered.map((opt: string) => (
                <div key={opt} onClick={() => { onChange(opt); setIsOpen(false); setSearch(''); }} style={{ padding: '0.75rem', cursor: 'pointer', background: value === opt ? 'rgba(30, 58, 138, 0.1)' : 'transparent', borderBottom: '1px solid #f1f5f9', color: 'black' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = value === opt ? 'rgba(30, 58, 138, 0.1)' : 'transparent'}>
                  {opt}
                </div>
              ))}
              {allowAdd && search.trim() && !options.includes(search.trim()) && (
                <div onClick={() => { onChange(search.trim()); setIsOpen(false); setSearch(''); }} style={{ padding: '0.75rem', cursor: 'pointer', color: 'var(--primary)', textAlign: 'center', borderTop: '1px solid #f1f5f9', background: '#f0f9ff', fontWeight: 'bold' }}>
                  <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>+</span> إضافة "{search.trim()}"
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MultiSelect({ options, selected, onChange, placeholder, hasError }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
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
      onChange(selected.filter((s: string) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{ border: hasError ? '2px dashed #ef4444' : '1px solid var(--border)', padding: '0.75rem', borderRadius: '8px', background: hasError ? '#fef2f2' : 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '45px' }}
      >
        <span style={{ color: selected.length ? 'inherit' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
          {selected.length > 0 ? selected.join('، ') : placeholder}
        </span>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', fontSize: '0.8rem', color: '#6b7280' }}>▼</span>
      </div>

      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'white', border: '1px solid var(--border)', borderRadius: '8px', marginTop: '4px', maxHeight: '250px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          {options.map((opt: string) => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', color: 'black', gap: '0.5rem', margin: 0 }} onClick={e => e.stopPropagation()}>
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggleOption(opt)} style={{ width: '16px', height: '16px' }} />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'inquiry' | 'form'>('landing');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimeout = React.useRef<any>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 3000);
  };

  return (
    <div dir="rtl" className="min-h-screen relative">
      {currentScreen === 'landing' && <LandingScreen onGo={setCurrentScreen} />}
      {currentScreen === 'inquiry' && <InquiryScreen onBack={() => setCurrentScreen('landing')} showToast={showToast} />}
      {currentScreen === 'form' && <OrderForm onBack={() => setCurrentScreen('landing')} showToast={showToast} />}

      {toast && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#fee2e2' : toast.type === 'success' ? '#dcfce7' : '#e0f2fe',
          color: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#10b981' : '#0ea5e9',
          padding: '1rem 2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold'
        }} className="fade-in">
          {toast.type === 'error' && <span style={{ fontSize: '1.2rem' }}>⚠️</span>}
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

function LandingScreen({ onGo }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ background: 'white', padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
        <img src="logo.jpg" alt="Logo" style={{ width: '160px', display: 'block', margin: '0 auto 1.5rem auto' }} />
        <h1 style={{ fontSize: '2.2rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>مكتبة نصار - منصة المعلمين</h1>
        <p style={{ color: 'var(--text-light)', marginBottom: '1rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
          نقدم لك خدمة تصميم الخطط الفصلية وتحضير الدروس بأعلى جودة لتوفير وقتك وجهدك.
        </p>
        <p style={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '1rem', fontSize: '1.2rem' }}>أهلاً بك.. اختر الخدمة التي تريدها للبدء</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={() => onGo('form')}
            className="btn btn-primary"
            style={{ width: '100%', padding: '1.2rem', fontSize: '1.2rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Plus size={24} /> طلب جديد
          </button>

          <button
            onClick={() => onGo('inquiry')}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '1.2rem', fontSize: '1.2rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#f1f5f9', color: 'var(--primary)', border: 'none' }}
          >
            <SearchIcon size={24} /> استعلام عن طلب مسجل
          </button>
        </div>
      </div>
    </div>
  );
}

function InquiryScreen({ onBack, showToast }: any) {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmRejectId, setConfirmRejectId] = useState<number | null>(null);

  const handleSearch = async () => {
    if (!phone) return showToast('الرجاء إدخال رقم الهاتف', 'error');
    setLoading(true);
    try {
      const { data, error } = await supabase.from('orders').select('*, order_items(*)').eq('phone', phone).order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
      setSearched(true);
    } catch (err) {
      showToast('خطأ في البحث', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (orderId: number) => {
    try {
      const { error } = await supabase.from('orders').update({ status: 4 }).eq('id', orderId);
      if (error) {
        throw error;
      }

      await supabase.from('notifications').insert({
        message: `المعلم رفض الطلب #${orderId}`,
        type: 'status_update',
        order_id: orderId
      });

      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 4 } : o));
      showToast('تم رفض الطلب بنجاح. سيتم إشعار الإدارة بذلك.', 'success');
      setConfirmRejectId(null);
    } catch (err) {
      showToast('خطأ في رفض الطلب', 'error');
    }
  };

  const getStatusBadge = (status: number) => {
    const statuses = [
      { text: 'جديد', bg: '#fef3c7', color: '#d97706' },
      { text: 'قيد المعالجة', bg: '#dbeafe', color: '#2563eb' },
      { text: 'تم الانتهاء', bg: '#dcfce7', color: '#16a34a' },
      { text: 'مرفوض من الإدارة', bg: '#fee2e2', color: '#dc2626' },
      { text: 'مرفوض من المعلم', bg: '#fee2e2', color: '#dc2626' }
    ];
    const s = statuses[status] || statuses[0];
    return <span style={{ background: s.bg, color: s.color, padding: '0.4rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center' }}>{s.text}</span>;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', marginBottom: '2rem', padding: '0.5rem' }}>
        <ArrowLeft size={20} /> عودة للرئيسية
      </button>

      <div style={{ background: 'white', padding: '2.5rem 2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '1.8rem', fontWeight: 'bold' }}>الاستعلام عن الطلبات</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1rem', fontSize: '1.05rem' }}>أدخل رقم الهاتف الذي استخدمته عند تسجيل الطلب:</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input type="tel" placeholder="رقم الهاتف..." value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9+]/g, ''))} maxLength={15} style={{ flex: 1, padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1.1rem', textAlign: 'right' }} dir={phone ? 'ltr' : 'rtl'} />
          <button onClick={handleSearch} disabled={loading} style={{ background: '#f1f5f9', color: 'var(--primary)', border: 'none', padding: '0 2.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {loading ? 'جاري البحث...' : <><SearchIcon size={20} /> بحث</>}
          </button>
        </div>
      </div>

      {searched && (
        <div>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem', color: 'var(--primary)' }}>نتائج البحث ({orders.length})</h3>
          {orders.length === 0 ? (
            <div style={{ background: 'white', padding: '3rem 2rem', textAlign: 'center', borderRadius: '16px', color: '#64748b', fontSize: '1.1rem' }}>لا توجد طلبات مسجلة بهذا الرقم.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {orders.map(order => (
                <div key={order.id} style={{ background: 'white', padding: '1.5rem 2rem', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <h4 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--primary)', fontWeight: 'bold' }}>رقم الطلب: #{order.id}</h4>
                    {getStatusBadge(order.status)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '1.5rem', color: '#475569', fontSize: '1rem', fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: '120px', color: 'var(--primary)', fontWeight: 'bold' }}>المدرسة:</span>
                      <span>{order.school_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: '120px', color: 'var(--primary)', fontWeight: 'bold' }}>التاريخ:</span>
                      <span dir="ltr">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: '120px', color: 'var(--primary)', fontWeight: 'bold' }}>التكلفة الإجمالية:</span>
                      <span>{order.total_amount} د.أ</span>
                    </div>
                  </div>

                  {order.status === 0 || order.status === 1 ? (
                    confirmRejectId === order.id ? (
                      <div className="fade-in" style={{ background: '#fef2f2', padding: '1.5rem', borderRadius: '12px', border: '1px solid #fecaca', textAlign: 'center', marginTop: '1rem' }}>
                        <p style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '1rem', fontSize: '1.05rem' }}>هل أنت متأكد من رفضك لهذا الطلب؟ سيتم إشعار الإدارة بذلك.</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                          <button onClick={() => setConfirmRejectId(null)} style={{ background: 'white', color: '#475569', border: '1px solid #cbd5e1', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>تراجع</button>
                          <button onClick={() => handleReject(order.id)} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(220, 38, 38, 0.2)' }}>نعم، تأكيد الرفض</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmRejectId(order.id)} style={{ background: '#fce8e8', color: '#dc2626', border: 'none', padding: '1rem 1.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#fecaca'} onMouseOut={e => e.currentTarget.style.background = '#fce8e8'}>
                        رفض الطلب
                      </button>
                    )
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OrderForm({ onBack, showToast }: any) {
  const [step, setStep] = useState(1);
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '', phone: '', phone2: '', schoolName: '', schoolType: '', directorate: 'التعليم الخاص', governorate: 'عمان', district: '', otherDistrict: '', deliveryType: 'pickup', schoolLocation: '', homeLocation: ''
  });
  const [teachers, setTeachers] = useState<Teacher[]>([{ id: 't1', name: '', items: [] }]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<Record<string, string[]>>({});

  useEffect(() => {
    supabase.from('subjects').select('*').then(({ data }) => {
      if (data) setDbSubjects(data);
    });

    supabase.from('locations').select('*').then(({ data }) => {
      if (data) {
        const map: Record<string, string[]> = {};
        data.forEach((loc: any) => {
          const districts = loc.districts.filter((d: string) => d !== 'أخرى' && d !== 'إضافة');
          map[loc.governorate] = ['إضافة', ...districts];
        });
        setLocations(map);
      }
    });
  }, []);

  const handleCustomerChange = (e: any) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => {
      let finalValue = value;
      // Allow only numbers and plus sign for phone fields
      if (name === 'phone' || name === 'phone2') {
        finalValue = value.replace(/[^0-9+]/g, '');
      }
      const updated = { ...prev, [name]: finalValue };
      if (name === 'governorate') updated.district = '';
      return updated;
    });
  };

  const addTeacher = () => setTeachers([...teachers, { id: `t${Date.now()}`, name: '', items: [] }]);
  const removeTeacher = (id: string) => { if (teachers.length > 1) setTeachers(teachers.filter(t => t.id !== id)); };
  const updateTeacherName = (id: string, name: string) => setTeachers(teachers.map(t => t.id === id ? { ...t, name } : t));

  const toggleSubjectForTeacher = (teacherId: string, subjectName: string) => {
    const subject = dbSubjects.find(s => s.name === subjectName);
    if (!subject) return;

    setTeachers(teachers.map(t => {
      if (t.id !== teacherId) return t;
      const existing = t.items.find(i => i.subjectId === subject.id);
      if (existing) return { ...t, items: t.items.filter(i => i.subjectId !== subject.id) };
      return { ...t, items: [...t.items, { id: Math.random().toString(), subjectId: subject.id, grades: [], serviceType: 'both' }] };
    }));
  };

  const updateItemGrades = (teacherId: string, itemId: string, grades: string[]) => {
    setTeachers(teachers.map(t => t.id === teacherId ? { ...t, items: t.items.map(i => i.id === itemId ? { ...i, grades } : i) } : t));
  };

  const updateItemServiceType = (teacherId: string, itemId: string, type: 'plan' | 'prep' | 'both') => {
    setTeachers(teachers.map(t => t.id === teacherId ? { ...t, items: t.items.map(i => i.id === itemId ? { ...i, serviceType: type } : i) } : t));
  };

  const calculateTotal = () => {
    let total = 0;
    teachers.forEach(teacher => {
      teacher.items.forEach(item => {
        const subject = dbSubjects.find(s => s.id === item.subjectId);
        if (!subject) return;

        item.grades.forEach(g => {
          if (['الأول', 'الثاني', 'الثالث'].includes(g)) {
            total += 7; // Fixed package price
          } else {
            if (item.serviceType === 'plan' || item.serviceType === 'both') total += subject.plan_price;
            if (item.serviceType === 'prep' || item.serviceType === 'both') total += subject.prep_price;
          }
        });
      });
    });
    const deliveryCost = customerInfo.deliveryType === 'delivery' ? 3 : 0;
    return total + deliveryCost;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const finalDistrict = customerInfo.district === 'إضافة' ? customerInfo.otherDistrict : customerInfo.district;
      const totalAmount = calculateTotal();
      const deliveryCost = customerInfo.deliveryType === 'delivery' ? 3 : 0;

      // Append new district to DB if manual entry
      if (customerInfo.district === 'إضافة' && customerInfo.otherDistrict) {
        try {
          const { data: locs } = await supabase.from('locations').select('districts').eq('governorate', customerInfo.governorate).single();
          if (locs) {
            const distList = Array.isArray(locs.districts) ? locs.districts : JSON.parse(locs.districts);
            if (!distList.includes(customerInfo.otherDistrict)) {
              distList.unshift(customerInfo.otherDistrict);
              await supabase.from('locations').update({ districts: distList }).eq('governorate', customerInfo.governorate);
            }
          }
        } catch (e) { console.error('Error updating district:', e); }
      }

      const { data: orderData, error: orderError } = await supabase.from('orders').insert({
        customer_name: customerInfo.name,
        school_name: customerInfo.schoolName,
        school_type: customerInfo.schoolType,
        directorate: customerInfo.directorate,
        governorate: customerInfo.governorate,
        district: finalDistrict,
        phone: customerInfo.phone,
        phone2: customerInfo.phone2,
        delivery_type: customerInfo.deliveryType === 'pickup' ? 0 : 1,
        delivery_cost: deliveryCost,
        total_amount: totalAmount,
        school_location: customerInfo.schoolLocation,
        home_location: customerInfo.homeLocation,
        status: 0
      }).select();

      if (orderError) {
        throw orderError;
      }
      const orderId = orderData[0].id;

      await supabase.from('notifications').insert({
        message: `طلب جديد برقم #${orderId} من ${customerInfo.name} - ${customerInfo.schoolName}`,
        type: 'new',
        order_id: orderId
      });

      const orderItems = [];
      for (const teacher of teachers) {
        for (const item of teacher.items) {
          const subject = dbSubjects.find(s => s.id === item.subjectId);
          if (!subject) continue;
          for (const grade of item.grades) {
            let price = 0;
            if (['الأول', 'الثاني', 'الثالث'].includes(grade)) {
              price = 7;
            } else {
              if (item.serviceType === 'plan' || item.serviceType === 'both') price += subject.plan_price;
              if (item.serviceType === 'prep' || item.serviceType === 'both') price += subject.prep_price;
            }
            orderItems.push({
              order_id: orderId,
              teacher_name: teacher.name,
              subject: subject.name,
              grade: grade,
              service_type: item.serviceType === 'plan' ? 0 : item.serviceType === 'prep' ? 1 : 2, // 2 for package
              price: price
            });
          }
        }
      }

      if (orderItems.length > 0) {
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;
      }

      setStep(4);
    } catch (error) {
      showToast('حدث خطأ أثناء حفظ الطلب. الرجاء المحاولة مرة أخرى.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDeliveryValid = customerInfo.deliveryType === 'pickup' || (customerInfo.deliveryType === 'delivery' && customerInfo.schoolLocation && customerInfo.homeLocation);
  const isStep1Valid = customerInfo.name && customerInfo.phone && customerInfo.schoolName && customerInfo.schoolType && customerInfo.directorate && customerInfo.governorate && customerInfo.district && (customerInfo.district !== 'إضافة' || customerInfo.otherDistrict) && isDeliveryValid;
  const isStep2Valid = teachers.every(t => t.name && t.items.length > 0 && t.items.every(i => i.grades.length > 0));
  const isStep3Valid = true;

  return (
    <div className="app-container" style={{ padding: '2rem 1rem' }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
        <ArrowLeft size={20} /> عودة للرئيسية
      </button>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <img src="logo.jpg" alt="Logo" style={{ width: '150px', display: 'block', margin: '0 auto 2.5rem auto' }} />
        
        {step < 4 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ position: 'absolute', top: '22px', right: '16.66%', left: '16.66%', height: '4px', background: 'var(--border)', zIndex: 0, borderRadius: '4px' }}>
               <div style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%', height: '100%', background: 'var(--primary)', transition: '0.4s ease', borderRadius: '4px' }} />
            </div>

            {[
              { id: 1, title: 'معلومات صاحب الطلب', icon: <User size={20} /> },
              { id: 2, title: 'المعلمين والمواد', icon: <BookOpen size={20} /> },
              { id: 3, title: 'تأكيد الطلب', icon: <CheckCircle size={20} /> }
            ].map(s => {
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              return (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '33.33%', gap: '1rem' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '50%', 
                    background: isActive || isCompleted ? 'var(--primary)' : 'white', 
                    border: `4px solid ${isActive || isCompleted ? 'var(--primary)' : 'var(--border)'}`, 
                    color: isActive || isCompleted ? 'white' : 'var(--text-light)', 
                    display: 'flex', justifyContent: 'center', alignItems: 'center', 
                    transition: '0.4s ease',
                    boxShadow: isActive ? '0 0 0 5px rgba(11, 29, 58, 0.1)' : 'none'
                  }}>
                    {isCompleted ? <CheckCircle size={24} /> : s.icon}
                  </div>
                  <span style={{ 
                    color: isActive ? 'var(--primary)' : isCompleted ? 'var(--text)' : 'var(--text-light)', 
                    fontWeight: isActive ? 'bold' : '600', 
                    fontSize: isActive ? '1.1rem' : '0.95rem', 
                    textAlign: 'center', transition: '0.4s ease'
                  }}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="form-card">
        {step === 1 && (
          <div className="form-section fade-in">
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'right' }}>الاسم الكامل <span style={{ color: 'red' }}>*</span></label>
              <input className="form-input" type="text" name="name" value={customerInfo.name} onChange={handleCustomerChange} maxLength={50} placeholder="اسم المعلم أو صاحب الطلب" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'right' }}>رقم الهاتف <span style={{ color: 'red' }}>*</span></label>
                <input className="form-input" type="tel" name="phone" value={customerInfo.phone} onChange={handleCustomerChange} maxLength={15} placeholder="079XXXXXXX" dir={customerInfo.phone ? 'ltr' : 'rtl'} style={{ textAlign: 'right' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'right' }}>رقم هاتف آخر (اختياري)</label>
                <input className="form-input" type="tel" name="phone2" value={customerInfo.phone2} onChange={handleCustomerChange} maxLength={15} placeholder="رقم هاتف بديل للتواصل" dir={customerInfo.phone2 ? 'ltr' : 'rtl'} style={{ textAlign: 'right' }} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'right' }}>المحافظة <span style={{ color: 'red' }}>*</span></label>
                <SearchableSelect 
                  options={Object.keys(locations)} 
                  value={customerInfo.governorate} 
                  onChange={(val: string) => setCustomerInfo({...customerInfo, governorate: val, district: ''})} 
                  placeholder="اختر أو ابحث عن المحافظة..." 
                  nullOption="اختر المحافظة"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'right' }}>اللواء / المنطقة <span style={{ color: 'red' }}>*</span></label>
                <SearchableSelect 
                  options={customerInfo.governorate ? locations[customerInfo.governorate] : []} 
                  value={customerInfo.district} 
                  onChange={(val: string) => setCustomerInfo({...customerInfo, district: val, otherDistrict: ''})} 
                  placeholder="ابحث لاختيار أو إضافة لواء..." 
                  disabled={!customerInfo.governorate} 
                  allowAdd={true} 
                />
              </div>
              {customerInfo.district === 'إضافة' && (
                <div className="form-group">
                  <label className="form-label" style={{ textAlign: 'right' }}>اسم اللواء / المنطقة الجديد <span style={{ color: 'red' }}>*</span></label>
                  <input className="form-input" type="text" name="otherDistrict" value={customerInfo.otherDistrict} onChange={handleCustomerChange} maxLength={50} placeholder="اكتب اسم اللواء/المنطقة هنا..." />
                </div>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'right' }}>اسم المدرسة <span style={{ color: 'red' }}>*</span></label>
                <input className="form-input" type="text" name="schoolName" value={customerInfo.schoolName} onChange={handleCustomerChange} maxLength={100} placeholder="الجامعة، ناعور.." />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'right' }}>نوع المدرسة <span style={{ color: 'red' }}>*</span></label>
                <select className="form-select" name="schoolType" value={customerInfo.schoolType} onChange={handleCustomerChange}>
                  <option value="">اختر نوع المدرسة</option>
                  <option value="ذكور">ذكور</option>
                  <option value="إناث">إناث</option>
                  <option value="مختلط">مختلط</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label" style={{ textAlign: 'right' }}>طريقة الاستلام <span style={{ color: 'red' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div
                  onClick={() => setCustomerInfo({ ...customerInfo, deliveryType: 'pickup' })}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', border: customerInfo.deliveryType === 'pickup' ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: 'white', fontWeight: 'bold' }}
                >
                  <Store size={20} /> استلام من المكتبة
                </div>
                <div
                  onClick={() => setCustomerInfo({ ...customerInfo, deliveryType: 'delivery' })}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', border: customerInfo.deliveryType === 'delivery' ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: 'white', fontWeight: 'bold' }}
                >
                  <Truck size={20} /> توصيل
                </div>
              </div>
            </div>

            {customerInfo.deliveryType === 'delivery' && (
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                <div style={{ background: '#e0f2fe', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                  <Truck size={20} />
                  <span><strong>ملاحظة:</strong> سوف يتم توصيل طلبك خلال 24 - 48 ساعة.</span>
                </div>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--primary)', fontSize: '1.1rem' }}>تفاصيل العنوان الدقيق للتوصيل</h3>
                <div className="form-group">
                  <label>العنوان بالتفصيل (مكان المدرسة) <span style={{ color: 'red' }}>*</span></label>
                  <input className="form-input" type="text" name="schoolLocation" value={customerInfo.schoolLocation} onChange={handleCustomerChange} maxLength={200} placeholder="مثال: بجانب مسجد التقوى، شارع المدارس" />
                </div>
                <div className="form-group">
                  <label>العنوان بالتفصيل (مكان البيت) <span style={{ color: 'red' }}>*</span></label>
                  <input className="form-input" type="text" name="homeLocation" value={customerInfo.homeLocation} onChange={handleCustomerChange} maxLength={200} placeholder="مثال: حي الزهور، عمارة رقم 5" />
                </div>
              </div>
            )}

            {!isStep1Valid && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <p style={{ color: '#ef4444', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>الرجاء إكمال/تصحيح الحقول التالية للمتابعة:</p>
                <ul style={{ color: '#ef4444', margin: 0, paddingRight: '1.5rem', fontSize: '0.9rem' }}>
                  {!customerInfo.name && <li>الاسم الكامل</li>}
                  {!customerInfo.phone && <li>رقم الهاتف</li>}
                  {!customerInfo.schoolName && <li>اسم المدرسة</li>}
                  {!customerInfo.schoolType && <li>نوع المدرسة</li>}
                  {!customerInfo.governorate && <li>المحافظة</li>}
                  {!customerInfo.district && <li>اللواء / المنطقة</li>}
                  {customerInfo.district === 'إضافة' && !customerInfo.otherDistrict && <li>اسم اللواء / المنطقة الجديد</li>}
                  {customerInfo.deliveryType === 'delivery' && (!customerInfo.schoolLocation || !customerInfo.homeLocation) && <li>تفاصيل عنوان التوصيل</li>}
                </ul>
              </div>
            )}

            <button className="btn btn-primary btn-block" onClick={() => setStep(2)} disabled={!isStep1Valid} style={{ background: isStep1Valid ? undefined : '#cbd5e1', color: isStep1Valid ? 'white' : '#f8fafc' }}>
              التالي: اختيار المواد والمعلمين
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="form-section fade-in">
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '2rem' }}>
              <button className="btn btn-outline" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.95rem', borderRadius: '8px', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }} onClick={addTeacher}>
                <Plus size={18} /> إضافة معلم آخر
              </button>
            </div>
            
            {teachers.map((teacher, index) => (
              <div key={teacher.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', position: 'relative' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontWeight: 'bold', color: 'var(--primary)', display: 'block', marginBottom: '0.5rem', fontSize: '1.1rem' }}>اسم المعلم:</label>
                  <input 
                    type="text" 
                    value={teacher.name} 
                    onChange={e => updateTeacherName(teacher.id, e.target.value)} 
                    maxLength={100} 
                    placeholder="أدخل اسم المعلم..." 
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: teacher.name ? '1px solid var(--border)' : '1px dashed #ef4444', outline: 'none', fontSize: '1rem' }}
                  />
                </div>

                <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />

                <label style={{ fontWeight: 'bold', color: 'var(--primary)', marginBottom: '1rem', display: 'block', fontSize: '1.05rem' }}>المواد المضافة:</label>

                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px dashed var(--border)', marginBottom: '1.5rem' }}>
                  <label style={{ fontWeight: 'bold', color: 'var(--primary)', marginBottom: '1rem', display: 'block', fontSize: '0.95rem' }}>+ إضافة مادة جديدة لهذا المعلم</label>
                  <SearchableSelect
                    options={dbSubjects.map(s => s.name)}
                    value=""
                    onChange={(val: string) => toggleSubjectForTeacher(teacher.id, val)}
                    placeholder="ابحث عن مادة لإضافتها..."
                  />
                </div>

                {teacher.items.map(item => {
                  const subject = dbSubjects.find(s => s.id === item.subjectId);
                  const isExpanded = expandedItems.includes(item.id);
                  const hasPackageGrades = item.grades.some(g => ['الأول', 'الثاني', 'الثالث'].includes(g));
                  
                  let subjectTotal = 0;
                  item.grades.forEach(g => {
                    if (['الأول', 'الثاني', 'الثالث'].includes(g)) {
                      subjectTotal += 7;
                    } else if (subject) {
                      if (item.serviceType === 'plan' || item.serviceType === 'both') subjectTotal += subject.plan_price;
                      if (item.serviceType === 'prep' || item.serviceType === 'both') subjectTotal += subject.prep_price;
                    }
                  });

                  const hasError = item.grades.length === 0;

                  return (
                    <div key={item.id} style={{ background: 'white', border: hasError ? '1px solid #ef4444' : '1px solid var(--border)', borderRadius: '8px', marginBottom: '1rem', overflow: 'hidden' }}>
                      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: hasError ? '#fffaf9' : 'white' }} onClick={() => setExpandedItems(prev => isExpanded ? prev.filter(id => id !== item.id) : [...prev, item.id])}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          {subject?.name}
                        </div>
                        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); toggleSubjectForTeacher(teacher.id, subject?.name || ''); }} style={{ color: '#ef4444' }}>
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {isExpanded && (
                        <div style={{ padding: '1.5rem', borderTop: hasError ? '1px solid #ef4444' : '1px solid var(--border)' }}>
                          <div className="form-group">
                            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>الصفوف المطلوبة: <span style={{ color: 'red' }}>*</span></label>
                            <MultiSelect options={GRADES} selected={item.grades} onChange={(val: any) => updateItemGrades(teacher.id, item.id, val)} placeholder="اختر الصفوف..." hasError={hasError} />
                            {hasError && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 'bold', textAlign: 'right' }}>يرجى اختيار صف واحد على الأقل للمادة</div>}
                          </div>

                          {!hasPackageGrades && subject && (
                            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                              <label style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '1rem', display: 'block' }}>الخدمة المطلوبة للصف الواحد:</label>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                  <input type="radio" checked={item.serviceType === 'both'} onChange={() => updateItemServiceType(teacher.id, item.id, 'both')} /> 
                                  خطة + تحضير ({subject.plan_price + subject.prep_price} د.أ)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                  <input type="radio" checked={item.serviceType === 'plan'} onChange={() => updateItemServiceType(teacher.id, item.id, 'plan')} /> 
                                  خطة فقط ({subject.plan_price} د.أ)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                  <input type="radio" checked={item.serviceType === 'prep'} onChange={() => updateItemServiceType(teacher.id, item.id, 'prep')} /> 
                                  تحضير فقط ({subject.prep_price} د.أ)
                                </label>
                              </div>
                            </div>
                          )}

                          {hasPackageGrades && (
                            <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '8px', color: '#92400e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                              <Package size={20} />
                              <span>الصفوف (الأول، الثاني، الثالث) تعتبر بكج بسعر 7 دنانير ثابتة للصف الواحد بغض النظر عن الخدمة المختارة.</span>
                            </div>
                          )}

                          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', border: '1px solid var(--border)' }}>
                            المجموع لهذه المادة: {subjectTotal} د.أ
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {!isStep2Valid && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <p style={{ color: '#ef4444', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>الرجاء إكمال/تصحيح الأخطاء التالية للمتابعة:</p>
                <ul style={{ color: '#ef4444', margin: 0, paddingRight: '1.5rem', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {teachers.some(t => !t.name) && <li>إدخال أسماء جميع المعلمين</li>}
                  {teachers.some(t => t.items.length === 0) && <li>إضافة مادة واحدة على الأقل لكل معلم</li>}
                  {teachers.some(t => t.items.some(i => i.grades.length === 0)) && <li>اختيار صف واحد على الأقل لكل مادة مضافة</li>}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn" style={{ flex: 1, padding: '1rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', color: 'white', background: '#475569', border: 'none', cursor: 'pointer' }} onClick={() => setStep(1)}>رجوع</button>
              <button className="btn" style={{ flex: 1, padding: '1rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', color: 'white', background: isStep2Valid ? 'var(--primary)' : '#cbd5e1', border: 'none', cursor: isStep2Valid ? 'pointer' : 'not-allowed', opacity: isStep2Valid ? 1 : 0.8 }} onClick={() => setStep(3)} disabled={!isStep2Valid}>مراجعة الطلب والتأكيد</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="form-section fade-in">
            <h3 style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>معلومات العميل</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div><strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>الاسم:</strong> {customerInfo.name}</div>
                <div><strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>المدرسة:</strong> {customerInfo.schoolName}</div>
                <div><strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>العنوان:</strong> {customerInfo.governorate} - {customerInfo.district}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div><strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>الهاتف:</strong> {customerInfo.phone}</div>
                <div><strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>المديرية:</strong> {customerInfo.directorate || 'التعليم الخاص'}</div>
                <div><strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>الاستلام:</strong> {customerInfo.deliveryType === 'delivery' ? 'توصيل' : 'استلام من المكتبة'}</div>
              </div>
            </div>

            <h3 style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>تفاصيل الطلب</h3>
            <div style={{ marginBottom: '2rem' }}>
              {teachers.map(teacher => (
                <div key={teacher.id} style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '1rem', overflow: 'hidden' }}>
                  <div style={{ padding: '1rem 1.5rem', background: '#f1f5f9', borderBottom: '1px solid var(--border)', fontWeight: 'bold' }}>
                    اسم المعلم: {teacher.name}
                  </div>
                  <div style={{ padding: '1rem 1.5rem' }}>
                    {teacher.items.map((item, idx) => {
                      const subject = dbSubjects.find(s => s.id === item.subjectId);
                      let subjectTotal = 0;
                      let serviceLabel = '';
                      if (item.serviceType === 'plan') serviceLabel = 'خطة';
                      else if (item.serviceType === 'prep') serviceLabel = 'تحضير';
                      else serviceLabel = 'خطة وتحضير';

                      item.grades.forEach(g => {
                        if (['الأول', 'الثاني', 'الثالث'].includes(g)) {
                          subjectTotal += 7;
                        } else if (subject) {
                          if (item.serviceType === 'plan' || item.serviceType === 'both') subjectTotal += subject.plan_price;
                          if (item.serviceType === 'prep' || item.serviceType === 'both') subjectTotal += subject.prep_price;
                        }
                      });

                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 0', borderBottom: idx !== teacher.items.length - 1 ? '1px dashed var(--border)' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{subject?.name} - {item.grades.join('، ')}</span>
                            <span style={{ background: '#e2e8f0', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>{serviceLabel}</span>
                          </div>
                          <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{subjectTotal} د.أ</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--primary)', color: 'white', padding: '2.5rem 2rem', borderRadius: '16px', marginBottom: '2.5rem', position: 'relative', boxShadow: '0 10px 25px -5px rgba(255, 188, 13, 0.4)' }}>
              <div style={{ position: 'absolute', bottom: '0', left: '1rem', right: '1rem', height: '6px', background: 'var(--accent)', borderRadius: '0 0 16px 16px' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <span>المجموع الفرعي:</span>
                <span>{calculateTotal() - (customerInfo.deliveryType === 'delivery' ? 3 : 0)} د.أ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <span>رسوم التوصيل:</span>
                <span>{customerInfo.deliveryType === 'delivery' ? '3 د.أ' : '0 د.أ'}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '2px dashed rgba(255,255,255,0.2)', margin: '1.5rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.6rem', fontWeight: '900' }}>
                <span>المجموع الإجمالي:</span>
                <span>{calculateTotal()} د.أ</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn" style={{ flex: 1, padding: '1.2rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', color: 'white', background: '#475569', border: 'none', cursor: 'pointer' }} onClick={() => setStep(2)}>تعديل الطلبات</button>
              <button className="btn" style={{ flex: 1, padding: '1.2rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', color: 'white', background: '#dc2626', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', boxShadow: '0 8px 20px rgba(220, 38, 38, 0.4)' }} onClick={handleSubmit} disabled={isSubmitting || !isStep3Valid}>
                {isSubmitting ? <Loader2 className="spinner" /> : <><CheckCircle size={20} /> إرسال الطلب النهائي</>}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="success-screen fade-in" style={{ background: 'white', borderRadius: '24px', padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', maxWidth: '650px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <CheckCircle size={80} color="#10b981" strokeWidth={2.5} />
            </div>
            
            <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '2.5rem', fontWeight: '900' }}>
              شكراً لك!
            </h2>
            
            <p style={{ color: 'var(--text-light)', marginBottom: '2.5rem', fontSize: '1.15rem', lineHeight: '1.8', maxWidth: '90%', margin: '0 auto 2.5rem auto' }}>
              تم تأكيد طلبك بنجاح يا {customerInfo.name}.<br />
              تم استلام طلبك وسنقوم بالتواصل معك قريباً.<br />
              {customerInfo.deliveryType === 'delivery' && (
                <span style={{ color: '#0369a1', fontWeight: 'bold' }}>سوف يتم توصيل طلبك خلال 24 - 48 ساعة.</span>
              )}
            </p>

            <a href="tel:0777775306" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', background: '#f8fafc', padding: '1rem 2rem', borderRadius: '16px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold', marginBottom: '3rem', fontSize: '1.05rem', border: '1px solid var(--border)' }}>
              للملاحظات يرجى الاتصال على هذا الرقم: <span dir="ltr" style={{ color: '#dc2626' }}>0777775306</span> 📞
            </a>

            <div>
              <button className="btn" onClick={() => window.location.reload()} style={{ background: '#dc2626', color: 'white', padding: '1.2rem 3.5rem', borderRadius: '16px', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 8px 25px rgba(220, 38, 38, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} /> إدخال طلب جديد
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
