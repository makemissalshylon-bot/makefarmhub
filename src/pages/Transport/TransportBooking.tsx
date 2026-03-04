import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../components/UI/Toast';
import {
  Truck,
  MapPin,
  Calendar,
  Package,
  Star,
  Filter,
  Search,
  ChevronRight,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Thermometer,
  Weight,
  Phone,
  MessageSquare,
  X,
} from 'lucide-react';
import '../../styles/transport.css';

type VehicleFilter = 'all' | 'pickup' | 'truck' | 'lorry' | 'refrigerated';

interface BookingForm {
  orderId: string;
  vehicleId: string;
  pickupLocation: string;
  deliveryLocation: string;
  pickupDate: string;
  pickupTime: string;
  notes: string;
  cargoType: string;
  cargoWeight: string;
}

export default function TransportBooking() {
  const { user } = useAuth();
  const { bookTransport, orders, vehicles } = useAppData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<VehicleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    orderId: '',
    vehicleId: '',
    pickupLocation: user?.location || '',
    deliveryLocation: '',
    pickupDate: '',
    pickupTime: '',
    notes: '',
    cargoType: 'crops',
    cargoWeight: '',
  });

  // Get user's pending orders that need transport
  const pendingOrders = orders.filter(
    order => (order.buyerId === user?.id || order.sellerId === user?.id) && 
    !order.transporterId && 
    order.status === 'pending'
  );

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesFilter = filter === 'all' || vehicle.type === filter;
    const matchesSearch = vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vehicle.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vehicle.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch && vehicle.available;
  });

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'refrigerated':
        return <Thermometer size={20} />;
      default:
        return <Truck size={20} />;
    }
  };

  const getVehicleTypeLabel = (type: string) => {
    switch (type) {
      case 'pickup': return 'Pickup Truck';
      case 'truck': return 'Medium Truck';
      case 'lorry': return 'Heavy Lorry';
      case 'refrigerated': return 'Refrigerated';
      default: return type;
    }
  };

  const handleSelectVehicle = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setBookingForm({ ...bookingForm, vehicleId: vehicle.id });
    setShowBookingModal(true);
    setBookingStep(1);
    setBookingSuccess(false);
  };

  const handleBookingSubmit = () => {
    // Validate form
    if (!bookingForm.pickupLocation || !bookingForm.deliveryLocation || !bookingForm.pickupDate) {
      showToast('error', 'Please fill in all required fields');
      return;
    }

    // Create transport request
    bookTransport({
      orderId: bookingForm.orderId || 'new-order',
      vehicleId: selectedVehicle?.id || '',
      pickupLocation: bookingForm.pickupLocation,
      deliveryLocation: bookingForm.deliveryLocation,
      distance: 100, // Estimated distance
      estimatedPrice: parseFloat(String(calculateEstimatedPrice())),
      status: 'pending',
      scheduledDate: bookingForm.pickupDate,
    });

    setBookingSuccess(true);
    showToast('success', 'Transport booked successfully!');
    
    setTimeout(() => {
      setShowBookingModal(false);
      setBookingSuccess(false);
      setBookingStep(1);
      navigate('/transport/tracking');
    }, 2000);
  };

  const calculateEstimatedPrice = (): number => {
    if (!selectedVehicle) return 0;
    // Simplified calculation - in real app would use actual distance
    const estimatedDistance = 100; // km
    return selectedVehicle.pricePerKm * estimatedDistance;
  };
  
  const formatPrice = (price: number): string => price.toFixed(2);

  return (
    <div className="transport-booking-page">
      <div className="transport-header">
        <div className="header-content">
          <h1>
            <Truck size={28} />
            Book Transport
          </h1>
          <p>Find reliable transport for your agricultural products</p>
        </div>
        <button 
          className="btn-track"
          onClick={() => navigate('/transport/tracking')}
        >
          <MapPin size={18} />
          Track Deliveries
        </button>
      </div>

      {/* Quick Stats */}
      <div className="transport-stats">
        <div className="stat-card">
          <div className="stat-icon available">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{vehicles.filter(v => v.available).length}</span>
            <span className="stat-label">Available Vehicles</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{pendingOrders.length}</span>
            <span className="stat-label">Orders Need Transport</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rating">
            <Star size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">4.8</span>
            <span className="stat-label">Avg. Rating</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="transport-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by vehicle, location, or transporter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <Filter size={16} />
            All
          </button>
          <button
            className={`filter-tab ${filter === 'pickup' ? 'active' : ''}`}
            onClick={() => setFilter('pickup')}
          >
            Pickup
          </button>
          <button
            className={`filter-tab ${filter === 'truck' ? 'active' : ''}`}
            onClick={() => setFilter('truck')}
          >
            Truck
          </button>
          <button
            className={`filter-tab ${filter === 'lorry' ? 'active' : ''}`}
            onClick={() => setFilter('lorry')}
          >
            Lorry
          </button>
          <button
            className={`filter-tab ${filter === 'refrigerated' ? 'active' : ''}`}
            onClick={() => setFilter('refrigerated')}
          >
            <Thermometer size={16} />
            Cold Chain
          </button>
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="vehicles-grid">
        {filteredVehicles.length > 0 ? (
          filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="vehicle-card">
              <div className="vehicle-image">
                <img src={vehicle.image} alt={vehicle.name} />
                <span className={`availability-badge ${vehicle.available ? 'available' : 'busy'}`}>
                  {vehicle.available ? 'Available' : 'Busy'}
                </span>
                <span className="vehicle-type-badge">
                  {getVehicleIcon(vehicle.type)}
                  {getVehicleTypeLabel(vehicle.type)}
                </span>
              </div>
              <div className="vehicle-content">
                <h3>{vehicle.name}</h3>
                <div className="vehicle-owner">
                  <span>by {vehicle.ownerName}</span>
                  <div className="rating">
                    <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                    <span>{vehicle.rating}</span>
                    <span className="trips">({vehicle.trips} trips)</span>
                  </div>
                </div>
                <div className="vehicle-details">
                  <div className="detail">
                    <Weight size={16} />
                    <span>{vehicle.capacity}</span>
                  </div>
                  <div className="detail">
                    <MapPin size={16} />
                    <span>{vehicle.location}</span>
                  </div>
                </div>
                <div className="vehicle-footer">
                  <div className="price">
                    <DollarSign size={18} />
                    <span className="amount">${vehicle.pricePerKm.toFixed(2)}</span>
                    <span className="unit">/km</span>
                  </div>
                  <button 
                    className="btn-book"
                    onClick={() => handleSelectVehicle(vehicle)}
                    disabled={!vehicle.available}
                  >
                    Book Now
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Truck size={48} />
            <h3>No vehicles found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedVehicle && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowBookingModal(false)}>
              <X size={24} />
            </button>

            {bookingSuccess ? (
              <div className="booking-success">
                <div className="success-icon">
                  <CheckCircle size={64} />
                </div>
                <h2>Booking Confirmed!</h2>
                <p>Your transport request has been sent to {selectedVehicle.ownerName}</p>
                <p className="success-note">You'll receive a notification once they confirm.</p>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <h2>Book Transport</h2>
                  <div className="booking-steps">
                    <div className={`step ${bookingStep >= 1 ? 'active' : ''}`}>
                      <span>1</span>
                      Details
                    </div>
                    <div className={`step ${bookingStep >= 2 ? 'active' : ''}`}>
                      <span>2</span>
                      Schedule
                    </div>
                    <div className={`step ${bookingStep >= 3 ? 'active' : ''}`}>
                      <span>3</span>
                      Confirm
                    </div>
                  </div>
                </div>

                <div className="selected-vehicle-info">
                  <img src={selectedVehicle.image} alt={selectedVehicle.name} />
                  <div>
                    <h4>{selectedVehicle.name}</h4>
                    <p>{selectedVehicle.ownerName} • {selectedVehicle.capacity}</p>
                  </div>
                </div>

                {bookingStep === 1 && (
                  <div className="booking-step-content">
                    <h3>Cargo Details</h3>
                    
                    {pendingOrders.length > 0 && (
                      <div className="form-group">
                        <label>Link to Order (Optional)</label>
                        <select
                          value={bookingForm.orderId}
                          onChange={(e) => setBookingForm({ ...bookingForm, orderId: e.target.value })}
                        >
                          <option value="">Select an order...</option>
                          {pendingOrders.map(order => (
                            <option key={order.id} value={order.id}>
                              {order.listingTitle} - {order.quantity} units
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="form-row">
                      <div className="form-group">
                        <label>Cargo Type</label>
                        <select
                          value={bookingForm.cargoType}
                          onChange={(e) => setBookingForm({ ...bookingForm, cargoType: e.target.value })}
                        >
                          <option value="crops">Crops / Vegetables</option>
                          <option value="grains">Grains / Cereals</option>
                          <option value="livestock">Livestock</option>
                          <option value="dairy">Dairy Products</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Estimated Weight</label>
                        <input
                          type="text"
                          placeholder="e.g., 500 kg"
                          value={bookingForm.cargoWeight}
                          onChange={(e) => setBookingForm({ ...bookingForm, cargoWeight: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        <MapPin size={16} />
                        Pickup Location
                      </label>
                      <input
                        type="text"
                        placeholder="Enter pickup address"
                        value={bookingForm.pickupLocation}
                        onChange={(e) => setBookingForm({ ...bookingForm, pickupLocation: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <MapPin size={16} />
                        Delivery Location
                      </label>
                      <input
                        type="text"
                        placeholder="Enter delivery address"
                        value={bookingForm.deliveryLocation}
                        onChange={(e) => setBookingForm({ ...bookingForm, deliveryLocation: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {bookingStep === 2 && (
                  <div className="booking-step-content">
                    <h3>Schedule Pickup</h3>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>
                          <Calendar size={16} />
                          Pickup Date
                        </label>
                        <input
                          type="date"
                          value={bookingForm.pickupDate}
                          onChange={(e) => setBookingForm({ ...bookingForm, pickupDate: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <Clock size={16} />
                          Pickup Time
                        </label>
                        <input
                          type="time"
                          value={bookingForm.pickupTime}
                          onChange={(e) => setBookingForm({ ...bookingForm, pickupTime: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Special Instructions (Optional)</label>
                      <textarea
                        rows={3}
                        placeholder="Any special handling instructions, access codes, etc."
                        value={bookingForm.notes}
                        onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                      />
                    </div>

                    <div className="info-box">
                      <AlertCircle size={20} />
                      <div>
                        <strong>Flexible Scheduling</strong>
                        <p>The transporter will confirm the exact pickup time after accepting your request.</p>
                      </div>
                    </div>
                  </div>
                )}

                {bookingStep === 3 && (
                  <div className="booking-step-content">
                    <h3>Confirm Booking</h3>
                    
                    <div className="booking-summary">
                      <div className="summary-section">
                        <h4>Route</h4>
                        <div className="route-display">
                          <div className="route-point">
                            <div className="point-marker pickup"></div>
                            <div>
                              <span className="label">Pickup</span>
                              <span className="value">{bookingForm.pickupLocation || 'Not specified'}</span>
                            </div>
                          </div>
                          <div className="route-line"></div>
                          <div className="route-point">
                            <div className="point-marker delivery"></div>
                            <div>
                              <span className="label">Delivery</span>
                              <span className="value">{bookingForm.deliveryLocation || 'Not specified'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="summary-section">
                        <h4>Schedule</h4>
                        <div className="summary-row">
                          <span>Date:</span>
                          <span>{bookingForm.pickupDate || 'Not specified'}</span>
                        </div>
                        <div className="summary-row">
                          <span>Time:</span>
                          <span>{bookingForm.pickupTime || 'Flexible'}</span>
                        </div>
                      </div>

                      <div className="summary-section">
                        <h4>Cargo</h4>
                        <div className="summary-row">
                          <span>Type:</span>
                          <span>{bookingForm.cargoType}</span>
                        </div>
                        <div className="summary-row">
                          <span>Weight:</span>
                          <span>{bookingForm.cargoWeight || 'Not specified'}</span>
                        </div>
                      </div>

                      <div className="summary-section pricing">
                        <h4>Estimated Cost</h4>
                        <div className="price-breakdown">
                          <div className="summary-row">
                            <span>Transport (est. 100km):</span>
                            <span>${formatPrice(calculateEstimatedPrice())}</span>
                          </div>
                          <div className="summary-row">
                            <span>Platform Fee (5%):</span>
                            <span>${formatPrice(calculateEstimatedPrice() * 0.05)}</span>
                          </div>
                          <div className="summary-row total">
                            <span>Total Estimate:</span>
                            <span>${formatPrice(calculateEstimatedPrice() * 1.05)}</span>
                          </div>
                        </div>
                        <p className="price-note">
                          * Final price will be confirmed by the transporter based on actual distance
                        </p>
                      </div>
                    </div>

                    <div className="transporter-contact">
                      <h4>Contact Transporter</h4>
                      <div className="contact-buttons">
                        <button className="btn-contact">
                          <Phone size={18} />
                          Call
                        </button>
                        <button className="btn-contact">
                          <MessageSquare size={18} />
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  {bookingStep > 1 && (
                    <button 
                      className="btn-back"
                      onClick={() => setBookingStep(bookingStep - 1)}
                    >
                      Back
                    </button>
                  )}
                  {bookingStep < 3 ? (
                    <button 
                      className="btn-next"
                      onClick={() => setBookingStep(bookingStep + 1)}
                    >
                      Continue
                      <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button 
                      className="btn-confirm"
                      onClick={handleBookingSubmit}
                    >
                      <CheckCircle size={18} />
                      Confirm Booking
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
