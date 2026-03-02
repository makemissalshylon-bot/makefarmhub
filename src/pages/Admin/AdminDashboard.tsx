import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Package,
  Truck,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MoreVertical,
  ChevronRight,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { isSupabaseReady } from '../../lib/supabase';
import { adminService } from '../../services/supabase/adminService';
import {
  mockAdminStats,
  mockTransactions,
  mockDisputes,
  topSellingProducts,
  revenueByMonth,
} from '../../data/mockData';

export default function AdminDashboard() {
  const { orders, listings, escrowBalance } = useAppData();
  const [stats, setStats] = useState(mockAdminStats);
  const [recentTransactions, setRecentTransactions] = useState<any[]>(mockTransactions.slice(0, 5));
  const [pendingDisputes, setPendingDisputes] = useState<any[]>(mockDisputes.filter(d => d.status !== 'resolved').slice(0, 4));

  useEffect(() => {
    if (isSupabaseReady()) {
      adminService.getStats().then(liveStats => {
        setStats(prev => ({ ...prev, ...liveStats }));
      }).catch(() => {});

      adminService.getAllTransactions().then(txns => {
        if (txns.length > 0) {
          setRecentTransactions(txns.slice(0, 5).map((t: any) => ({
            id: t.id,
            type: t.type,
            amount: Number(t.amount),
            fee: Number(t.fee || 0),
            status: t.status,
            description: t.description,
            date: t.created_at?.split('T')[0] || '',
            orderTitle: t.description || t.reference || 'Transaction',
            fromUser: { name: 'User', role: 'buyer' },
            toUser: { name: 'Seller', role: 'farmer' },
          })));
        }
      }).catch(() => {});

      adminService.getAllDisputes().then(disputes => {
        if (disputes.length > 0) {
          setPendingDisputes(disputes.filter((d: any) => d.status !== 'resolved').slice(0, 4).map((d: any) => ({
            id: d.id,
            orderId: d.order_id,
            raisedBy: d.raised_by,
            raisedByName: d.raised_by_name || 'User',
            reason: d.reason,
            description: d.description,
            status: d.status,
            createdAt: d.created_at,
            messages: d.messages || [],
          })));
        }
      }).catch(() => {});
    } else {
      setStats({
        ...mockAdminStats,
        totalOrders: orders.length || mockAdminStats.totalOrders,
        completedOrders: orders.filter(o => o.status === 'delivered').length || mockAdminStats.completedOrders,
        totalListings: listings.length || mockAdminStats.totalListings,
        activeListings: listings.filter((l: any) => l.status === 'active' || !l.status).length || mockAdminStats.activeListings,
        escrowBalance: escrowBalance || mockAdminStats.escrowBalance,
      });
    }
  }, [orders, listings, escrowBalance]);

  const recentOrders = orders.length > 0 ? orders.slice(0, 5) : [];

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome! Here's what's happening on MAKEFARMHUB today.</p>
        </div>
        <div className="header-actions">
          <select className="period-select">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
            <option>This year</option>
          </select>
        </div>
      </div>

      {/* Key Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card primary">
          <div className="stat-header">
            <div className="stat-icon">
              <DollarSign size={24} />
            </div>
            <span className="stat-change positive">
              <ArrowUpRight size={16} /> +12.5%
            </span>
          </div>
          <div className="stat-value">${stats.totalRevenue.toLocaleString()}</div>
          <div className="stat-label">Total Revenue</div>
        </div>

        <div className="admin-stat-card gold">
          <div className="stat-header">
            <div className="stat-icon">
              <Wallet size={24} />
            </div>
            <span className="stat-change positive">
              <ArrowUpRight size={16} /> +8.3%
            </span>
          </div>
          <div className="stat-value">${stats.totalCommission.toLocaleString()}</div>
          <div className="stat-label">Commission Earned</div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-header">
            <div className="stat-icon blue">
              <Users size={24} />
            </div>
          </div>
          <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
          <div className="stat-label">Total Users</div>
          <div className="stat-breakdown">
            <span>👨‍🌾 {stats.totalFarmers}</span>
            <span>🛒 {stats.totalBuyers}</span>
            <span>🚚 {stats.totalTransporters}</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-header">
            <div className="stat-icon green">
              <ShoppingBag size={24} />
            </div>
          </div>
          <div className="stat-value">{stats.totalOrders.toLocaleString()}</div>
          <div className="stat-label">Total Orders</div>
          <div className="stat-breakdown">
            <span className="completed">{stats.completedOrders} completed</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-header">
            <div className="stat-icon orange">
              <Package size={24} />
            </div>
          </div>
          <div className="stat-value">{stats.totalListings}</div>
          <div className="stat-label">Total Listings</div>
          <div className="stat-breakdown">
            <span className="active">{stats.activeListings} active</span>
          </div>
        </div>

        <div className="admin-stat-card warning">
          <div className="stat-header">
            <div className="stat-icon">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="stat-value">{stats.pendingDisputes}</div>
          <div className="stat-label">Pending Disputes</div>
          <Link to="/admin/disputes" className="stat-link">
            View all <ChevronRight size={16} />
          </Link>
        </div>

        <div className="admin-stat-card escrow">
          <div className="stat-header">
            <div className="stat-icon">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="stat-value">${stats.escrowBalance.toLocaleString()}</div>
          <div className="stat-label">Escrow Balance</div>
          <div className="stat-breakdown">
            <span>Funds held in escrow</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="admin-content-grid">
        {/* Revenue Chart */}
        <div className="admin-card chart-card">
          <div className="card-header">
            <h2>Revenue Overview</h2>
            <div className="chart-legend">
              <span className="legend-item revenue">● Revenue</span>
              <span className="legend-item commission">● Commission</span>
            </div>
          </div>
          <div className="chart-container">
            <div className="bar-chart">
              {revenueByMonth.map((item, index) => (
                <div key={index} className="chart-column">
                  <div className="bars">
                    <div
                      className="bar revenue"
                      style={{ height: `${(item.revenue / 70000) * 100}%` }}
                      title={`Revenue: $${item.revenue.toLocaleString()}`}
                    />
                    <div
                      className="bar commission"
                      style={{ height: `${(item.commission / 3500) * 100}%` }}
                      title={`Commission: $${item.commission.toLocaleString()}`}
                    />
                  </div>
                  <span className="month-label">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="admin-card">
          <div className="card-header">
            <h2>Recent Transactions</h2>
            <Link to="/admin/transactions" className="link-more">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="transactions-list">
            {recentTransactions.map((txn) => (
              <div key={txn.id} className="transaction-item">
                <div className={`txn-icon ${txn.type}`}>
                  {txn.type === 'escrow_in' && <ArrowDownRight size={18} />}
                  {txn.type === 'escrow_release' && <ArrowUpRight size={18} />}
                  {txn.type === 'commission' && <DollarSign size={18} />}
                  {txn.type === 'payout' && <Truck size={18} />}
                  {txn.type === 'refund' && <ArrowDownRight size={18} />}
                </div>
                <div className="txn-details">
                  <h4>{txn.orderTitle}</h4>
                  <p>
                    {txn.fromUser.name} → {txn.toUser.name}
                  </p>
                </div>
                <div className="txn-amount">
                  <span className={txn.type === 'commission' ? 'positive' : ''}>
                    ${txn.amount.toLocaleString()}
                  </span>
                  <span className={`txn-status ${txn.status}`}>{txn.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Disputes */}
        <div className="admin-card disputes-card">
          <div className="card-header">
            <h2>⚠️ Pending Disputes</h2>
            <Link to="/admin/disputes" className="link-more">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="disputes-list">
            {pendingDisputes.map((dispute) => (
              <div key={dispute.id} className="dispute-item">
                <div className="dispute-header">
                  <span className={`dispute-status ${dispute.status}`}>
                    {dispute.status}
                  </span>
                  <span className="dispute-amount">${dispute.amount}</span>
                </div>
                <h4>{dispute.orderTitle}</h4>
                <p className="dispute-reason">{dispute.reason}</p>
                <div className="dispute-parties">
                  <span>{dispute.raisedBy.name}</span>
                  <span>vs</span>
                  <span>{dispute.against.name}</span>
                </div>
                <div className="dispute-actions">
                  <Link to={`/admin/disputes/${dispute.id}`} className="btn-view">
                    <Eye size={16} /> Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="admin-card">
          <div className="card-header">
            <h2>🏆 Top Selling Products</h2>
            <Link to="/admin/products" className="link-more">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="top-products-list">
            {topSellingProducts.map((product, index) => (
              <div key={product.id} className="product-rank-item">
                <span className="rank">#{index + 1}</span>
                <div className="product-info">
                  <h4>{product.title}</h4>
                  <span className="category-tag">{product.category}</span>
                </div>
                <div className="product-stats">
                  <span className="sales">{product.sales} sales</span>
                  <span className="revenue">${product.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="admin-card full-width">
          <div className="card-header">
            <h2>Recent Orders</h2>
            <Link to="/admin/orders" className="link-more">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product</th>
                <th>Buyer</th>
                <th>Seller</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="order-id">{order.id}</td>
                  <td>
                    <div className="product-cell">
                      <img src={order.listingImage} alt="" />
                      <span>{order.listingTitle}</span>
                    </div>
                  </td>
                  <td>{order.buyerName}</td>
                  <td>{order.sellerName}</td>
                  <td className="amount">${order.totalPrice}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <button className="action-menu-btn">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="admin-card quick-actions-card">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            <Link to="/admin/users" className="quick-action">
              <Users size={24} />
              <span>Manage Users</span>
            </Link>
            <Link to="/admin/transactions" className="quick-action">
              <DollarSign size={24} />
              <span>Transactions</span>
            </Link>
            <Link to="/admin/disputes" className="quick-action">
              <AlertTriangle size={24} />
              <span>Disputes</span>
            </Link>
            <Link to="/admin/listings" className="quick-action">
              <Package size={24} />
              <span>Listings</span>
            </Link>
            <Link to="/admin/payouts" className="quick-action">
              <Wallet size={24} />
              <span>Payouts</span>
            </Link>
            <Link to="/admin/reports" className="quick-action">
              <TrendingUp size={24} />
              <span>Reports</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
