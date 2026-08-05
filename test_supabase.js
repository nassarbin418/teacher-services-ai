const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lzeujzlgozhrbffxcuvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZXVqemxnb3pocmJmZnhjdXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzODM3MjIsImV4cCI6MjA5OTk1OTcyMn0.gcxY728Zq5cdWO-SaIPgvTwwk8svmxf8zNjZdIElz9s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('order_items').delete().eq('id', 0);
  console.log('Delete test (id=0):', { data, error });

  const { data: ordersData, error: ordersError } = await supabase.from('orders').select('id, total_amount, status').limit(5);
  console.log('Orders:', ordersData);
  
  if (ordersData && ordersData.length > 0) {
     const orderId = ordersData[0].id;
     const { data: items, error: itemsError } = await supabase.from('order_items').select('*').eq('order_id', orderId);
     console.log(`Items for order ${orderId}:`, items);
  }
}

test();
