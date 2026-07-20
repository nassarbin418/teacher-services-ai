import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { Search, Download, ChevronDown, ChevronUp, Clock, Package, Bell, BookOpen, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { exportOrderToExcel } from './utils/exportExcel';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState<'orders' | 'subjects'>('orders');

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  // Subjects State
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', plan_price: 2, prep_price: 3 });
  const [editingSubject, setEditingSubject] = useState<string | number | null>(null);

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
        .order('created_at', { ascending: false });
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
      const { data, error } = await supabase.from('subjects').select('*');
      if (error) throw error;
      setSubjects(data || []);
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
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (e) { }

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

  const updateOrderStatus = async (orderId: number, newStatus: number) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Insert Notification
      const statuses = ['جديد', 'قيد المعالجة', 'تم الانتهاء', 'مرفوض', 'مرفوض من المعلم'];
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

  const handleExport = (order: any) => {
    exportOrderToExcel(order, order.order_items || []);
  };

  // Subjects Management functions
  const handleAddSubject = async () => {
    if (!newSubject.name) return showToast('الرجاء إدخال اسم المادة', 'error');
    try {
      const { data, error } = await supabase.from('subjects').insert(newSubject).select();
      if (error) throw error;
      if (data && data.length > 0) {
        setSubjects([...subjects, data[0]]);
      }
      setNewSubject({ name: '', plan_price: 2, prep_price: 3 });
      showToast('تمت إضافة المادة بنجاح', 'success');
    } catch (err) {
      console.error(err);
      showToast('خطأ في إضافة المادة', 'error');
    }
  };

  const handleEditSubject = async (subjectId: string | number, field: string, value: any) => {
    try {
      const { error } = await supabase.from('subjects').update({ [field]: value }).eq('id', subjectId);
      if (error) throw error;
      setSubjects(subjects.map(s => s.id === subjectId ? { ...s, [field]: value } : s));
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm) ||
      order.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || order.status.toString() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const currentOrders = filteredOrders.slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage);
  const totalOrdersPages = Math.ceil(filteredOrders.length / ordersPerPage);

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderBottom: '4px solid #94a3b8' }}>
                <h3 style={{ color: 'var(--text-light)', fontSize: '1rem', margin: '0 0 0.5rem 0' }}>إجمالي الطلبات</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)', margin: 0 }}>{orders.length}</p>
              </div>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderBottom: '4px solid #3b82f6' }}>
                <h3 style={{ color: 'var(--text-light)', fontSize: '1rem', margin: '0 0 0.5rem 0' }}>الطلبات الجديدة</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>{orders.filter(o => o.status === 0).length}</p>
              </div>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderBottom: '4px solid #f59e0b' }}>
                <h3 style={{ color: 'var(--text-light)', fontSize: '1rem', margin: '0 0 0.5rem 0' }}>قيد المعالجة</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>{orders.filter(o => o.status === 1).length}</p>
              </div>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderBottom: '4px solid #10b981' }}>
                <h3 style={{ color: 'var(--text-light)', fontSize: '1rem', margin: '0 0 0.5rem 0' }}>تم الانتهاء</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>{orders.filter(o => o.status === 2).length}</p>
              </div>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderBottom: '4px solid #ef4444' }}>
                <h3 style={{ color: 'var(--text-light)', fontSize: '1rem', margin: '0 0 0.5rem 0' }}>المرفوضة</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444', margin: 0 }}>{orders.filter(o => o.status === 3 || o.status === 4).length}</p>
              </div>
            </div>

            <div className="filters-bar">
              <div className="search-box">
                <Search size={20} color="#64748b" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، رقم الطلب، الهاتف..."
                  maxLength={50}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-select" style={{ display: 'flex', alignItems: 'center' }}>
                <select className="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ height: '100%' }}>
                  <option value="all">جميع الحالات</option>
                  <option value="0">جديد</option>
                  <option value="1">قيد المعالجة</option>
                  <option value="2">تم الانتهاء</option>
                  <option value="3">مرفوض</option>
                  <option value="4">مرفوض من المعلم</option>
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
                      <th>المدرسة</th>
                      <th>نوع التوصيل</th>
                      <th>السعر الإجمالي</th>
                      <th>اسم المندوب</th>
                      <th>الحالة</th>
                      <th>تصدير</th>
                      <th>توسيع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.map((order) => (
                      <React.Fragment key={order.id}>
                        <tr className={expandedOrder === order.id ? 'expanded-row' : ''}>
                          <td><strong>#{order.id}</strong></td>
                          <td dir="ltr" style={{ textAlign: 'right' }}>{new Date(order.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td>{order.customer_name}</td>
                          <td dir="ltr" style={{ textAlign: 'right' }}>{order.phone}</td>
                          <td>
                            {order.school_name} <br />
                            <span style={{ fontSize: '0.8rem', color: 'gray' }}>{order.school_type || ''} - {order.district}</span>
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
                              onChange={(e) => updateOrderStatus(order.id, parseInt(e.target.value))}
                              className="status-select"
                              style={{ padding: '0.4rem', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}
                            >
                              <option value="0">جديد</option>
                              <option value="1">قيد المعالجة</option>
                              <option value="2">تم الانتهاء</option>
                              <option value="3">مرفوض</option>
                              <option value="4">مرفوض من المعلم</option>
                            </select>
                          </td>
                          <td>
                            <button className="icon-btn action" onClick={() => handleExport(order)} title="تصدير لملف إكسل">
                              <Download size={18} color="white" />
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
                            <td colSpan={11}>
                              <div className="order-details-card">

                                {order.delivery_type === 1 && (
                                  <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0' }}>معلومات التوصيل</h4>
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                                      <strong>المحافظة:</strong> {order.governorate} | <strong>المنطقة:</strong> {order.district} <br />
                                      <strong>مكان المدرسة:</strong> {order.school_location || 'غير متوفر'} <br />
                                      <strong>مكان البيت:</strong> {order.home_location || 'غير متوفر'} <br />
                                      <strong>رقم الهاتف 1:</strong> <span dir="ltr">{order.phone}</span> | <strong>رقم الهاتف 2:</strong> <span dir="ltr">{order.phone2 || 'لا يوجد'}</span>
                                    </p>
                                  </div>
                                )}

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
                    disabled={ordersPage === 1}
                    onClick={() => setOrdersPage(ordersPage - 1)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: ordersPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    السابق
                  </button>
                  <span>صفحة {ordersPage} من {totalOrdersPages}</span>
                  <button
                    disabled={ordersPage === totalOrdersPages}
                    onClick={() => setOrdersPage(ordersPage + 1)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: ordersPage === totalOrdersPages ? 'not-allowed' : 'pointer' }}
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text)', fontWeight: 'bold' }}>سعر الخطة الفصلية</label>
                <input
                  type="number" step="0.5" min="0" max="100" placeholder="سعر الخطة الفصلية"
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
                  <th>سعر الخطة الفصلية</th>
                  <th>سعر التحضير اليومي</th>
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
                    <tr key={s.id}>
                      <td>
                        {editingSubject === s.id ? (
                          <input type="text" defaultValue={s.name} maxLength={50} onBlur={(e) => {
                            if (e.target.value !== s.name) handleEditSubject(s.id, 'name', e.target.value);
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
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (val !== s.plan_price && !isNaN(val)) handleEditSubject(s.id, 'plan_price', val);
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
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (val !== s.prep_price && !isNaN(val)) handleEditSubject(s.id, 'prep_price', val);
                            }}
                            style={{ padding: '0.25rem', width: '80px', border: '1px solid #ccc', borderRadius: '4px' }}
                          />
                          <span>د.أ</span>
                        </div>
                      </td>
                      <td>
                        <button onClick={() => handleDeleteSubject(s)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
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
