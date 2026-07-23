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
  schoolDeliveryGov: string;
  schoolLocation: string;
  homeDeliveryGov: string;
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
          {options.length === 0 ? (
            <div style={{ padding: '0.75rem', color: '#6b7280', textAlign: 'center' }}>لا توجد صفوف متاحة لهذه المادة</div>
          ) : (
            options.map((opt: string) => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', color: 'black', gap: '0.5rem', margin: 0 }} onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggleOption(opt)} style={{ width: '16px', height: '16px' }} />
                {opt}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'inquiry' | 'form'>('landing');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimeout = React.useRef<any>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
    setToast({ message, type });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), duration);
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
          padding: '1rem 2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold',
          whiteSpace: 'pre-line', maxWidth: '90vw', lineHeight: '1.5'
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
          نقدم لك خدمة إعداد الخطط الفصلية وتحضير الدروس بأعلى جودة لتوفير وقتك وجهدك.
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
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder && targetOrder.status !== 0) {
        showToast('عذراً، يمكن رفض الطلب فقط عندما تكون حالته "جديد".', 'error');
        setConfirmRejectId(null);
        return;
      }

      const { error } = await supabase.from('orders').update({ status: 5 }).eq('id', orderId).eq('status', 0);
      if (error) {
        throw error;
      }

      await supabase.from('notifications').insert({
        message: `المعلم رفض الطلب #${orderId}`,
        type: 'status_update',
        order_id: orderId
      });

      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 5 } : o));
      showToast('تم رفض الطلب بنجاح. سيتم إشعار الإدارة بذلك.', 'success');
      setConfirmRejectId(null);
    } catch (err) {
      showToast('خطأ في رفض الطلب', 'error');
    }
  };

  const getStatusInfo = (status: number, deliveryType?: number | string) => {
    const isDelivery = String(deliveryType) === '1' || String(deliveryType) === 'true';
    switch (Number(status)) {
      case 0:
        return {
          text: 'جديد',
          bg: '#eff6ff',
          color: '#1d4ed8',
          border: '#bfdbfe',
          desc: 'الطلب جديد وبانتظار مراجعة الإدارة والتعليمات.'
        };
      case 1:
        return {
          text: 'في مرحلة الطباعة',
          bg: '#fef3c7',
          color: '#b45309',
          border: '#fde68a',
          desc: 'الطلب تحت التجهيز والطباعة حالياً من قبل المكتبة.'
        };
      case 2:
        return {
          text: isDelivery ? 'في مرحلة التوصيل' : 'في مرحلة الاستلام',
          bg: '#f3e8ff',
          color: '#6b21a8',
          border: '#d8b4fe',
          desc: isDelivery
            ? 'تم الانتهاء من الطباعة والطلب جاهز للخروج مع المندوب.'
            : 'تم الانتهاء من الطباعة والطلب جاهز للاستلام من المكتبة.'
        };
      case 3:
        return {
          text: 'مكتمل / تم التسليم',
          bg: '#d1fae5',
          color: '#047857',
          border: '#a7f3d0',
          desc: 'تم تسليم الطلب للعميل واستلام الحساب بنجاح.'
        };
      case 4:
        return {
          text: 'مرفوض من المكتبة',
          bg: '#f1f5f9',
          color: '#475569',
          border: '#cbd5e1',
          desc: 'تم إلغاء أو رفض الطلب من قبل إدارة النظام.'
        };
      case 5:
        return {
          text: 'مرفوض من المعلم',
          bg: '#fee2e2',
          color: '#dc2626',
          border: '#fca5a5',
          desc: 'تم اعتذار المعلم عن تنفيذ هذا الطلب.'
        };
      default:
        return {
          text: 'مجهول',
          bg: '#f8fafc',
          color: '#64748b',
          border: '#e2e8f0',
          desc: ''
        };
    }
  };

  const renderStatusBadgeWithDesc = (status: number, deliveryType?: number | string) => {
    const info = getStatusInfo(status, deliveryType);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
        <span style={{
          background: info.bg,
          color: info.color,
          border: `1px solid ${info.border}`,
          padding: '0.4rem 1rem',
          borderRadius: '12px',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          display: 'inline-flex',
          alignItems: 'center'
        }}>
          {info.text}
        </span>
        <span style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'left', fontWeight: '500' }}>
          💡 {info.desc}
        </span>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', marginBottom: '2rem', padding: '0.5rem' }}>
        <ArrowLeft size={20} /> عودة للرئيسية
      </button>

      <div style={{ background: 'white', padding: '2.5rem 2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '1.8rem', fontWeight: 'bold' }}>الاستعلام عن الطلبات</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1rem', fontSize: '1.05rem' }}>أدخل رقم الهاتف الذي استخدمته عند تسجيل الطلب:</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input type="tel" placeholder="رقم الهاتف..." value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9+]/g, ''))} maxLength={15} style={{ flex: '1 1 250px', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1.1rem', textAlign: 'right' }} dir={phone ? 'ltr' : 'rtl'} />
          <button onClick={handleSearch} disabled={loading} style={{ flex: '1 1 150px', background: '#f1f5f9', color: 'var(--primary)', border: 'none', padding: '1rem 2.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
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
                    {renderStatusBadgeWithDesc(order.status, order.delivery_type)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem 1rem', marginBottom: '1.5rem', background: '#f8fafc', borderRadius: '10px', padding: '1rem', border: '1px solid #e2e8f0', fontSize: '0.95rem' }}>
                    <div><strong style={{ color: 'var(--primary)' }}>الاسم:</strong> {order.customer_name}</div>
                    <div><strong style={{ color: 'var(--primary)' }}>المدرسة:</strong> {order.school_name}</div>
                    <div><strong style={{ color: 'var(--primary)' }}>نوع المدرسة:</strong> {order.school_type}</div>
                    <div><strong style={{ color: 'var(--primary)' }}>نوع التعليم:</strong> {order.directorate}</div>
                    <div><strong style={{ color: 'var(--primary)' }}>المحافظة:</strong> {order.governorate}</div>
                    {order.district && <div><strong style={{ color: 'var(--primary)' }}>اللواء:</strong> {order.district}</div>}
                    {order.phone2 && <div><strong style={{ color: 'var(--primary)' }}>هاتف بديل:</strong> {order.phone2}</div>}
                    <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #cbd5e1', paddingTop: '0.6rem', marginTop: '0.25rem' }}>
                      <strong style={{ color: 'var(--primary)' }}>الاستلام:</strong>{' '}
                      {order.delivery_type === 1 ? 'توصيل 🚚' : 'استلام من المكتبة 🏪'}
                    </div>
                    {order.delivery_type === 1 && order.school_location && (
                      <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: 'var(--primary)' }}>عنوان المدرسة:</strong> {order.school_location.includes(' - ') ? order.school_location : `${order.governorate} - ${order.school_location}`}</div>
                    )}
                    {order.delivery_type === 1 && order.home_location && (
                      <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: 'var(--primary)' }}>عنوان البيت:</strong> {order.home_location.includes(' - ') ? order.home_location : `${order.governorate} - ${order.home_location}`}</div>
                    )}
                    <div style={{ gridColumn: '1 / -1', color: '#64748b', fontSize: '0.85rem' }}>
                      <strong style={{ color: 'var(--primary)' }}>التاريخ:</strong>{' '}
                      <span dir="ltr">{new Date(order.created_at).toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {order.order_items && order.order_items.length > 0 && (
                      <div style={{ marginTop: '1rem', background: '#f8fafc', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                        <h5 style={{ margin: '0 0 1rem 0', color: 'var(--primary)', fontSize: '1.05rem' }}>تفاصيل الطلب:</h5>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#64748b' }}>
                                <th style={{ textAlign: 'right', padding: '0.5rem' }}>المعلم</th>
                                <th style={{ textAlign: 'right', padding: '0.5rem' }}>المادة</th>
                                <th style={{ textAlign: 'right', padding: '0.5rem' }}>الصف</th>
                                <th style={{ textAlign: 'right', padding: '0.5rem' }}>الخدمة</th>
                                <th style={{ textAlign: 'left', padding: '0.5rem' }}>السعر</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.order_items.map((item: any) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '0.5rem' }}>{item.teacher_name}</td>
                                  <td style={{ padding: '0.5rem' }}>{item.subject}</td>
                                  <td style={{ padding: '0.5rem' }}>{item.grade}</td>
                                  <td style={{ padding: '0.5rem' }}>
                                    {['الأول', 'الثاني', 'الثالث'].includes(item.grade) ? 'خطة وتحضير وتحليل' : item.service_type === 0 ? 'خطة' : item.service_type === 1 ? 'تحضير' : 'خطة وتحضير'}
                                  </td>
                                  <td style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 'bold' }}>{item.price} د.أ</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1' }}>
                          <span style={{ fontWeight: 'bold', color: '#475569' }}>خدمة التوصيل:</span>
                          <span style={{ fontWeight: 'bold', color: '#475569' }}>{order.delivery_cost} د.أ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.1rem' }}>التكلفة الإجمالية:</span>
                          <span style={{ fontWeight: 'bold', color: '#059669', fontSize: '1.1rem' }}>{order.total_amount} د.أ</span>
                        </div>
                      </div>
                    )}

                  {order.status === 0 ? (
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
  const [subjectGradesMap, setSubjectGradesMap] = useState<Record<string | number, string[]>>({});
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '', phone: '', phone2: '', schoolName: '', schoolType: '', directorate: '', governorate: '', district: '', otherDistrict: '', deliveryType: 'pickup', schoolDeliveryGov: '', schoolLocation: '', homeDeliveryGov: '', homeLocation: ''
  });
  const [teachers, setTeachers] = useState<Teacher[]>([{ id: 't1', name: '', items: [] }]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<Record<string, string[]>>({});

  const fetchFreshData = async () => {
    try {
      const { data: subData } = await supabase.from('subjects').select('*').order('name', { ascending: true });
      if (subData) {
        const sorted = subData.sort((a: any, b: any) => a.name.localeCompare(b.name, 'ar'));
        setDbSubjects(sorted);
      }

      const { data: gradesData } = await supabase.from('subject_grades').select('*');
      if (gradesData) {
        const map: Record<string, string[]> = {};
        gradesData.forEach((g: any) => {
          if (g.is_available !== false) {
            const key = String(g.subject_id);
            if (!map[key]) map[key] = [];
            map[key].push(g.grade_name);
          }
        });
        setSubjectGradesMap(map);
      }
    } catch (e) {
      console.error('Error fetching fresh subjects/grades:', e);
    }
  };

  useEffect(() => {
    fetchFreshData();

    supabase.from('locations').select('*').then(({ data }) => {
      if (data) {
        const map: Record<string, string[]> = {};
        data.forEach((loc: any) => {
          const districts = loc.districts.filter((d: string) => d !== 'أخرى' && d !== 'إضافة');
          map[loc.governorate] = districts;
        });
        setLocations(map);
      }
    });

    const channel = supabase.channel('storefront_fresh_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, fetchFreshData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subject_grades' }, fetchFreshData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCustomerChange = (e: any) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => {
      let finalValue = value;
      // Allow only numbers and plus sign for phone fields
      if (name === 'phone' || name === 'phone2') {
        finalValue = value.replace(/[^0-9+]/g, '');
        if (finalValue.startsWith('07') && finalValue.length > 10) {
          finalValue = finalValue.slice(0, 10);
        }
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
    const subject = dbSubjects.find((s: any) => s.name === subjectName);
    if (!subject) return;

    const planP = Number(subject.plan_price) || 0;
    const prepP = Number(subject.prep_price) || 0;
    const defaultServiceType = (planP > 0 && prepP > 0) ? 'both' : (planP > 0 ? 'plan' : 'prep');

    setTeachers(prevTeachers => prevTeachers.map(t => {
      if (t.id !== teacherId) return t;
      const existing = t.items.find(i => i.subjectId === subject.id);
      if (existing) return { ...t, items: t.items.filter(i => i.subjectId !== subject.id) };
      const newItemId = Math.random().toString();
      setExpandedItems(prev => [...prev, newItemId]);
      return { ...t, items: [...t.items, { id: newItemId, subjectId: subject.id, grades: [], serviceType: defaultServiceType }] };
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

        const effectiveServiceType = (subject.plan_price > 0 && subject.prep_price > 0)
          ? item.serviceType
          : (subject.plan_price > 0 ? 'plan' : 'prep');

        item.grades.forEach(g => {
          if (['الأول', 'الثاني', 'الثالث'].includes(g)) {
            total += 7; // Fixed package price
          } else {
            if (effectiveServiceType === 'plan' || effectiveServiceType === 'both') total += subject.plan_price;
            if (effectiveServiceType === 'prep' || effectiveServiceType === 'both') total += subject.prep_price;
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

  const isDeliveryValid = customerInfo.deliveryType === 'pickup' || (customerInfo.deliveryType === 'delivery' && customerInfo.schoolDeliveryGov && customerInfo.schoolLocation && customerInfo.homeDeliveryGov && customerInfo.homeLocation);
  const isPrivate = customerInfo.directorate === 'التعليم الخاص';
  const isNameValid = customerInfo.name && customerInfo.name.trim().split(/\s+/).length >= 2;
  const isSchoolNameValid = customerInfo.schoolName && customerInfo.schoolName.trim().split(/\s+/).length >= 3;
  const isPhoneValid = customerInfo.phone && (!customerInfo.phone.startsWith('07') || customerInfo.phone.length === 10);
  const isPhone2Valid = customerInfo.phone2 && (!customerInfo.phone2.startsWith('07') || customerInfo.phone2.length === 10);
  const isStep1Valid = isNameValid && isSchoolNameValid && isPhoneValid && isPhone2Valid && customerInfo.schoolType && customerInfo.directorate && customerInfo.governorate && (isPrivate || (customerInfo.district && (customerInfo.district !== 'إضافة' || customerInfo.otherDistrict))) && isDeliveryValid;
  const isStep2Valid = teachers.every(t => t.name && t.name.trim().split(/\s+/).length >= 2 && t.items.length > 0 && t.items.every(i => i.grades.length > 0));
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
                <label className="form-label" style={{ textAlign: 'right' }}>رقم هاتف آخر <span style={{ color: 'red' }}>*</span></label>
                <input className="form-input" type="tel" name="phone2" value={customerInfo.phone2} onChange={handleCustomerChange} maxLength={15} placeholder="079XXXXXXX (رقم هاتف بديل)" dir={customerInfo.phone2 ? 'ltr' : 'rtl'} style={{ textAlign: 'right' }} />
              </div>
            </div>
            {/* نوع التعليم */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ textAlign: 'right' }}>نوع التعليم <span style={{ color: 'red' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem' }}>
                <div
                  onClick={() => setCustomerInfo({ ...customerInfo, directorate: 'التعليم الحكومي', district: '', otherDistrict: '' })}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.9rem', border: customerInfo.directorate === 'التعليم الحكومي' ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', background: customerInfo.directorate === 'التعليم الحكومي' ? 'rgba(79,70,229,0.06)' : 'white', fontWeight: 'bold', color: customerInfo.directorate === 'التعليم الحكومي' ? 'var(--primary)' : 'var(--text)', transition: '0.2s', fontSize: '0.9rem' }}
                >
                  🏫 تعليم حكومي
                </div>
                <div
                  onClick={() => setCustomerInfo({ ...customerInfo, directorate: 'التعليم الخاص', district: '', otherDistrict: '' })}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.9rem', border: customerInfo.directorate === 'التعليم الخاص' ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', background: customerInfo.directorate === 'التعليم الخاص' ? 'rgba(79,70,229,0.06)' : 'white', fontWeight: 'bold', color: customerInfo.directorate === 'التعليم الخاص' ? 'var(--primary)' : 'var(--text)', transition: '0.2s', fontSize: '0.9rem' }}
                >
                  🏛️ تعليم خاص
                </div>
                <div
                  onClick={() => setCustomerInfo({ ...customerInfo, directorate: 'التعليم العسكري', district: '', otherDistrict: '' })}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.9rem', border: customerInfo.directorate === 'التعليم العسكري' ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', background: customerInfo.directorate === 'التعليم العسكري' ? 'rgba(79,70,229,0.06)' : 'white', fontWeight: 'bold', color: customerInfo.directorate === 'التعليم العسكري' ? 'var(--primary)' : 'var(--text)', transition: '0.2s', fontSize: '0.9rem' }}
                >
                  🎖️ تعليم عسكري
                </div>
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
                <label className="form-label" style={{ textAlign: 'right' }}>اللواء / المنطقة {!isPrivate && <span style={{ color: 'red' }}>*</span>}{isPrivate && <span style={{ color: '#64748b', fontWeight: 'normal', fontSize: '0.85rem' }}> (اختياري)</span>}</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                  <div style={{ flex: 1 }}>
                    <SearchableSelect 
                      options={customerInfo.governorate ? locations[customerInfo.governorate] : []} 
                      value={customerInfo.district === 'إضافة' ? '' : customerInfo.district} 
                      onChange={(val: string) => setCustomerInfo({...customerInfo, district: val, otherDistrict: ''})} 
                      placeholder={isPrivate ? 'اختياري - ابحث لاختيار لواء...' : 'ابحث لاختيار لواء...'} 
                      disabled={!customerInfo.governorate} 
                      allowAdd={false} 
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setCustomerInfo({...customerInfo, district: customerInfo.district === 'إضافة' ? '' : 'إضافة', otherDistrict: ''})}
                    disabled={!customerInfo.governorate}
                    style={{
                      background: customerInfo.district === 'إضافة' ? 'var(--primary)' : 'white',
                      color: customerInfo.district === 'إضافة' ? 'white' : 'var(--primary)',
                      border: '1px solid var(--primary)',
                      borderRadius: '8px',
                      padding: '0 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: customerInfo.governorate ? 'pointer' : 'not-allowed',
                      opacity: customerInfo.governorate ? 1 : 0.6,
                      minHeight: '42px'
                    }}
                    title="إضافة لواء جديد"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {customerInfo.district === 'إضافة' && (
              <div className="form-group" style={{ marginBottom: '1.5rem', marginTop: '0.5rem' }}>
                <label className="form-label" style={{ textAlign: 'right' }}>اسم اللواء / المنطقة الجديد <span style={{ color: 'red' }}>*</span></label>
                <input className="form-input" type="text" name="otherDistrict" value={customerInfo.otherDistrict} onChange={handleCustomerChange} maxLength={50} placeholder="اكتب اسم اللواء/المنطقة هنا..." />
              </div>
            )}
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
                  <span><strong>ملاحظة:</strong> سوف يتم توصيل طلبك خلال 48 - 72 ساعة.</span>
                </div>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--primary)', fontSize: '1.1rem' }}>تفاصيل العنوان الدقيق للتوصيل</h3>
                <div className="form-group">
                  <label>
                    العنوان بالتفصيل (مكان المدرسة) <span style={{ color: 'red' }}>*</span>
                    <div style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '0.25rem', fontWeight: 'normal' }}>
                      * يرجى اختيار المحافظة وكتابة تفاصيل الموقع بالكامل (المنطقة، الشارع) لتسهيل وتسريع التوصيل
                    </div>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginTop: '0.5rem' }}>
                    <SearchableSelect
                      options={Object.keys(locations)}
                      value={customerInfo.schoolDeliveryGov}
                      onChange={(val: string) => setCustomerInfo({ ...customerInfo, schoolDeliveryGov: val })}
                      placeholder="اختر المحافظة"
                    />
                    <input className="form-input" type="text" name="schoolLocation" value={customerInfo.schoolLocation} onChange={handleCustomerChange} maxLength={200} placeholder="مثال: طبربور، بجانب مسجد التقوى" />
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    العنوان بالتفصيل (مكان البيت) <span style={{ color: 'red' }}>*</span>
                    <div style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '0.25rem', fontWeight: 'normal' }}>
                      * يرجى اختيار المحافظة وكتابة تفاصيل الموقع بالكامل (المنطقة، الشارع) لتسهيل وتسريع التوصيل
                    </div>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginTop: '0.5rem' }}>
                    <SearchableSelect
                      options={Object.keys(locations)}
                      value={customerInfo.homeDeliveryGov}
                      onChange={(val: string) => setCustomerInfo({ ...customerInfo, homeDeliveryGov: val })}
                      placeholder="اختر المحافظة"
                    />
                    <input className="form-input" type="text" name="homeLocation" value={customerInfo.homeLocation} onChange={handleCustomerChange} maxLength={200} placeholder="مثال: حي الزهور، عمارة رقم 5" />
                  </div>
                </div>
              </div>
            )}

            {!isStep1Valid && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <p style={{ color: '#ef4444', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>الرجاء إكمال/تصحيح الحقول التالية للمتابعة:</p>
                <ul style={{ color: '#ef4444', margin: 0, paddingRight: '1.5rem', fontSize: '0.9rem' }}>
                  {!isNameValid && <li>الاسم الكامل (يجب أن يتكون من مقطعين على الأقل)</li>}
                  {!customerInfo.phone && <li>رقم الهاتف الأساسي</li>}
                  {customerInfo.phone && customerInfo.phone.startsWith('07') && customerInfo.phone.length !== 10 && <li>رقم الهاتف الأساسي (يجب أن يكون 10 خانات)</li>}
                  {!customerInfo.phone2 && <li>رقم الهاتف الآخر (البديل إجباري)</li>}
                  {customerInfo.phone2 && customerInfo.phone2.startsWith('07') && customerInfo.phone2.length !== 10 && <li>رقم الهاتف الآخر (يجب أن يكون 10 خانات)</li>}
                  {!isSchoolNameValid && <li>اسم المدرسة (يجب أن يتكون من 3 مقاطع على الأقل)</li>}
                  {!customerInfo.schoolType && <li>نوع المدرسة</li>}
                  {!customerInfo.directorate && <li>نوع التعليم</li>}
                  {!customerInfo.governorate && <li>المحافظة</li>}
                  {!isPrivate && !customerInfo.district && <li>اللواء / المنطقة</li>}
                  {!isPrivate && customerInfo.district === 'إضافة' && !customerInfo.otherDistrict && <li>اسم اللواء / المنطقة الجديد</li>}
                  {customerInfo.deliveryType === 'delivery' && (!customerInfo.schoolDeliveryGov || !customerInfo.schoolLocation || !customerInfo.homeDeliveryGov || !customerInfo.homeLocation) && <li>تفاصيل عنوان التوصيل (المحافظة والمنطقة)</li>}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.1rem' }}>
                    اسم المعلم {teachers.length > 1 ? `#${index + 1}` : ''}:
                  </label>
                  {teachers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTeacher(teacher.id)}
                      style={{
                        background: '#fef2f2',
                        color: '#ef4444',
                        border: '1px solid #fecaca',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                      title="حذف هذا المعلم"
                    >
                      <Trash2 size={16} /> حذف المعلم
                    </button>
                  )}
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
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
                  
                  const planPrice = subject ? (Number(subject.plan_price) || 0) : 0;
                  const prepPrice = subject ? (Number(subject.prep_price) || 0) : 0;

                  const effectiveServiceType = subject
                    ? ((planPrice > 0 && prepPrice > 0) ? item.serviceType : (planPrice > 0 ? 'plan' : 'prep'))
                    : item.serviceType;

                  let subjectTotal = 0;
                  item.grades.forEach(g => {
                    if (['الأول', 'الثاني', 'الثالث'].includes(g)) {
                      subjectTotal += 7;
                    } else if (subject) {
                      if (effectiveServiceType === 'plan' || effectiveServiceType === 'both') subjectTotal += planPrice;
                      if (effectiveServiceType === 'prep' || effectiveServiceType === 'both') subjectTotal += prepPrice;
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
                            <MultiSelect options={(subject && subjectGradesMap[String(subject.id)] && subjectGradesMap[String(subject.id)].length > 0) ? subjectGradesMap[String(subject.id)] : GRADES} selected={item.grades} onChange={(val: any) => updateItemGrades(teacher.id, item.id, val)} placeholder="اختر الصفوف..." hasError={hasError} />
                            {hasError && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 'bold', textAlign: 'right' }}>يرجى اختيار صف واحد على الأقل للمادة</div>}
                          </div>

                          {!hasPackageGrades && subject && (
                            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                              <label style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '1rem', display: 'block' }}>الخدمة المطلوبة للصف الواحد:</label>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {planPrice > 0 && prepPrice > 0 && (
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input type="radio" name={`service_${item.id}`} checked={effectiveServiceType === 'both'} onChange={() => updateItemServiceType(teacher.id, item.id, 'both')} /> 
                                    خطة + تحضير ({planPrice + prepPrice} د.أ)
                                  </label>
                                )}
                                {planPrice > 0 && (
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input type="radio" name={`service_${item.id}`} checked={effectiveServiceType === 'plan'} onChange={() => updateItemServiceType(teacher.id, item.id, 'plan')} /> 
                                    خطة فقط ({planPrice} د.أ)
                                  </label>
                                )}
                                {prepPrice > 0 && (
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input type="radio" name={`service_${item.id}`} checked={effectiveServiceType === 'prep'} onChange={() => updateItemServiceType(teacher.id, item.id, 'prep')} /> 
                                    تحضير فقط ({prepPrice} د.أ)
                                  </label>
                                )}
                              </div>
                            </div>
                          )}

                          {hasPackageGrades && (
                            <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '8px', color: '#92400e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                              <Package size={20} />
                              <span>الصفوف (الأول، الثاني، الثالث) تعتبر بكج بسعر 7 دنانير ثابتة للصف الواحد وتشمل <strong style={{ color: '#1e3a8a', fontWeight: 'bold' }}>خطة وتحضير وتحليل</strong>.</span>
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
                  {teachers.some(t => !t.name || t.name.trim().split(/\s+/).length < 2) && <li>إدخال أسماء جميع المعلمين (يجب أن يكون كل اسم من مقطعين على الأقل)</li>}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.5rem', marginBottom: '2.5rem', fontSize: '0.95rem', background: '#f8fafc', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border)' }}>
              <div><strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>الاسم:</strong> {customerInfo.name}</div>
              <div><strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>الهاتف:</strong> {customerInfo.phone}</div>
              {customerInfo.phone2 && <div><strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>هاتف بديل:</strong> {customerInfo.phone2}</div>}
              <div><strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>المدرسة:</strong> {customerInfo.schoolName}</div>
              <div><strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>نوع المدرسة:</strong> {customerInfo.schoolType}</div>
              <div><strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>نوع التعليم:</strong> {customerInfo.directorate}</div>
              <div><strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>المحافظة:</strong> {customerInfo.governorate}</div>
              {customerInfo.district && customerInfo.district !== 'إضافة' && (
                <div><strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>اللواء / المنطقة:</strong> {customerInfo.district}</div>
              )}
              {customerInfo.district === 'إضافة' && customerInfo.otherDistrict && (
                <div><strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>اللواء / المنطقة:</strong> {customerInfo.otherDistrict}</div>
              )}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #cbd5e1', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>طريقة الاستلام:</strong>
                {customerInfo.deliveryType === 'delivery' ? ' توصيل 🚚' : ' استلام من المكتبة 🏪'}
              </div>
              {customerInfo.deliveryType === 'delivery' && customerInfo.schoolLocation && (
                <div><strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>عنوان المدرسة:</strong> {customerInfo.schoolDeliveryGov} - {customerInfo.schoolLocation}</div>
              )}
              {customerInfo.deliveryType === 'delivery' && customerInfo.homeLocation && (
                <div><strong style={{ color: 'var(--primary)', paddingLeft: '0.5rem' }}>عنوان البيت:</strong> {customerInfo.homeDeliveryGov} - {customerInfo.homeLocation}</div>
              )}
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
                <span style={{ color: '#0369a1', fontWeight: 'bold' }}>سوف يتم توصيل طلبك خلال 48 - 72 ساعة.</span>
              )}
            </p>

            <a href="tel:0777775306" className="phone-contact" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold', marginBottom: '3rem', fontSize: '1.1rem', border: '1px solid var(--border)' }}>
              <span>للملاحظات يرجى الاتصال على هذا الرقم:</span>
              <span dir="ltr" style={{ color: '#dc2626', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📞 0777775306</span>
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
