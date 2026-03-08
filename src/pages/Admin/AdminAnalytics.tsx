import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingBag,
  DollarSign,
  Package,
  Truck,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  MapPin,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { isSupabaseReady } from '../../lib/supabase';
import { adminService } from '../../services/supabase/adminService';
import type { AdminStats } from '../../types';
import '../../styles/admin-analytics.css';

const defaultStats: AdminStats = {
  totalUsers: 0,
  totalFarmers: 0,
  totalBuyers: 0,
  totalTransporters: 0,
  totalListings: 0,
  activeListings: 0,
  totalOrders: 0,
  completedOrders: 0,
  totalRevenue: 0,
  totalCommission: 0,
  pendingDisputes: 0,
  escrowBalance: 0,
};

const revenueByMonth = [
  { month: 'Jun', revenue: 32000, commission: 1600 },
  { month: 'Jul', revenue: 45000, commission: 2250 },
  { month: 'Aug', revenue: 38000, commission: 1900 },
  { month: 'Sep', revenue: 52000, commission: 2600 },
  { month: 'Oct', revenue: 48000, commission: 2400 },
  { month: 'Nov', revenue: 65000, commission: 3250 },
];

const userGrowth = [
  { month: 'Jun', farmers: 380, buyers: 420, transporters: 78 },
  { month: 'Jul', farmers: 412, buyers: 465, transporters: 85 },
  { month: 'Aug', farmers: 445, buyers: 510, transporters: 92 },
  { month: 'Sep', farmers: 478, buyers: 558, transporters: 98 },
  { month: 'Oct', farmers: 502, buyers: 590, transporters: 105 },
  { month: 'Nov', farmers: 523, buyers: 612, transporters: 112 },
];

const topSellingProducts = [
  { id: 'p1', title: 'Grade A Maize', sales: 45, revenue: 15750, category: 'crops' },
  { id: 'p2', title: 'Premium Beef Cattle', sales: 12, revenue: 14400, category: 'livestock' },
  { id: 'p3', title: 'Fresh Organic Tomatoes', sales: 89, revenue: 5562, category: 'crops' },
  { id: 'p4', title: 'Free-Range Chickens', sales: 34, revenue: 5100, category: 'livestock' },
  { id: 'p5', title: 'Soybean Seeds', sales: 28, revenue: 4200, category: 'crops' },
];

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [stats, setStats] = useState<AdminStats>(defaultStats);

  useEffect(() => {
    if (isSupabaseReady()) {
      adminService.getStats().then(liveStats => {
        setStats(prev => ({ ...prev, ...liveStats }));
      }).catch(() => {});
    }
  }, []);

  const growthData = {
    revenue: { value: 12.5, trend: 'up' },
    users: { value: 8.3, trend: 'up' },
    orders: { value: 15.2, trend: 'up' },
    avgOrderValue: { value: -2.1, trend: 'down' },
  };

  // Category distribution data
  const categoryData = [
    { name: 'Crops', value: 45, color: '#22c55e' },
    { name: 'Livestock', value: 30, color: '#3b82f6' },
    { name: 'Equipment', value: 15, color: '#f97316' },
    { name: 'Other', value: 10, color: '#8b5cf6' },
  ];

  // Location data
  const locationData = [
    { city: 'Harare', orders: 1245, percentage: 36 },
    { city: 'Bulawayo', orders: 856, percentage: 25 },
    { city: 'Chitungwiza', orders: 523, percentage: 15 },
    { city: 'Mutare', orders: 412, percentage: 12 },
    { city: 'Gweru', orders: 245, percentage: 7 },
    { city: 'Others', orders: 175, percentage: 5 },
  ];

  // Peak hours data
  const peakHours = [
    { hour: '6AM', activity: 15 },
    { hour: '8AM', activity: 45 },
    { hour: '10AM', activity: 78 },
    { hour: '12PM', activity: 92 },
    { hour: '2PM', activity: 85 },
    { hour: '4PM', activity: 95 },
    { hour: '6PM', activity: 88 },
    { hour: '8PM', activity: 55 },
    { hour: '10PM', activity: 25 },
  ];

  // Conversion funnel
  const funnelData = [
    { stage: 'Visitors', count: 15420, percentage: 100 },
    { stage: 'Registered', count: 4250, percentage: 27.6 },
    { stage: 'Listed/Searched', count: 2890, percentage: 18.7 },
    { stage: 'Orders Placed', count: 1456, percentage: 9.4 },
    { stage: 'Completed', count: 1245, percentage: 8.1 },
  ];

  return (
    <div className="admin-analytics">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1>
            <BarChart3 size={28} />
            Analytics Dashboard
          </h1>
          <p>Comprehensive insights into platform performance</p>
        </div>
        <div className="header-actions">
          <div className="time-range-selector">
            <button 
              className={timeRange === '7d' ? 'active' : ''} 
              onClick={() => setTimeRange('7d')}
            >
              7 Days
            </button>
            <button 
              className={timeRange === '30d' ? 'active' : ''} 
              onClick={() => setTimeRange('30d')}
            >
              30 Days
            </button>
            <button 
              className={timeRange === '90d' ? 'active' : ''} 
              onClick={() => setTimeRange('90d')}
            >
              90 Days
            </button>
            <button 
              className={timeRange === '1y' ? 'active' : ''} 
              onClick={() => setTimeRange('1y')}
            >
              1 Year
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon revenue">
              <DollarSign size={24} />
            </div>
            <span className={`metric-trend ${growthData.revenue.trend}`}>
              {growthData.revenue.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {growthData.revenue.value}%
            </span>
          </div>
          <div className="metric-value">${stats.totalRevenue.toLocaleString()}</div>
          <div className="metric-label">Total Revenue</div>
          <div className="metric-sparkline revenue">
            {[40, 55, 45, 60, 75, 65, 80, 70, 85, 90, 78, 95].map((v, i) => (
              <div key={i} className="spark-bar" style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon users">
              <Users size={24} />
            </div>
            <span className={`metric-trend ${growthData.users.trend}`}>
              {growthData.users.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {growthData.users.value}%
            </span>
          </div>
          <div className="metric-value">{stats.totalUsers.toLocaleString()}</div>
          <div className="metric-label">Total Users</div>
          <div className="metric-sparkline users">
            {[30, 35, 40, 45, 50, 55, 58, 62, 68, 72, 78, 85].map((v, i) => (
              <div key={i} className="spark-bar" style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon orders">
              <ShoppingBag size={24} />
            </div>
            <span className={`metric-trend ${growthData.orders.trend}`}>
              {growthData.orders.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {growthData.orders.value}%
            </span>
          </div>
          <div className="metric-value">{stats.totalOrders.toLocaleString()}</div>
          <div className="metric-label">Total Orders</div>
          <div className="metric-sparkline orders">
            {[45, 50, 48, 55, 60, 58, 65, 70, 75, 80, 85, 92].map((v, i) => (
              <div key={i} className="spark-bar" style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon aov">
              <Target size={24} />
            </div>
            <span className={`metric-trend ${growthData.avgOrderValue.trend}`}>
              {growthData.avgOrderValue.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(growthData.avgOrderValue.value)}%
            </span>
          </div>
          <div className="metric-value">$140.50</div>
          <div className="metric-label">Avg Order Value</div>
          <div className="metric-sparkline aov">
            {[85, 80, 82, 78, 75, 80, 77, 74, 72, 75, 70, 68].map((v, i) => (
              <div key={i} className="spark-bar" style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Revenue Chart */}
        <div className="chart-card large">
          <div className="chart-header">
            <h3>
              <TrendingUp size={20} />
              Revenue & Commission Trends
            </h3>
            <div className="chart-legend">
              <span className="legend-item"><span className="dot revenue"></span> Revenue</span>
              <span className="legend-item"><span className="dot commission"></span> Commission</span>
            </div>
          </div>
          <div className="revenue-chart">
            {revenueByMonth.map((item, index) => (
              <div key={index} className="chart-bar-group">
                <div className="bar-container">
                  <div 
                    className="bar revenue" 
                    style={{ height: `${(item.revenue / 70000) * 100}%` }}
                    title={`Revenue: $${item.revenue.toLocaleString()}`}
                  >
                    <span className="bar-value">${(item.revenue / 1000).toFixed(0)}k</span>
                  </div>
                  <div 
                    className="bar commission" 
                    style={{ height: `${(item.commission / 3500) * 100}%` }}
                    title={`Commission: $${item.commission.toLocaleString()}`}
                  />
                </div>
                <span className="bar-label">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <PieChart size={20} />
              Category Distribution
            </h3>
          </div>
          <div className="pie-chart-container">
            <div className="pie-chart">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="20" 
                  strokeDasharray={`${45 * 2.51} ${100 * 2.51}`} 
                  strokeDashoffset="0" 
                  transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20" 
                  strokeDasharray={`${30 * 2.51} ${100 * 2.51}`} 
                  strokeDashoffset={`${-45 * 2.51}`} 
                  transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f97316" strokeWidth="20" 
                  strokeDasharray={`${15 * 2.51} ${100 * 2.51}`} 
                  strokeDashoffset={`${-75 * 2.51}`} 
                  transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="20" 
                  strokeDasharray={`${10 * 2.51} ${100 * 2.51}`} 
                  strokeDashoffset={`${-90 * 2.51}`} 
                  transform="rotate(-90 50 50)" />
              </svg>
              <div className="pie-center">
                <span className="pie-total">{stats.totalListings}</span>
                <span className="pie-label">Listings</span>
              </div>
            </div>
            <div className="pie-legend">
              {categoryData.map((cat) => (
                <div key={cat.name} className="legend-row">
                  <span className="legend-color" style={{ background: cat.color }}></span>
                  <span className="legend-name">{cat.name}</span>
                  <span className="legend-value">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="charts-row">
        {/* User Growth */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <Users size={20} />
              User Growth by Role
            </h3>
          </div>
          <div className="user-growth-chart">
            {userGrowth.map((item, index) => (
              <div key={index} className="growth-bar-group">
                <div className="stacked-bars">
                  <div 
                    className="stack-bar farmers" 
                    style={{ height: `${(item.farmers / 700) * 100}%` }}
                    title={`Farmers: ${item.farmers}`}
                  />
                  <div 
                    className="stack-bar buyers" 
                    style={{ height: `${(item.buyers / 700) * 100}%` }}
                    title={`Buyers: ${item.buyers}`}
                  />
                  <div 
                    className="stack-bar transporters" 
                    style={{ height: `${(item.transporters / 700) * 100}%` }}
                    title={`Transporters: ${item.transporters}`}
                  />
                </div>
                <span className="bar-label">{item.month}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend horizontal">
            <span className="legend-item"><span className="dot farmers"></span> Farmers</span>
            <span className="legend-item"><span className="dot buyers"></span> Buyers</span>
            <span className="legend-item"><span className="dot transporters"></span> Transporters</span>
          </div>
        </div>

        {/* Peak Activity Hours */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <Clock size={20} />
              Peak Activity Hours
            </h3>
          </div>
          <div className="activity-chart">
            {peakHours.map((item, index) => (
              <div key={index} className="activity-bar-wrapper">
                <div 
                  className="activity-bar" 
                  style={{ height: `${item.activity}%` }}
                >
                  <span className="activity-value">{item.activity}%</span>
                </div>
                <span className="activity-label">{item.hour}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Third Row */}
      <div className="charts-row three-col">
        {/* Conversion Funnel */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <Zap size={20} />
              Conversion Funnel
            </h3>
          </div>
          <div className="funnel-chart">
            {funnelData.map((item, index) => (
              <div key={index} className="funnel-stage">
                <div className="funnel-bar-wrapper">
                  <div 
                    className="funnel-bar" 
                    style={{ width: `${item.percentage}%` }}
                  >
                    <span className="funnel-count">{item.count.toLocaleString()}</span>
                  </div>
                </div>
                <div className="funnel-info">
                  <span className="funnel-name">{item.stage}</span>
                  <span className="funnel-percentage">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Locations */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <MapPin size={20} />
              Orders by Location
            </h3>
          </div>
          <div className="location-list">
            {locationData.map((loc, index) => (
              <div key={index} className="location-item">
                <div className="location-info">
                  <span className="location-rank">#{index + 1}</span>
                  <span className="location-name">{loc.city}</span>
                </div>
                <div className="location-bar-wrapper">
                  <div 
                    className="location-bar" 
                    style={{ width: `${loc.percentage}%` }}
                  />
                </div>
                <div className="location-stats">
                  <span className="location-orders">{loc.orders}</span>
                  <span className="location-percentage">{loc.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <Package size={20} />
              Top Products
            </h3>
            <Link to="/admin/products" className="view-all">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="top-products-list">
            {topSellingProducts.slice(0, 5).map((product, index) => (
              <div key={product.id} className="product-item">
                <span className="product-rank">#{index + 1}</span>
                <div className="product-info">
                  <span className="product-name">{product.title}</span>
                  <span className="product-category">{product.category}</span>
                </div>
                <div className="product-stats">
                  <span className="product-sales">{product.sales} sales</span>
                  <span className="product-revenue">${product.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="quick-stats-footer">
        <div className="quick-stat">
          <Activity size={20} />
          <div>
            <span className="qs-value">84%</span>
            <span className="qs-label">Order Completion Rate</span>
          </div>
        </div>
        <div className="quick-stat">
          <Truck size={20} />
          <div>
            <span className="qs-value">2.3 days</span>
            <span className="qs-label">Avg Delivery Time</span>
          </div>
        </div>
        <div className="quick-stat">
          <Users size={20} />
          <div>
            <span className="qs-value">92%</span>
            <span className="qs-label">Customer Retention</span>
          </div>
        </div>
        <div className="quick-stat">
          <DollarSign size={20} />
          <div>
            <span className="qs-value">$24,250</span>
            <span className="qs-label">Commission This Month</span>
          </div>
        </div>
      </div>
    </div>
  );
}
