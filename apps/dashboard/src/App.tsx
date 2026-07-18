import React from 'react';

function App() {
  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>لوحة التحكم</h2>
        <nav>
          <ul>
            <li>الطلبات الجديدة</li>
            <li>الأرشيف</li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <header>
          <h1>إدارة الطلبات</h1>
        </header>
        <section className="orders-list">
          <p>جاري تحميل الطلبات...</p>
        </section>
      </main>
    </div>
  );
}

export default App;
