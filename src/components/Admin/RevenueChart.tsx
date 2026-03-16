import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import { adminService } from '../../services/supabase/adminService';
import { isSupabaseReady } from '../../lib/supabase';

interface RevenueData {
  date: string;
  revenue: number;
  orders_count: number;
}

export default function RevenueChart({ days = 30 }: { days?: number }) {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    if (isSupabaseReady()) {
      adminService.getRevenueAnalytics(days)
        .then((analytics: any[]) => {
          setData(analytics);
          const sum = analytics.reduce((acc, item) => acc + Number(item.revenue), 0);
          const orderSum = analytics.reduce((acc, item) => acc + Number(item.orders_count), 0);
          setTotalRevenue(sum);
          setTotalOrders(orderSum);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [days]);

  if (loading) {
    return (
      <div className="admin-card">
        <h3>Revenue Analytics</h3>
        <p>Loading...</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => Number(d.revenue)), 1);

  return (
    <div className="admin-card revenue-chart">
      <div className="card-header">
        <h3><TrendingUp size={20} /> Revenue Analytics (Last {days} Days)</h3>
        <div className="revenue-summary">
          <div className="summary-item">
            <DollarSign size={16} />
            <span>${totalRevenue.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span>{totalOrders} orders</span>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="empty-message">No revenue data for this period</p>
      ) : (
        <div className="chart-container">
          {data.slice(0, 15).reverse().map((item, idx) => (
            <div key={idx} className="chart-bar">
              <div
                className="bar"
                style={{
                  height: `${(Number(item.revenue) / maxRevenue) * 100}%`,
                }}
                title={`$${Number(item.revenue).toFixed(2)}`}
              />
              <span className="bar-label">{new Date(item.date).getDate()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
