import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import {
  Truck,
  Package,
  DollarSign,
  Star,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  MapPin,
  Navigation,
  MessageSquare,
} from 'lucide-react';

export default function TransporterDashboard() {
  const { user } = useAuth();
  const { vehicles, transportRequests, walletBalance } = useAppData();
  const myVehicles = vehicles.filter(v => v.ownerId === user?.id);
  const requests = transportRequests.filter(r => r.transporterId === user?.id || r.status === 'pending').slice(0, 3);

  const activeTrips = transportRequests.filter(r => r.transporterId === user?.id && r.status === 'in_progress').length;
  const pendingRequests = transportRequests.filter(r => r.status === 'pending').length;
  const completedTrips = transportRequests.filter(r => r.transporterId === user?.id && r.status === 'completed');
  const totalEarnings = completedTrips.reduce((sum, r) => sum + (r.estimatedPrice || 0), 0);

  const stats = [
    { label: 'Active Trips', value: activeTrips, icon: Navigation, color: 'blue' },
    { label: 'Pending Requests', value: pendingRequests, icon: Package, color: 'orange' },
    { label: 'Earnings', value: `$${totalEarnings.toLocaleString()}`, icon: DollarSign, color: 'gold' },
    { label: 'Vehicles', value: myVehicles.length, icon: Star, color: 'green' },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: typeof Clock; class: string; label: string }> = {
      pending: { icon: Clock, class: 'status-pending', label: 'Pending' },
      accepted: { icon: CheckCircle, class: 'status-accepted', label: 'Accepted' },
      in_progress: { icon: Navigation, class: 'status-transit', label: 'In Progress' },
      completed: { icon: CheckCircle, class: 'status-completed', label: 'Completed' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge ${config.class}`}>
        <config.icon size={14} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.name?.split(' ')[0]}! 🚚</h1>
          <p>Manage your vehicles and transport requests.</p>
        </div>
        <Link to="/my-vehicles" className="btn-primary">
          <Plus size={20} />
          Add Vehicle
        </Link>
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
        {/* Transport Requests */}
        <section className="dashboard-card">
          <div className="card-header">
            <h2>Transport Requests</h2>
            <Link to="/transport/booking" className="link-more">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="transport-requests-list">
            {requests.map((request) => (
              <div key={request.id} className="transport-request-item">
                <div className="request-route">
                  <div className="route-point pickup">
                    <MapPin size={16} />
                    <span>{request.pickupLocation}</span>
                  </div>
                  <div className="route-line">
                    <span>{request.distance} km</span>
                  </div>
                  <div className="route-point delivery">
                    <MapPin size={16} />
                    <span>{request.deliveryLocation}</span>
                  </div>
                </div>
                <div className="request-details">
                  <div className="request-meta">
                    <span className="request-price">${request.estimatedPrice}</span>
                    <span className="request-date">{request.scheduledDate}</span>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                {request.status === 'pending' && (
                  <div className="request-actions">
                    <button className="btn-accept">Accept</button>
                    <button className="btn-decline">Decline</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* My Vehicles */}
        <section className="dashboard-card">
          <div className="card-header">
            <h2>My Vehicles</h2>
            <Link to="/my-vehicles" className="link-more">
              Manage <ArrowRight size={16} />
            </Link>
          </div>
          <div className="vehicles-list">
            {myVehicles.map((vehicle) => (
              <div key={vehicle.id} className="vehicle-card">
                <img src={vehicle.image} alt={vehicle.name} />
                <div className="vehicle-info">
                  <h4>{vehicle.name}</h4>
                  <p>{vehicle.type} • {vehicle.capacity}</p>
                  <div className="vehicle-meta">
                    <span className="vehicle-price">${vehicle.pricePerKm}/km</span>
                    <span className={`availability ${vehicle.available ? 'available' : 'unavailable'}`}>
                      {vehicle.available ? 'Available' : 'Busy'}
                    </span>
                  </div>
                  <div className="vehicle-stats">
                    <span><Star size={14} /> {vehicle.rating}</span>
                    <span><Truck size={14} /> {vehicle.trips} trips</span>
                  </div>
                </div>
              </div>
            ))}
            <Link to="/my-vehicles" className="add-vehicle-card">
              <Plus size={32} />
              <span>Add New Vehicle</span>
            </Link>
          </div>
        </section>

        {/* Earnings Summary */}
        <section className="dashboard-card earnings-card">
          <h2>Earnings Overview</h2>
          <div className="earnings-content">
            <div className="earnings-main">
              <span className="earnings-label">Total Earnings</span>
              <span className="earnings-value">${totalEarnings.toLocaleString()}</span>
            </div>
            <div className="earnings-breakdown">
              <div className="breakdown-item">
                <span>Completed Trips</span>
                <strong>{completedTrips.length}</strong>
              </div>
              <div className="breakdown-item">
                <span>Avg per Trip</span>
                <strong>${completedTrips.length > 0 ? Math.round(totalEarnings / completedTrips.length) : 0}</strong>
              </div>
            </div>
          </div>
          <Link to="/wallet" className="btn-outline">
            View detailed report
          </Link>
        </section>

        {/* Quick Actions */}
        <section className="dashboard-card quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/my-vehicles" className="action-btn">
              <Plus size={24} />
              <span>Add Vehicle</span>
            </Link>
            <Link to="/transport/booking" className="action-btn">
              <Package size={24} />
              <span>View Requests</span>
            </Link>
            <Link to="/transport/tracking" className="action-btn">
              <Navigation size={24} />
              <span>Active Trips</span>
            </Link>
            <Link to="/messages" className="action-btn">
              <MessageSquare size={24} />
              <span>Messages</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
