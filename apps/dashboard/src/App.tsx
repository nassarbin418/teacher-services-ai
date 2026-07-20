import React, { useState, useEffect, Fragment } from 'react';
import { supabase } from './lib/supabase';
import { Search, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { exportOrderToExcel } from './utils/exportExcel';
import './index.css';

function App() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  // Fetch orders from Supabase
  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('orders_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        // Play notification sound for new orders
        if (payload.eventType === 'INSERT') {
          try {
            const audio = new Audio('/notification.mp3'); // Optional: add a sound file in public
            audio.play().catch(e => console.log('Audio play failed:', e));
          } catch(e) {}
          
          alert(`طلب جديد رقم: ${payload.new.id}`);
        }
        
        // Refresh orders on any change
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateOrderStatus = async (orderId: number, newStatus: number) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      // UI updates via realtime subscription or manual state update
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('خطأ في تحديث الحالة');
    }
  };

  const updateDeliveryPerson = async (orderId: number, personName: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_person: personName })
        .eq('id', orderId);
      
      if (error) throw error;
      alert('تم حفظ اسم المندوب بنجاح');
    } catch (err) {
      console.error('Error updating delivery person:', err);
      alert('خطأ في حفظ اسم المندوب');
    }
  };

  const handleExport = (order: any) => {
    exportOrderToExcel(order, order.order_items || []);
  };



  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm) ||
      order.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status.toString() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="dashboard-container" dir="rtl">
      <header className="dashboard-header">
        <h1>لوحة تحكم الإدارة</h1>
        <div className="header-stats">
          <div className="stat-box">الطلبات الكلية: {orders.length}</div>
          <div className="stat-box">الطلبات الجديدة: {orders.filter(o => o.status === 0).length}</div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* شريط البحث والفلترة */}
        <div className="filters-bar">
          <div className="search-box">
            <Search size={20} color="#64748b" />
            <input 
              type="text" 
              placeholder="البحث برقم الطلب، اسم العميل، الهاتف..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">جميع الحالات</option>
            <option value="0">جديد</option>
            <option value="1">قيد المعالجة</option>
            <option value="2">تم الانتهاء منها</option>
            <option value="3">مرفوض من جهة العميل</option>
          </select>
        </div>

        {/* جدول الطلبات */}
        <div className="table-container">
          {loading ? (
            <div className="loading">جاري تحميل الطلبات...</div>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>التاريخ</th>
                  <th>اسم العميل</th>
                  <th>الهاتف</th>
                  <th>المدرسة</th>
                  <th>الإجمالي</th>
                  <th>الحالة</th>
                  <th>اسم المندوب</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={9} style={{textAlign: 'center', padding: '2rem'}}>لا توجد طلبات تطابق البحث</td></tr>
                ) : filteredOrders.map(order => (
                  <React.Fragment key={order.id}>
                    <tr className={expandedOrder === order.id ? 'expanded-row' : ''}>
                      <td>#{order.id}</td>
                      <td>{new Date(order.created_at).toLocaleDateString('en-GB')}</td>
                      <td>{order.customer_name}</td>
                      <td dir="ltr" style={{textAlign: 'right'}}>{order.phone}</td>
                      <td>{order.school_name}</td>
                      <td>{order.total_amount} د.أ</td>
                      <td>
                        <select 
                          className="status-dropdown"
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, parseInt(e.target.value))}
                        >
                          <option value="0">جديد</option>
                          <option value="1">قيد المعالجة</option>
                          <option value="2">تم الانتهاء منها</option>
                          <option value="3">مرفوض من جهة العميل</option>
                        </select>
                      </td>
                      <td>
                        <div className="delivery-person-input">
                          <input 
                            type="text" 
                            placeholder="اسم المندوب"
                            defaultValue={order.delivery_person || ''}
                            onBlur={(e) => {
                              if (e.target.value !== order.delivery_person) {
                                updateDeliveryPerson(order.id, e.target.value);
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td className="actions-cell">
                        <button className="icon-btn" onClick={() => handleExport(order)} title="تصدير للإكسل">
                          <Download size={20} color="#10b981"/>
                        </button>
                        <button 
                          className="icon-btn" 
                          onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        >
                          {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </td>
                    </tr>
                    
                    {/* تفاصيل الطلب (المعلمين والمواد) */}
                    {expandedOrder === order.id && (
                      <tr className="details-row">
                        <td colSpan={9}>
                          <div className="order-details-card">
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
                                      <td>{item.service_type === 0 ? 'خطة فصلية' : 'تحضير يومي'}</td>
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
        </div>
      </main>
    </div>
  );
}

export default App;
