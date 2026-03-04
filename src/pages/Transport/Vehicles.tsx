import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import {
  Plus,
  Search,
  Star,
  Truck,
  MapPin,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function Vehicles() {
  const { user } = useAuth();
  const { vehicles } = useAppData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Filter vehicles for current transporter
  const myVehicles = vehicles.filter((v) => v.ownerId === user?.id);

  const filteredVehicles = myVehicles.filter((vehicle) =>
    vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAvailability = (_vehicleId: string) => {
    // In real app, this would update the backend
  };

  return (
    <div className="vehicles-page">
      <div className="page-header">
        <div>
          <h1>My Vehicles</h1>
          <p>Manage your fleet and availability</p>
        </div>
        <Link to="/add-vehicle" className="btn-primary">
          <Plus size={20} />
          Add Vehicle
        </Link>
      </div>

      {/* Stats */}
      <div className="vehicles-stats">
        <div className="stat-card">
          <Truck size={24} />
          <div>
            <span className="stat-value">{myVehicles.length}</span>
            <span className="stat-label">Total Vehicles</span>
          </div>
        </div>
        <div className="stat-card available">
          <CheckCircle size={24} />
          <div>
            <span className="stat-value">{myVehicles.filter((v) => v.available).length}</span>
            <span className="stat-label">Available</span>
          </div>
        </div>
        <div className="stat-card busy">
          <XCircle size={24} />
          <div>
            <span className="stat-value">{myVehicles.filter((v) => !v.available).length}</span>
            <span className="stat-label">Busy</span>
          </div>
        </div>
        <div className="stat-card">
          <Star size={24} />
          <div>
            <span className="stat-value">
              {(myVehicles.reduce((acc, v) => acc + v.rating, 0) / myVehicles.length).toFixed(1)}
            </span>
            <span className="stat-label">Avg Rating</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="vehicles-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="vehicles-grid">
        {filteredVehicles.length > 0 ? (
          filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="vehicle-card-large">
              <div className="vehicle-image">
                <img src={vehicle.image} alt={vehicle.name} />
                <span className={`availability-badge ${vehicle.available ? 'available' : 'busy'}`}>
                  {vehicle.available ? 'Available' : 'Busy'}
                </span>
                <button
                  className="menu-btn"
                  onClick={() => setActiveMenu(activeMenu === vehicle.id ? null : vehicle.id)}
                >
                  <MoreVertical size={18} />
                </button>
                {activeMenu === vehicle.id && (
                  <div className="action-menu">
                    <button onClick={() => toggleAvailability(vehicle.id)}>
                      {vehicle.available ? <XCircle size={16} /> : <CheckCircle size={16} />}
                      {vehicle.available ? 'Mark as Busy' : 'Mark as Available'}
                    </button>
                    <Link to={`/edit-vehicle/${vehicle.id}`}>
                      <Edit size={16} /> Edit Details
                    </Link>
                    <button className="delete">
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                )}
              </div>
              <div className="vehicle-details">
                <div className="vehicle-header">
                  <h3>{vehicle.name}</h3>
                  <span className="vehicle-type">{vehicle.type}</span>
                </div>
                <div className="vehicle-specs">
                  <div className="spec">
                    <span className="spec-label">Capacity</span>
                    <span className="spec-value">{vehicle.capacity}</span>
                  </div>
                  <div className="spec">
                    <span className="spec-label">Rate</span>
                    <span className="spec-value">${vehicle.pricePerKm}/km</span>
                  </div>
                </div>
                <div className="vehicle-location">
                  <MapPin size={14} />
                  {vehicle.location}
                </div>
                <div className="vehicle-stats">
                  <span className="rating">
                    <Star size={14} fill="#f7b733" color="#f7b733" />
                    {vehicle.rating}
                  </span>
                  <span className="trips">
                    <Truck size={14} />
                    {vehicle.trips} trips
                  </span>
                </div>
                <div className="vehicle-actions">
                  <button
                    className={`btn-toggle ${vehicle.available ? 'available' : ''}`}
                    onClick={() => toggleAvailability(vehicle.id)}
                  >
                    {vehicle.available ? 'Set Unavailable' : 'Set Available'}
                  </button>
                  <Link to={`/vehicle/${vehicle.id}`} className="btn-view">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Truck size={48} />
            <h3>No vehicles found</h3>
            <p>Add your first vehicle to start receiving transport requests</p>
            <Link to="/add-vehicle" className="btn-primary">
              <Plus size={20} />
              Add Vehicle
            </Link>
          </div>
        )}

        {/* Add Vehicle Card */}
        <Link to="/add-vehicle" className="add-vehicle-card">
          <Plus size={32} />
          <span>Add New Vehicle</span>
        </Link>
      </div>
    </div>
  );
}
