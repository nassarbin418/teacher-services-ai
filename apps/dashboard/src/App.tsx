import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { Search, Download, ChevronDown, ChevronUp, Clock, Package, Bell, BookOpen, Plus, Trash2, CheckCircle2, Calendar } from 'lucide-react';
import { exportOrderToExcel } from './utils/exportToExcel';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState<'orders' | 'subjects'>('orders');

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  // Subjects State
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectGrades, setSubjectGrades] = useState<Record<string, string[]>>({});
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', plan_price: 2, prep_price: 3 });
  const [editingSubject, setEditingSubject] = useState<string | number | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | number | null>(null);

  const AVAILABLE_GRADES = [
    'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس',
    'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر (أكاديمي)', 'الثاني عشر (أكاديمي)'
  ];

  // Orders Pagination State
  const [ordersPage, setOrdersPage] = useState(1);
  const ordersPerPage = 10;

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string, type: 'new' | 'update' | 'error' | 'success' } | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pagination for Notifications
  const [notifPage, setNotifPage] = useState(0);
  const [hasMoreNotifs, setHasMoreNotifs] = useState(true);

  const showToast = (message: string, type: 'new' | 'update' | 'error' | 'success' = 'update') => {
    setToast({ message, type });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 4000);
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (*)`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const { data, error } = await supabase.from('subjects').select('*').order('name', { ascending: true });
      if (error) throw error;
      const sorted = (data || []).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      setSubjects(sorted);

      const { data: gradesData, error: gradesError } = await supabase.from('subject_grades').select('*');
      if (!gradesError && gradesData) {
        const gradesMap: Record<string, string[]> = {};
        gradesData.forEach(g => {
          if (g.is_available !== false) {
            if (!gradesMap[g.subject_id]) gradesMap[g.subject_id] = [];
            gradesMap[g.subject_id].push(g.grade_name);
          }
        });
        setSubjectGrades(gradesMap);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      showToast('فشل جلب المواد، تأكد من قاعدة البيانات', 'error');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchNotifications = async (page = 0, append = false) => {
    try {
      const limit = 10;
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);
      if (error) throw error;
      if (data) {
        if (append) {
          setNotifications(prev => [...prev, ...data]);
        } else {
          setNotifications(data);
        }
        setHasMoreNotifs(data.length === limit);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const loadMoreNotifs = () => {
    const nextPage = notifPage + 1;
    setNotifPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const markNotifAsRead = async (id: number) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllNotifsAsRead = async () => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.4);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio playback error:', e);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSubjects();
    fetchNotifications();

    // Subscribe to real-time changes for Orders
    const ordersChannel = supabase
      .channel('orders_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders(); // Refresh orders on any change
      })
      .subscribe();

    // Subscribe to real-time changes for Notifications
    const notifChannel = supabase
      .channel('notif_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        playNotificationSound();

        const newNotif = payload.new;
        setNotifications(prev => [newNotif, ...prev]);

        // Show Toast
        setToast({ message: newNotif.message, type: newNotif.type as any });
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setToast(null), 5000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(notifChannel);
    };
  }, []);

  useEffect(() => {
    setOrdersPage(1);
  }, [searchTerm, statusFilter, dateFilter, sortOrder]);

  const updateOrderStatus = async (orderId: number, newStatus: number, deliveryType: number, deliveryPerson: string | null) => {
    try {
      if (newStatus === 2 && deliveryType === 1 && (!deliveryPerson || deliveryPerson.trim() === '')) {
        showToast('يجب إدخال اسم المندوب في حال كان الطلب جاهز للتوصيل', 'error');
        return;
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Insert Notification
      const statuses = [
        'جديد',
        'قيد الطباعة والمعالجة',
        'جاهز للتوصيل / الاستلام',
        'مكتمل / تم التسليم',
        'مرفوض من الإدارة',
        'مرفوض من المعلم'
      ];
      await supabase.from('notifications').insert({
        message: `تم تغيير حالة الطلب #${orderId} إلى ${statuses[newStatus] || 'مجهول'}`,
        type: 'update',
        order_id: orderId
      });

      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('خطأ في تحديث الحالة', 'error');
    }
  };

  const updateDeliveryPerson = async (orderId: number, personName: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_person: personName })
        .eq('id', orderId);
      if (error) throw error;
      showToast('تم حفظ اسم المندوب بنجاح', 'success');
    } catch (err) {
      showToast('خطأ في حفظ اسم المندوب', 'error');
    }
  };

  const handleExport = async (order: any) => {
    await exportOrderToExcel(order, order.order_items || []);
    // When exporting/printing a new order (status === 0), auto transition to status 1 (قيد الطباعة والمعالجة)
    if (Number(order.status) === 0) {
      await updateOrderStatus(order.id, 1, order.delivery_type, order.delivery_person);
    }
  };

  // Subjects Management functions
  const handleAddSubject = async () => {
    if (!newSubject.name) return showToast('الرجاء إدخال اسم المادة', 'error');
    if (newSubject.plan_price === 0 && newSubject.prep_price === 0) {
      return showToast('لازم تعبي الاسعار او واحدة على الاقل', 'error');
    }
    
    try {
      const { data, error } = await supabase.from('subjects').insert(newSubject).select();
      if (error) throw error;
      if (data && data.length > 0) {
        const addedSub = data[0];
        setSubjects(prev => [...prev, addedSub].sort((a, b) => a.name.localeCompare(b.name, 'ar')));

        // Insert default grades for the new subject
        const gradesToInsert = AVAILABLE_GRADES.map(g => ({
          subject_id: addedSub.id,
          grade_name: g,
          is_available: true
        }));
        await supabase.from('subject_grades').upsert(gradesToInsert, { onConflict: 'subject_id,grade_name' });
        setSubjectGrades(prev => ({ ...prev, [addedSub.id]: AVAILABLE_GRADES }));
      }
      setNewSubject({ name: '', plan_price: 2, prep_price: 3 });
      showToast('تمت إضافة المادة بنجاح', 'success');
    } catch (err) {
      console.error(err);
      showToast('خطأ في إضافة المادة', 'error');
    }
  };

  const handleEditSubject = async (subjectId: string | number, field: string, value: any, currentSubject: any) => {
    try {
      if (field === 'plan_price' && value === 0 && currentSubject.prep_price === 0) {
        return showToast('لازم تعبي الاسعار او واحدة على الاقل', 'error');
      }
      if (field === 'prep_price' && value === 0 && currentSubject.plan_price === 0) {
        return showToast('لازم تعبي الاسعار او واحدة على الاقل', 'error');
      }

      const { error } = await supabase.from('subjects').update({ [field]: value }).eq('id', subjectId);
      if (error) throw error;
      setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, [field]: value } : s).sort((a, b) => a.name.localeCompare(b.name, 'ar')));
      showToast('تم التعديل بنجاح', 'success');
    } catch (err) {
      console.error(err);
      showToast('خطأ في تعديل المادة', 'error');
    }
  };

  const handleDeleteSubject = async (subject: any) => {
    if (!window.confirm(`هل أنت متأكد من حذف المادة "${subject.name}"؟`)) return;

    // Check if subject is used in any orders
    try {
      const { data, error: checkError } = await supabase
        .from('order_items')
        .select('id')
        .eq('subject', subject.name)
        .limit(1);

      if (checkError) throw checkError;

      if (data && data.length > 0) {
        return showToast('لا يمكن حذف هذه المادة لأنها مرتبطة بطلبات موجودة.', 'error');
      }

      const { error } = await supabase.from('subjects').delete().eq('id', subject.id);
      if (error) throw error;
      setSubjects(subjects.filter(s => s.id !== subject.id));
      showToast('تم حذف المادة بنجاح', 'success');
    } catch (err) {
      console.error(err);
      showToast('خطأ في حذف المادة', 'error');
    }
  };

  const toggleGrade = async (subjectId: string | number, gradeName: string) => {
    try {
      const current = subjectGrades[subjectId] || [];
      const hasGrade = current.includes(gradeName);

      // Validation: Ensure at least one grade remains selected for the subject
      if (hasGrade && current.length === 1) {
        showToast('يجب اختيار صف واحد على الأقل للمادة', 'error');
        return;
      }
      
      const newStatus = !hasGrade;
      
      const { error } = await supabase.from('subject_grades').upsert(
        { subject_id: subjectId, grade_name: gradeName, is_available: newStatus },
        { onConflict: 'subject_id,grade_name' }
      );

      if (error) throw error;

      if (newStatus) {
        setSubjectGrades({ ...subjectGrades, [subjectId]: [...current, gradeName] });
      } else {
        setSubjectGrades({ ...subjectGrades, [subjectId]: current.filter(g => g !== gradeName) });
      }
    } catch (err) {
      console.error(err);
      showToast('خطأ في تحديث الصفوف', 'error');
    }
  };

  const checkIsDuplicateOrder = (order: any, allOrders: any[]) => {
    if (!order || !order.phone || !order.order_items || order.order_items.length === 0) return false;

    const cleanPhone = order.phone.trim();
    const otherOrders = allOrders.filter(o =>
      o.id !== order.id &&
      o.phone &&
      o.phone.trim() === cleanPhone &&
      o.status !== 3 &&
      o.status !== 4 &&
      o.order_items &&
      o.order_items.length > 0
    );

    if (otherOrders.length === 0) return false;

    for (const item of order.order_items) {
      const teacher = (item.teacher_name || '').trim().toLowerCase();
      const subject = (item.subject || '').trim().toLowerCase();
      const grade = (item.grade || '').trim().toLowerCase();

      for (const otherOrder of otherOrders) {
        for (const otherItem of otherOrder.order_items) {
          const oTeacher = (otherItem.teacher_name || '').trim().toLowerCase();
          const oSubject = (otherItem.subject || '').trim().toLowerCase();
          const oGrade = (otherItem.grade || '').trim().toLowerCase();

          if (teacher === oTeacher && subject === oSubject && grade === oGrade) {
            return true;
          }
        }
      }
    }

    return false;
  };

  const filteredOrders = orders.filter(order => {
    const formattedDate = order.created_at ? new Date(order.created_at).toLocaleDateString('ar-EG') : '';
    const isoDate = order.created_at ? order.created_at.slice(0, 10) : '';

    const term = searchTerm.trim().toLowerCase();
    const cleanTerm = term.replace(/^#/, '');

    const matchesItems = order.order_items && Array.isArray(order.order_items) && order.order_items.some((item: any) =>
      item.teacher_name?.toLowerCase().includes(term) ||
      item.subject?.toLowerCase().includes(term) ||
      item.grade?.toLowerCase().includes(term)
    );

    const matchesSearch = !term ||
      order.customer_name?.toLowerCase().includes(term) ||
      order.id.toString().includes(cleanTerm) ||
      (`#${order.id}`).includes(term) ||
      order.phone?.includes(term) ||
      order.phone2?.includes(term) ||
      isoDate.includes(term) ||
      formattedDate.includes(term) ||
      matchesItems;

    const matchesStatus = statusFilter === 'all' || order.status.toString() === statusFilter;
    const matchesDate = !dateFilter || isoDate === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  }).sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  const totalOrdersPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
  const activeOrdersPage = ordersPage > totalOrdersPages ? 1 : ordersPage;
  const currentOrders = filteredOrders.slice((activeOrdersPage - 1) * ordersPerPage, activeOrdersPage * ordersPerPage);

  const renderToast = () => {
    if (!toast) return null;
    let bgColor = 'white';
    let borderColor = '#3b82f6';
    let icon = <Clock color="#3b82f6" />;
    let title = 'تحديث حالة';

    if (toast.type === 'new') { bgColor = '#ecfdf5'; borderColor = '#10b981'; icon = <Package color="#10b981" />; title = 'طلب جديد!'; }
    else if (toast.type === 'success') { bgColor = '#ecfdf5'; borderColor = '#10b981'; icon = <CheckCircle2 color="#10b981" />; title = 'نجاح'; }
    else if (toast.type === 'error') { bgColor = '#fef2f2'; borderColor = '#ef4444'; icon = <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.2rem', padding: '0 8px' }}>!</span>; title = 'خطأ'; }

    return (
      <div className="fade-in" style={{
        background: bgColor, padding: '1rem 1.5rem',
        borderRadius: '12px', border: `1px solid ${borderColor}`,
        borderRight: `6px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', gap: '1rem',
        marginBottom: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        {icon}
        <div>
          <strong style={{ display: 'block', color: 'var(--text)', fontSize: '1rem' }}>{title}</strong>
          <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.9rem' }}>{toast.message}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container" dir="rtl">
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="لوحة التحكم" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
            <h1 style={{ color: 'var(--primary)', margin: 0 }}>لوحة تحكم الإدارة</h1>
          </div>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setActiveTab('orders')}
              className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1.5rem' }}
            >
              <Package size={20} /> الطلبات
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`btn ${activeTab === 'subjects' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1.5rem' }}
            >
              <BookOpen size={20} /> إدارة المواد
            </button>
          </nav>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            style={{ position: 'relative', background: 'white', padding: '0.75rem', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={24} color="var(--primary)" />
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)',
                color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold'
              }}>
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute', top: '120%', left: 0, width: '350px', background: 'white',
              borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '1.5rem',
              zIndex: 1000, maxHeight: '400px', overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                  <Clock size={20} /> سجل الإشعارات
                </h3>
                {notifications.some(n => !n.is_read) && (
                  <button
                    onClick={markAllNotifsAsRead}
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <CheckCircle2 size={16} /> مقروء للكل
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p style={{ color: 'var(--text-light)', textAlign: 'center', marginTop: '1rem' }}>لا توجد إشعارات حالياً</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {notifications.map(notif => (
                    <div key={notif.id}
                      onClick={() => { if (!notif.is_read) markNotifAsRead(notif.id); }}
                      style={{
                        padding: '1rem', borderRadius: '8px', cursor: notif.is_read ? 'default' : 'pointer',
                        background: notif.is_read ? '#f8fafc' : (notif.type === 'new' ? '#ecfdf5' : '#eff6ff'),
                        borderRight: `4px solid ${notif.is_read ? '#cbd5e1' : (notif.type === 'new' ? '#10b981' : '#3b82f6')}`,
                        opacity: notif.is_read ? 0.7 : 1
                      }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', fontWeight: notif.is_read ? 'normal' : 'bold' }}>{notif.message}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem', display: 'block' }}>
                        {new Date(notif.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {hasMoreNotifs && (
                    <button
                      onClick={loadMoreNotifs}
                      style={{ background: '#f1f5f9', border: 'none', color: 'var(--primary)', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '0.5rem' }}
                    >
                      عرض المزيد
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="dashboard-main">
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderBottom: '4px solid #94a3b8' }}>
                <h3 style={{ color: 'var(--text-light)', fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>إجمالي الطلبات</h3>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)', margin: 0 }}>{orders.length}</p>
              </div>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderBottom: '4px solid #ef4444' }}>
                <h3 style={{ color: 'var(--text-light)', fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>جديد</h3>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444', margin: 0 }}>{orders.filter(o => o.status === 0).length}</p>
              </div>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderBottom: '4px solid #f59e0b' }}>
                <h3 style={{ color: 'var(--text-light)', fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>قيد الطباعة</h3>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>{orders.filter(o => o.status === 1).length}</p>
              </div>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderBottom: '4px solid #9333ea' }}>
                <h3 style={{ color: 'var(--text-light)', fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>جاهز للتوصيل/الاستلام</h3>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#9333ea', margin: 0 }}>{orders.filter(o => o.status === 2).length}</p>
              </div>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderBottom: '4px solid #10b981' }}>
                <h3 style={{ color: 'var(--text-light)', fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>مكتمل</h3>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>{orders.filter(o => o.status === 3).length}</p>
              </div>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderBottom: '4px solid #ef4444' }}>
                <h3 style={{ color: 'var(--text-light)', fontSize: '0.95rem', margin: '0 0 0.5rem 0' }}>المرفوضة</h3>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444', margin: 0 }}>{orders.filter(o => o.status === 4 || o.status === 5).length}</p>
              </div>
            </div>

            <div className="filters-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="search-box" style={{ flex: '1 1 250px' }}>
                <Search size={20} color="#64748b" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، رقم الطلب، الهاتف، التاريخ..."
                  maxLength={50}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <Calendar size={18} color="#64748b" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', cursor: 'pointer' }}
                  title="تصفية حسب تاريخ محدد"
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                    title="مسح تصفية التاريخ"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="filter-select" style={{ display: 'flex', alignItems: 'center' }}>
                <select className="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ height: '100%' }}>
                  <option value="all">جميع الحالات</option>
                  <option value="0">جديد</option>
                  <option value="1">قيد الطباعة والمعالجة</option>
                  <option value="2">جاهز للتوصيل / الاستلام</option>
                  <option value="3">مكتمل / تم التسليم</option>
                  <option value="4">مرفوض من الإدارة</option>
                  <option value="5">مرفوض من المعلم</option>
                </select>
              </div>

              <div className="filter-select" style={{ display: 'flex', alignItems: 'center' }}>
                <select className="status-filter" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')} style={{ height: '100%' }}>
                  <option value="asc">الترتيب: من الأقدم للأحدث ⬆</option>
                  <option value="desc">الترتيب: من الأحدث للأقدم ⬇</option>
                </select>
              </div>
            </div>

            {renderToast()}

            <div className="table-container">
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>جاري تحميل الطلبات...</div>
              ) : filteredOrders.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>لا يوجد طلبات تطابق بحثك.</div>
              ) : (
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>رقم الطلب</th>
                      <th>تاريخ الطلب</th>
                      <th>اسم العميل</th>
                      <th>رقم الهاتف</th>
                      <th>نوع التوصيل</th>
                      <th>السعر الإجمالي</th>
                      <th>اسم المندوب</th>
                      <th>الحالة</th>
                      <th>تصدير</th>
                      <th>تفاصيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.map((order) => (
                      <React.Fragment key={order.id}>
                        <tr className={expandedOrder === order.id ? 'expanded-row' : ''}>
                          <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>#{order.id}</td>
                          <td dir="ltr" style={{ textAlign: 'right' }}>{new Date(order.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td>{order.customer_name}</td>
                          <td dir="ltr" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <span>{order.phone}</span>
                            {checkIsDuplicateOrder(order, orders) && (
                              <span
                                style={{
                                  marginRight: '0.4rem',
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  border: '1px solid #fca5a5',
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem'
                                }}
                                title="يوجد طلب آخر نشط بنفس رقم الهاتف يحتوي على نفس المعلم والمادة والصف"
                              >
                                ⚠️ طلب مكرر
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${order.delivery_type === 1 ? 'delivery' : 'pickup'}`}>
                              {order.delivery_type === 1 ? 'توصيل' : 'استلام'}
                            </span>
                          </td>
                          <td><strong>{order.total_amount} د.أ</strong></td>
                          <td>
                            <input
                              type="text"
                              placeholder="اسم المندوب"
                              defaultValue={order.delivery_person || ''}
                              disabled={order.delivery_type !== 1}
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                const current = order.delivery_person || '';
                                if (val !== current) {
                                  updateDeliveryPerson(order.id, val);
                                }
                              }}
                              style={{
                                padding: '0.4rem', border: '1px solid #ccc', borderRadius: '4px', width: '100px',
                                background: order.delivery_type !== 1 ? '#f1f5f9' : 'white',
                                cursor: order.delivery_type !== 1 ? 'not-allowed' : 'text',
                                opacity: order.delivery_type !== 1 ? 0.6 : 1
                              }}
                            />
                          </td>
                          <td>
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, parseInt(e.target.value), order.delivery_type, order.delivery_person)}
                              className="status-select"
                              style={{
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                outline: 'none',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                background: order.status === 0 ? '#fee2e2' : order.status === 1 ? '#fef3c7' : order.status === 2 ? '#f3e8ff' : order.status === 3 ? '#d1fae5' : order.status === 4 ? '#f1f5f9' : '#fee2e2',
                                color: order.status === 0 ? '#dc2626' : order.status === 1 ? '#b45309' : order.status === 2 ? '#6b21a8' : order.status === 3 ? '#047857' : order.status === 4 ? '#475569' : '#dc2626',
                                border: `1px solid ${order.status === 0 ? '#fca5a5' : order.status === 1 ? '#fde68a' : order.status === 2 ? '#d8b4fe' : order.status === 3 ? '#a7f3d0' : order.status === 4 ? '#cbd5e1' : '#fca5a5'}`
                              }}
                            >
                              <option value="0" style={{ background: '#fee2e2', color: '#dc2626', fontWeight: 'bold' }}>جديد</option>
                              <option value="1" style={{ background: '#fef3c7', color: '#b45309' }}>قيد الطباعة والمعالجة</option>
                              <option value="2" style={{ background: '#f3e8ff', color: '#6b21a8' }}>
                                {(String(order.delivery_type) === '1' || String(order.delivery_type) === 'true') ? 'جاهز للتوصيل' : 'جاهز للاستلام'}
                              </option>
                              <option value="3" style={{ background: '#d1fae5', color: '#047857' }}>مكتمل / تم التسليم</option>
                              <option value="4" style={{ background: '#f1f5f9', color: '#475569' }}>مرفوض من الإدارة</option>
                              <option value="5" style={{ background: '#fee2e2', color: '#dc2626' }}>مرفوض من المعلم</option>
                            </select>
                          </td>
                          <td>
                            <button 
                              className="icon-btn" 
                              style={{ background: '#e0f2fe', width: '40px', height: '40px', borderRadius: '10px' }} 
                              onClick={() => handleExport(order)} 
                              title="تصدير لملف إكسل"
                            >
                              <Download size={20} color="#0284c7" />
                            </button>
                          </td>
                          <td>
                            <button
                              className="icon-btn"
                              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            >
                              {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                          </td>
                        </tr>
                        {expandedOrder === order.id && (
                          <tr className="details-row">
                            <td colSpan={10}>
                              <div className="order-details-card">

                                {/* معلومات العميل الكاملة - تظهر دائماً */}
                                <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>معلومات العميل</h4>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                    <div><strong>الاسم:</strong> {order.customer_name}</div>
                                    <div>
                                      <strong>الهاتف 1:</strong> <span dir="ltr">{order.phone || 'غير متوفر'}</span>
                                      {checkIsDuplicateOrder(order, orders) && (
                                        <span style={{ marginRight: '0.5rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-block' }}>
                                          ⚠️ طلب مكرر (يوجد طلب سابق يحتوي على نفس المواد والمعلم)
                                        </span>
                                      )}
                                    </div>
                                    <div><strong>الهاتف 2 (الرقم البديل):</strong> <span dir="ltr">{order.phone2 || 'غير متوفر'}</span></div>
                                    <div><strong>المدرسة:</strong> {order.school_name}</div>
                                    <div><strong>نوع المدرسة:</strong> {order.school_type || '—'}</div>
                                    <div><strong>نوع التعليم:</strong> {order.directorate || '—'}</div>
                                    <div><strong>المحافظة:</strong> {order.governorate || '—'}</div>
                                    <div><strong>اللواء / المنطقة:</strong> {order.district || '—'}</div>
                                  </div>
                                  {order.delivery_type === 1 && (
                                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #cbd5e1', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                      <div><strong>عنوان المدرسة:</strong> {order.school_location ? (order.school_location.includes(' - ') ? order.school_location : `${order.governorate} - ${order.school_location}`) : 'غير متوفر'}</div>
                                      <div><strong>عنوان البيت:</strong> {order.home_location ? (order.home_location.includes(' - ') ? order.home_location : `${order.governorate} - ${order.home_location}`) : 'غير متوفر'}</div>
                                    </div>
                                  )}
                                </div>

                                <h4>تفاصيل المعلمين والمواد</h4>
                                {order.order_items && order.order_items.length > 0 ? (
                                  <table className="items-table">
                                    <thead>
                                      <tr>
                                        <th>اسم المعلم</th>
                                        <th>المادة</th>
                                        <th>الصف</th>
                                        <th>نوع الخدمة</th>
                                        <th>السعر</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {order.order_items.map((item: any) => (
                                        <tr key={item.id}>
                                          <td>{item.teacher_name}</td>
                                          <td>{item.subject}</td>
                                          <td>{item.grade}</td>
                                          <td>{item.service_type === 0 ? 'خطة فصلية' : item.service_type === 1 ? 'تحضير يومي' : 'بكج كامل (خطة وتحضير وتحليل)'}</td>
                                          <td>{item.price} د.أ</td>
                                        </tr>
                                      ))}
                                      {order.delivery_type === 1 && (
                                        <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                                          <td colSpan={4} style={{ textAlign: 'left' }}>أجور التوصيل:</td>
                                          <td>{order.delivery_cost || 3} د.أ</td>
                                        </tr>
                                      )}
                                      <tr style={{ background: '#f1f5f9', fontWeight: 'bold', fontSize: '1rem' }}>
                                        <td colSpan={4} style={{ textAlign: 'left', color: 'var(--primary)' }}>الإجمالي:</td>
                                        <td style={{ color: '#10b981' }}>{order.total_amount} د.أ</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                ) : (
                                  <p>لا توجد تفاصيل للمواد</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}

              {totalOrdersPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                  <button
                    disabled={activeOrdersPage === 1}
                    onClick={() => setOrdersPage(activeOrdersPage - 1)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: activeOrdersPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    السابق
                  </button>
                  <span>صفحة {activeOrdersPage} من {totalOrdersPages}</span>
                  <button
                    disabled={activeOrdersPage === totalOrdersPages}
                    onClick={() => setOrdersPage(activeOrdersPage + 1)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: activeOrdersPage === totalOrdersPages ? 'not-allowed' : 'pointer' }}
                  >
                    التالي
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={24} color="var(--primary)" /> إدارة المواد والتسعير
            </h2>

            <div className="add-subject-form">
              <div className="subject-name-input">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text)', fontWeight: 'bold' }}>اسم المادة</label>
                <input
                  type="text" placeholder="اسم المادة (بالعربي)" maxLength={50}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
                  value={newSubject.name} onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text)', fontWeight: 'bold' }}>سعر الخطة</label>
                <input
                  type="number" step="0.5" min="0" max="100" placeholder="سعر الخطة"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
                  value={newSubject.plan_price} onChange={e => setNewSubject({ ...newSubject, plan_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text)', fontWeight: 'bold' }}>سعر التحضير</label>
                <input
                  type="number" step="0.5" min="0" max="100" placeholder="سعر التحضير"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
                  value={newSubject.prep_price} onChange={e => setNewSubject({ ...newSubject, prep_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <button
                onClick={handleAddSubject}
                style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold', height: '45px' }}
              >
                <Plus size={20} /> إضافة مادة
              </button>
            </div>
            {renderToast()}

            <table className="orders-table">
              <thead>
                <tr>
                  <th>اسم المادة</th>
                  <th>سعر الخطة</th>
                  <th>سعر التحضير</th>
                  <th>الصفوف</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loadingSubjects ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>جاري التحميل...</td></tr>
                ) : subjects.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                    لا توجد مواد مضافة حالياً. إذا كانت هذه المرة الأولى، يرجى تشغيل الأوامر في ملف schema.sql في قاعدة بيانات Supabase الخاصة بك.
                  </td></tr>
                ) : (
                  subjects.map(s => (
                    <React.Fragment key={s.id}>
                      <tr>
                      <td>
                        {editingSubject === s.id ? (
                          <input type="text" defaultValue={s.name} maxLength={50} onBlur={(e) => {
                            if (e.target.value !== s.name) handleEditSubject(s.id, 'name', e.target.value, s);
                            setEditingSubject(null);
                          }} autoFocus style={{ padding: '0.25rem', width: '100%' }} />
                        ) : (
                          <strong onClick={() => setEditingSubject(s.id)} style={{ cursor: 'pointer', borderBottom: '1px dashed #ccc' }}>{s.name}</strong>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="number" step="0.5" min="0" max="100" defaultValue={s.plan_price}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                            onBlur={(e) => {
                              let val = parseFloat(e.target.value);
                              if (isNaN(val)) val = 0;
                              if (val !== s.plan_price) handleEditSubject(s.id, 'plan_price', val, s);
                            }}
                            style={{ padding: '0.25rem', width: '80px', border: '1px solid #ccc', borderRadius: '4px' }}
                          />
                          <span>د.أ</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="number" step="0.5" min="0" max="100" defaultValue={s.prep_price}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                            onBlur={(e) => {
                              let val = parseFloat(e.target.value);
                              if (isNaN(val)) val = 0;
                              if (val !== s.prep_price) handleEditSubject(s.id, 'prep_price', val, s);
                            }}
                            style={{ padding: '0.25rem', width: '80px', border: '1px solid #ccc', borderRadius: '4px' }}
                          />
                          <span>د.أ</span>
                        </div>
                      </td>
                      <td>
                        <button onClick={() => setExpandedSubject(expandedSubject === s.id ? null : s.id)} style={{ background: '#e0e7ff', color: '#4f46e5', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                          الصفوف ({subjectGrades[s.id]?.length || 0})
                        </button>
                      </td>
                      <td>
                        <button onClick={() => handleDeleteSubject(s)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                    {expandedSubject === s.id && (
                      <tr>
                        <td colSpan={5} style={{ background: '#f8fafc', padding: '1.5rem' }}>
                          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary)' }}>الصفوف المتاحة للمادة: {s.name}</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {AVAILABLE_GRADES.map(grade => {
                              const isSelected = (subjectGrades[s.id] || []).includes(grade);
                              return (
                                <label key={grade} style={{
                                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                                  padding: '0.5rem 1rem', background: isSelected ? '#dbeafe' : 'white',
                                  border: `1px solid ${isSelected ? '#3b82f6' : '#cbd5e1'}`,
                                  borderRadius: '8px', cursor: 'pointer', userSelect: 'none'
                                }}>
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => toggleGrade(s.id, grade)}
                                    style={{ width: '16px', height: '16px' }}
                                  />
                                  <span style={{ color: isSelected ? '#1e40af' : 'var(--text)' }}>{grade}</span>
                                </label>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>


    </div>
  );
}

export default App;
