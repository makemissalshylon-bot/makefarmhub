import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../components/UI/Toast';
import {
  Truck,
  MapPin,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  MessageSquare,
  Navigation,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Camera,
  FileText,
  Star,
  X,
} from 'lucide-react';
import '../../styles/transport.css';

type TabType = 'active' | 'completed' | 'all';

interface DeliveryConfirmation {
  photos: string[];
  signature: boolean;
  notes: string;
  rating: number;
}

export default function TransportTracking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmationData, setConfirmationData] = useState<DeliveryConfirmation>({
    photos: [],
    signature: false,
    notes: '',
    rating: 5,
  });

  const { transportRequests, orders, vehicles } = useAppData();

  // Enhanced transport requests with more details
  const enhancedRequests = transportRequests.map(req => {
    const order = orders.find(o => o.id === req.orderId);
    const vehicle = vehicles.find(v => v.id === req.vehicleId);
    return {
      ...req,
      order,
      vehicle,
      estimatedArrival: '2:30 PM',
      currentLocation: 'En route',
      progress: req.status === 'in_progress' ? 65 : req.status === 'completed' ? 100 : 0,
    };
  });

  const filteredRequests = enhancedRequests.filter(req => {
    if (activeTab === 'active') return req.status === 'in_progress' || req.status === 'pending';
    if (activeTab === 'completed') return req.status === 'completed';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'pending';
      case 'accepted': return 'accepted';
      case 'in_progress': return 'in-progress';
      case 'completed': return 'completed';
      default: return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Awaiting Pickup';
      case 'accepted': return 'Confirmed';
      case 'in_progress': return 'In Transit';
      case 'completed': return 'Delivered';
      default: return status;
    }
  };

  const handleConfirmDelivery = () => {
    if (!confirmationData.signature) {
      showToast('error', 'Please confirm delivery by checking the confirmation box');
      return;
    }
    showToast('success', 'Delivery confirmed successfully!');
    setShowConfirmModal(false);
    setConfirmationData({ photos: [], signature: false, notes: '', rating: 5 });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    showToast('info', 'Refreshing delivery status...');
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('success', 'Delivery status updated!');
    }, 1500);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos: string[] = [];
      Array.from(files).forEach((file) => {
        if (file.size > 5 * 1024 * 1024) {
          showToast('error', 'Each image must be less than 5MB');
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          newPhotos.push(ev.target?.result as string);
          if (newPhotos.length === files.length) {
            setConfirmationData(prev => ({
              ...prev,
              photos: [...prev.photos, ...newPhotos]
            }));
            showToast('success', `${newPhotos.length} photo(s) added`);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setConfirmationData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="transport-tracking-page">
      <div className="tracking-header">
        <button className="btn-back" onClick={() => navigate('/transport/booking')}>
          <ArrowLeft size={20} />
          Back to Booking
        </button>
        <div className="header-content">
          <h1>
            <Navigation size={28} />
            Track Deliveries
          </h1>
          <p>Monitor your shipments in real-time</p>
        </div>
        <button 
          className={`btn-refresh ${isRefreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw size={18} className={isRefreshing ? 'spin' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Tabs */}
      <div className="tracking-tabs">
        <button
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <Truck size={18} />
          Active
          <span className="count">{enhancedRequests.filter(r => r.status === 'in_progress' || r.status === 'pending').length}</span>
        </button>
        <button
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <CheckCircle size={18} />
          Completed
        </button>
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Package size={18} />
          All
        </button>
      </div>

      {/* Tracking List */}
      <div className="tracking-content">
        <div className="tracking-list">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <div 
                key={request.id} 
                className={`tracking-card ${selectedRequest?.id === request.id ? 'selected' : ''}`}
                onClick={() => setSelectedRequest(request)}
              >
                <div className="tracking-card-header">
                  <div className="order-info">
                    <span className="order-id">#{request.orderId}</span>
                    <span className={`status-badge ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                  {request.status === 'in_progress' && (
                    <div className="eta">
                      <Clock size={14} />
                      ETA: {request.estimatedArrival}
                    </div>
                  )}
                </div>

                <div className="tracking-card-body">
                  <div className="route-mini">
                    <div className="route-point">
                      <div className="point-dot pickup"></div>
                      <span>{request.pickupLocation}</span>
                    </div>
                    <div className="route-arrow">→</div>
                    <div className="route-point">
                      <div className="point-dot delivery"></div>
                      <span>{request.deliveryLocation}</span>
                    </div>
                  </div>

                  {request.status === 'in_progress' && (
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${request.progress}%` }}
                      ></div>
                      <span className="progress-text">{request.progress}% Complete</span>
                    </div>
                  )}

                  <div className="tracking-card-footer">
                    <div className="vehicle-info">
                      {request.vehicle && (
                        <>
                          <Truck size={16} />
                          <span>{request.vehicle.name}</span>
                        </>
                      )}
                    </div>
                    <div className="schedule">
                      <Calendar size={14} />
                      <span>{request.scheduledDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Package size={48} />
              <h3>No deliveries found</h3>
              <p>You don't have any {activeTab} deliveries</p>
              <button 
                className="btn-book-now"
                onClick={() => navigate('/transport/booking')}
              >
                Book Transport
              </button>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedRequest && (
          <div className="tracking-detail">
            <div className="detail-header">
              <h2>Delivery Details</h2>
              <button className="btn-close" onClick={() => setSelectedRequest(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="detail-content">
              {/* Status Timeline */}
              <div className="status-timeline">
                <div className={`timeline-item ${selectedRequest.status !== 'pending' ? 'completed' : 'active'}`}>
                  <div className="timeline-icon">
                    <Package size={18} />
                  </div>
                  <div className="timeline-content">
                    <h4>Order Placed</h4>
                    <p>Transport request submitted</p>
                  </div>
                </div>
                <div className={`timeline-item ${selectedRequest.status === 'in_progress' || selectedRequest.status === 'completed' ? 'completed' : selectedRequest.status === 'accepted' ? 'active' : ''}`}>
                  <div className="timeline-icon">
                    <CheckCircle size={18} />
                  </div>
                  <div className="timeline-content">
                    <h4>Confirmed</h4>
                    <p>Transporter accepted the request</p>
                  </div>
                </div>
                <div className={`timeline-item ${selectedRequest.status === 'in_progress' ? 'active' : selectedRequest.status === 'completed' ? 'completed' : ''}`}>
                  <div className="timeline-icon">
                    <Truck size={18} />
                  </div>
                  <div className="timeline-content">
                    <h4>In Transit</h4>
                    {selectedRequest.status === 'in_progress' && (
                      <p className="current-location">
                        <MapPin size={14} />
                        Currently at: {selectedRequest.currentLocation}
                      </p>
                    )}
                  </div>
                </div>
                <div className={`timeline-item ${selectedRequest.status === 'completed' ? 'completed' : ''}`}>
                  <div className="timeline-icon">
                    <CheckCircle size={18} />
                  </div>
                  <div className="timeline-content">
                    <h4>Delivered</h4>
                    <p>Package delivered successfully</p>
                  </div>
                </div>
              </div>

              {/* Route Map — OpenStreetMap embed (Harare corridor fallback when GPS unavailable) */}
              <div className="route-map">
                <div className="map-placeholder enhanced">
                  <iframe
                    title="Delivery route map"
                    className="route-map-iframe"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=30.95%2C-17.95%2C31.15%2C-17.75&layer=mapnik&marker=-17.8292%2C31.0522`}
                    style={{ width: '100%', height: 220, border: 0, borderRadius: 8 }}
                  />
                  <div className="map-route-visual">
                    <div className="route-line"></div>
                    <div className="pickup-marker">
                      <MapPin size={20} />
                      <span>Pickup</span>
                    </div>
                    <div className="truck-marker" style={{ left: `${selectedRequest.status === 'in_progress' ? 45 : selectedRequest.status === 'completed' ? 95 : 10}%` }}>
                      <Truck size={24} />
                    </div>
                    <div className="delivery-marker">
                      <MapPin size={20} />
                      <span>Delivery</span>
                    </div>
                  </div>
                  <div className="map-info">
                    <Navigation size={20} />
                    <div>
                      <p>{selectedRequest.status === 'in_progress' ? 'En route' : selectedRequest.status === 'completed' ? 'Delivered' : 'Awaiting pickup'}</p>
                      <span>{selectedRequest.status === 'in_progress' ? '45' : selectedRequest.status === 'completed' ? '95' : '10'}% of journey completed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="delivery-info-section">
                <h3>Route Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Distance</span>
                    <span className="value">{selectedRequest.distance} km</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Estimated Cost</span>
                    <span className="value">${selectedRequest.estimatedPrice}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Scheduled Date</span>
                    <span className="value">{selectedRequest.scheduledDate}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Status</span>
                    <span className={`value status ${getStatusColor(selectedRequest.status)}`}>
                      {getStatusLabel(selectedRequest.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transporter Info */}
              {selectedRequest.vehicle && (
                <div className="transporter-section">
                  <h3>Transporter</h3>
                  <div className="transporter-card">
                    <img 
                      src={selectedRequest.vehicle.image} 
                      alt={selectedRequest.vehicle.name}
                      className="vehicle-thumb"
                    />
                    <div className="transporter-info">
                      <h4>{selectedRequest.vehicle.ownerName}</h4>
                      <p>{selectedRequest.vehicle.name} • {selectedRequest.vehicle.capacity}</p>
                      <div className="rating">
                        <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                        <span>{selectedRequest.vehicle.rating}</span>
                        <span className="trips">({selectedRequest.vehicle.trips} trips)</span>
                      </div>
                    </div>
                    <div className="contact-actions">
                      <button className="btn-icon" title="Call">
                        <Phone size={18} />
                      </button>
                      <button className="btn-icon" title="Message">
                        <MessageSquare size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="detail-actions">
                {selectedRequest.status === 'in_progress' && (
                  <button 
                    className="btn-confirm-delivery"
                    onClick={() => setShowConfirmModal(true)}
                  >
                    <CheckCircle size={18} />
                    Confirm Delivery
                  </button>
                )}
                {selectedRequest.status === 'pending' && (
                  <button className="btn-cancel">
                    <X size={18} />
                    Cancel Request
                  </button>
                )}
                <button className="btn-report">
                  <AlertCircle size={18} />
                  Report Issue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delivery Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowConfirmModal(false)}>
              <X size={24} />
            </button>

            <div className="modal-header">
              <CheckCircle size={32} className="success-icon" />
              <h2>Confirm Delivery</h2>
              <p>Please verify that you have received your delivery</p>
            </div>

            <div className="confirm-content">
              {/* Photo Upload */}
              <div className="confirm-section">
                <h4>
                  <Camera size={18} />
                  Delivery Photos (Optional)
                </h4>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <div className="photo-upload">
                  {confirmationData.photos.length > 0 && (
                    <div className="photo-preview-grid">
                      {confirmationData.photos.map((photo, index) => (
                        <div key={index} className="photo-preview-item">
                          <img src={photo} alt={`Delivery photo ${index + 1}`} />
                          <button 
                            className="remove-photo"
                            onClick={() => removePhoto(index)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button 
                    className="upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={24} />
                    <span>{confirmationData.photos.length > 0 ? 'Add More' : 'Add Photo'}</span>
                  </button>
                  <p>Take photos of the delivered goods for your records</p>
                </div>
              </div>

              {/* Condition Check */}
              <div className="confirm-section">
                <h4>
                  <Package size={18} />
                  Delivery Condition
                </h4>
                <div className="condition-options">
                  <label className="condition-option">
                    <input type="radio" name="condition" value="good" defaultChecked />
                    <span className="option-content">
                      <CheckCircle size={20} className="good" />
                      <span>Good Condition</span>
                    </span>
                  </label>
                  <label className="condition-option">
                    <input type="radio" name="condition" value="damaged" />
                    <span className="option-content">
                      <AlertCircle size={20} className="damaged" />
                      <span>Some Damage</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Rating */}
              <div className="confirm-section">
                <h4>
                  <Star size={18} />
                  Rate the Transporter
                </h4>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`star-btn ${star <= confirmationData.rating ? 'active' : ''}`}
                      onClick={() => setConfirmationData({ ...confirmationData, rating: star })}
                    >
                      <Star 
                        size={28} 
                        fill={star <= confirmationData.rating ? '#f59e0b' : 'none'}
                        stroke="#f59e0b"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="confirm-section">
                <h4>
                  <FileText size={18} />
                  Additional Notes (Optional)
                </h4>
                <textarea
                  rows={3}
                  placeholder="Any comments about the delivery..."
                  value={confirmationData.notes}
                  onChange={(e) => setConfirmationData({ ...confirmationData, notes: e.target.value })}
                />
              </div>

              {/* Signature */}
              <div className="confirm-section signature-section">
                <label className="signature-checkbox">
                  <input
                    type="checkbox"
                    checked={confirmationData.signature}
                    onChange={(e) => setConfirmationData({ ...confirmationData, signature: e.target.checked })}
                  />
                  <span>I confirm that I have received the delivery in the condition stated above</span>
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-confirm"
                onClick={handleConfirmDelivery}
                disabled={!confirmationData.signature}
              >
                <CheckCircle size={18} />
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
