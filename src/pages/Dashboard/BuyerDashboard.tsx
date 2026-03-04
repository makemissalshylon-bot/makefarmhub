import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import ProductRecommendations from '../../components/Recommendations/ProductRecommendations';
import {
  ShoppingBag,
  Heart,
  DollarSign,
  Search,
  ArrowRight,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  MapPin,
} from 'lucide-react';

export default function BuyerDashboard() {
  const { user } = useAuth();
  const { orders, listings, favorites } = useAppData();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const featuredListings = listings.filter(l => l.featured).slice(0, 4);
  const myOrders = orders.filter(o => o.buyerId === user?.id).slice(0, 3);

  const activeOrders = orders.filter(o => o.buyerId === user?.id && !['completed', 'cancelled', 'delivered'].includes(o.status)).length;
  const completedOrders = orders.filter(o => o.buyerId === user?.id && (o.status === 'completed' || o.status === 'delivered')).length;
  const totalSpent = orders.filter(o => o.buyerId === user?.id && o.status === 'completed').reduce((sum, o) => sum + o.totalPrice, 0);

  const stats = [
    { label: 'Active Orders', value: activeOrders, icon: ShoppingBag, color: 'orange' },
    { label: 'Completed', value: completedOrders, icon: CheckCircle, color: 'green' },
    { label: 'Total Spent', value: `$${totalSpent.toLocaleString()}`, icon: DollarSign, color: 'blue' },
    { label: 'Saved Items', value: favorites.length, icon: Heart, color: 'red' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/marketplace');
    }
  };

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
          <p>Discover fresh produce from verified farmers.</p>
        </div>
        <Link to="/marketplace" className="btn-primary">
          <Search size={20} />
          Browse Marketplace
        </Link>
      </div>

      {/* Search Bar */}
      <div className="search-hero">
        <form className="search-box" onSubmit={handleSearch}>
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Search for crops, livestock, equipment..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn-search">Search</button>
        </form>
        <div className="search-tags">
          <span>Popular:</span>
          <Link to="/marketplace?q=tomatoes">Tomatoes</Link>
          <Link to="/marketplace?q=maize">Maize</Link>
          <Link to="/marketplace?q=chickens">Chickens</Link>
          <Link to="/marketplace?q=cattle">Cattle</Link>
        </div>
      </div>

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
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* My Orders */}
        <section className="dashboard-card">
          <div className="card-header">
            <h2>My Orders</h2>
            <Link to="/orders" className="link-more">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="orders-list">
            {myOrders.length > 0 ? (
              myOrders.map((order) => (
                <div key={order.id} className="order-item">
                  <img src={order.listingImage} alt={order.listingTitle} />
                  <div className="order-details">
                    <h4>{order.listingTitle}</h4>
                    <p>{order.sellerName} • {order.quantity} units</p>
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
                <Link to="/marketplace" className="btn-outline">Start shopping</Link>
              </div>
            )}
          </div>
        </section>

        {/* Featured Listings */}
        <section className="dashboard-card featured-section">
          <div className="card-header">
            <h2>Featured Products</h2>
            <Link to="/marketplace" className="link-more">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="featured-grid">
            {featuredListings.map((listing) => (
              <Link key={listing.id} to={`/listing/${listing.id}`} className="featured-card">
                <div className="featured-image">
                  <img src={listing.images[0]} alt={listing.title} />
                  <button className="btn-favorite">
                    <Heart size={18} />
                  </button>
                  {listing.featured && <span className="featured-badge">Featured</span>}
                </div>
                <div className="featured-info">
                  <h4>{listing.title}</h4>
                  <p className="featured-location">
                    <MapPin size={14} /> {listing.location}
                  </p>
                  <div className="featured-meta">
                    <span className="featured-price">${listing.price}/{listing.unit}</span>
                    <span className="featured-stock">{listing.quantity} available</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="dashboard-card categories-card">
          <h2>Browse by Category</h2>
          <div className="categories-grid">
            <Link to="/marketplace?category=crops" className="category-item">
              <span className="category-icon">🌾</span>
              <span>Crops</span>
            </Link>
            <Link to="/marketplace?category=livestock" className="category-item">
              <span className="category-icon">🐄</span>
              <span>Livestock</span>
            </Link>
            <Link to="/marketplace?category=poultry" className="category-item">
              <span className="category-icon">🐔</span>
              <span>Poultry</span>
            </Link>
            <Link to="/marketplace?category=vegetables" className="category-item">
              <span className="category-icon">🥬</span>
              <span>Vegetables</span>
            </Link>
            <Link to="/marketplace?category=fruits" className="category-item">
              <span className="category-icon">🍎</span>
              <span>Fruits</span>
            </Link>
            <Link to="/marketplace?category=equipment" className="category-item">
              <span className="category-icon">🚜</span>
              <span>Equipment</span>
            </Link>
          </div>
        </section>
      </div>

      {/* AI Product Recommendations */}
      <ProductRecommendations type="personalized" limit={4} />
      <ProductRecommendations type="trending" limit={4} />
    </div>
  );
}
