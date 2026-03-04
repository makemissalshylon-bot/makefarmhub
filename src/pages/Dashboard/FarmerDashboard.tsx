import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import CommissionBanner from './CommissionBanner';
import WeatherWidget from '../../components/Weather/WeatherWidget';
import {
  Package,
  ShoppingBag,
  DollarSign,
  Eye,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { orders, listings, walletBalance } = useAppData();
  const myListings = listings.filter(l => l.sellerId === user?.id);
  const myOrders = orders.filter(o => o.sellerId === user?.id);
  
  // Calculate stats from real data
  const totalSales = myOrders.filter(o => o.status === 'completed' || o.status === 'delivered').reduce((sum, o) => sum + o.totalPrice, 0);
  const totalViews = myListings.reduce((sum, l) => sum + (l.views || 0), 0);
  const activeListings = myListings.filter(l => l.status === 'active' || !l.status).length;
  const pendingOrders = myOrders.filter(o => o.status === 'pending').length;

  const stats = [
    { label: 'Total Sales', value: `$${totalSales.toLocaleString()}`, icon: DollarSign, color: 'gold', change: '+12.5%' },
    { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'blue', change: '+8.3%' },
    { label: 'Active Listings', value: activeListings, icon: Package, color: 'green', change: null },
    { label: 'Pending Orders', value: pendingOrders, icon: ShoppingBag, color: 'orange', change: null },
  ];
  
  const recentOrders = myOrders.slice(0, 3);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: typeof Clock; class: string }> = {
      pending: { icon: Clock, class: 'status-pending' },
      accepted: { icon: CheckCircle, class: 'status-accepted' },
      in_transit: { icon: TrendingUp, class: 'status-transit' },
      delivered: { icon: CheckCircle, class: 'status-delivered' },
      completed: { icon: CheckCircle, class: 'status-completed' },
      disputed: { icon: AlertCircle, class: 'status-disputed' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge ${config.class}`}>
        <config.icon size={14} />
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.name?.split(' ')[0]}! 👋</h1>
          <p>Here's what's happening with your farm today.</p>
        </div>
        <div className="header-actions">
          <Link to="/create-listing" className="btn-primary">
            <Plus size={20} />
            Add Produce
          </Link>
          <span className="btn-subtitle">List produce or livestock</span>
        </div>
      </div>

      {/* Commission Banner */}
      <CommissionBanner />

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-card stat-${stat.color}`}>
            <div className="stat-icon">
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
              {stat.change && (
                <span className="stat-change positive">
                  <TrendingUp size={14} /> {stat.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Recent Orders */}
        <section className="dashboard-card">
          <div className="card-header">
            <h2>Recent Orders</h2>
            <Link to="/orders" className="link-more">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="orders-list">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="order-item">
                  <img src={order.listingImage} alt={order.listingTitle} />
                  <div className="order-details">
                    <h4>{order.listingTitle}</h4>
                    <p>{order.buyerName} • {order.quantity} units</p>
                    <div className="order-meta">
                      <span className="order-price">${order.totalPrice}</span>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <ShoppingBag size={40} />
                <p>No orders yet</p>
              </div>
            )}
          </div>
        </section>

        {/* My Listings */}
        <section className="dashboard-card">
          <div className="card-header">
            <h2>My Listings</h2>
            <Link to="/my-listings" className="link-more">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="listings-mini-grid">
            {myListings.map((listing) => (
              <Link key={listing.id} to={`/listing/${listing.id}`} className="listing-mini-card">
                <img src={listing.images[0]} alt={listing.title} />
                <div className="listing-mini-info">
                  <h4>{listing.title}</h4>
                  <div className="listing-mini-meta">
                    <span className="price">${listing.price}/{listing.unit}</span>
                    <span className="views"><Eye size={14} /> {listing.views}</span>
                  </div>
                  <span className={`status-dot status-${listing.status}`}>
                    {listing.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="dashboard-card quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/create-listing" className="action-btn">
              <Plus size={24} />
              <span>Add Produce</span>
            </Link>
            <Link to="/orders" className="action-btn">
              <ShoppingBag size={24} />
              <span>View Orders</span>
            </Link>
            <Link to="/messages" className="action-btn">
              <MessageSquare size={24} />
              <span>Messages</span>
            </Link>
            <Link to="/wallet" className="action-btn">
              <DollarSign size={24} />
              <span>Earnings</span>
            </Link>
          </div>
        </section>

        {/* Earnings Summary */}
        {/* Weather Widget */}
        <section className="dashboard-card weather-card">
          <WeatherWidget compact={false} />
        </section>

        <section className="dashboard-card earnings-card">
          <h2>Earnings Overview</h2>
          <div className="earnings-content">
            <div className="earnings-main">
              <span className="earnings-label">Total Earnings</span>
              <span className="earnings-value">${totalSales.toLocaleString()}</span>
            </div>
            <div className="earnings-chart">
              <div className="chart-bar" style={{ height: '60%' }}><span>Sep</span></div>
              <div className="chart-bar" style={{ height: '80%' }}><span>Oct</span></div>
              <div className="chart-bar active" style={{ height: '45%' }}><span>Nov</span></div>
            </div>
          </div>
          <Link to="/wallet" className="btn-outline">
            View detailed report
          </Link>
        </section>
      </div>
    </div>
  );
}
