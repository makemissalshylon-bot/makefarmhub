import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../components/UI/Toast';
import {
  ArrowLeft,
  Package,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  Phone,
  Shield,
  AlertTriangle,
  Download,
  Star,
  X,
  CreditCard,
} from 'lucide-react';
import '../../styles/order-detail.css';

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { orders, reviews: appReviews } = useAppData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [showDispute, setShowDispute] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="order-detail-page">
        <div className="not-found">
          <h2>Order not found</h2>
          <Link to="/orders" className="btn-primary">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const buyer = { id: order.buyerId, name: order.buyerName || 'Buyer', avatar: '', phone: '', email: '', location: '' };
  const seller = { id: order.sellerId, name: order.sellerName || 'Seller', avatar: '', phone: '', email: '', location: '' };
  const isBuyer = user?.id === order.buyerId;
  const isSeller = user?.id === order.sellerId;

  // Timeline steps based on order status
  const timelineSteps = [
    {
      id: 'placed',
      title: 'Order Placed',
      description: 'Your order has been placed successfully',
      time: order.createdAt,
      completed: true,
    },
    {
      id: 'accepted',
      title: 'Order Accepted',
      description: 'Seller has confirmed your order',
      time: order.status !== 'pending' ? order.createdAt : null,
      completed: ['accepted', 'in_transit', 'delivered', 'completed'].includes(order.status),
      active: order.status === 'accepted',
    },
    {
      id: 'in_transit',
      title: 'In Transit',
      description: 'Order is on the way to delivery location',
      time: order.status === 'in_transit' || order.status === 'delivered' || order.status === 'completed' ? order.createdAt : null,
      completed: ['delivered', 'completed'].includes(order.status),
      active: order.status === 'in_transit',
    },
    {
      id: 'delivered',
      title: 'Delivered',
      description: 'Order has been delivered',
      time: order.status === 'delivered' || order.status === 'completed' ? order.createdAt : null,
      completed: order.status === 'completed',
      active: order.status === 'delivered',
    },
    {
      id: 'completed',
      title: 'Completed',
      description: 'Payment released to seller',
      time: order.status === 'completed' ? order.createdAt : null,
      completed: order.status === 'completed',
      active: false,
    },
  ];

  const handleConfirmDelivery = () => {
    // API call would update order status to 'completed'
  };

  const handleCancelOrder = () => {
    // API call would update order status to 'cancelled'
  };

  const handleRaiseDispute = () => {
    setShowDispute(true);
    // Navigate to dispute form or show modal
  };

  const handleContactParticipant = (userId: string) => {
    navigate(`/messages?user=${userId}`);
  };

  const handleCallParticipant = (phone: string, name: string) => {
    showToast('info', `Calling ${name} at ${phone}...`);
    // In production, this would initiate a call via WebRTC or phone system
    window.location.href = `tel:${phone}`;
  };

  const handleDownloadInvoice = () => {
    setShowInvoice(true);
  };

  const handlePrintInvoice = () => {
    const printContent = invoiceRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice - Order #${order?.id}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; }
                .invoice-container { max-width: 800px; margin: 0 auto; }
                .invoice-header { display: flex; justify-content: space-between; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
                .invoice-logo { font-size: 24px; font-weight: 700; color: #16a34a; }
                .invoice-title { text-align: right; }
                .invoice-title h1 { font-size: 28px; color: #1e293b; }
                .invoice-title p { color: #64748b; margin-top: 4px; }
                .invoice-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                .invoice-party h3 { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
                .invoice-party p { margin: 4px 0; }
                .invoice-items { margin-bottom: 40px; }
                .invoice-items table { width: 100%; border-collapse: collapse; }
                .invoice-items th { background: #f8fafc; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
                .invoice-items td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
                .invoice-items td:last-child, .invoice-items th:last-child { text-align: right; }
                .invoice-totals { display: flex; justify-content: flex-end; }
                .invoice-totals-table { width: 300px; }
                .invoice-totals-table tr td { padding: 8px 0; }
                .invoice-totals-table tr td:last-child { text-align: right; font-weight: 500; }
                .invoice-totals-table tr.total td { font-size: 18px; font-weight: 700; color: #16a34a; border-top: 2px solid #e2e8f0; padding-top: 12px; }
                .invoice-footer { margin-top: 60px; text-align: center; color: #64748b; font-size: 14px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
                .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #dcfce7; color: #16a34a; }
                @media print { body { padding: 20px; } }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
    showToast('success', 'Invoice ready to print/save as PDF');
  };

  const handleSubmitReview = () => {
    const newReview = {
      orderId: order.id,
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment,
      targetId: isBuyer ? order.sellerId : order.buyerId,
    };
    alert('Review submitted successfully!');
    setShowReviewModal(false);
    setReviewRating(0);
    setReviewTitle('');
    setReviewComment('');
  };

  // Get existing review for this order
  const existingReview = appReviews.find(
    (r: any) => r.orderId === order.id && r.reviewerId === user?.id
  );

  // Get reviews about the other party
  const otherPartyId = isBuyer ? order.sellerId : order.buyerId;
  const otherPartyReviews = appReviews.filter((r: any) => r.targetId === otherPartyId).slice(0, 3);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="order-detail-page">
      <div className="order-detail-header">
        <div>
          <Link to="/orders" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', marginBottom: '0.5rem', textDecoration: 'none' }}>
            <ArrowLeft size={18} />
            Back to Orders
          </Link>
          <h1>Order #{order.id.slice(-8)}</h1>
        </div>
        <div className={`order-status-badge ${order.status}`}>
          <Package size={16} />
          {order.status.replace('_', ' ').toUpperCase()}
        </div>
      </div>

      <div className="order-detail-grid">
        {/* Main Content */}
        <div>
          {/* Order Info */}
          <div className="order-info-card">
            <h2>Order Information</h2>
            
            <div className="order-product">
              <img
                src={order.listingImage}
                alt={order.listingTitle}
                className="order-product-image"
              />
              <div className="order-product-info">
                <h3>{order.listingTitle}</h3>
                <div className="order-product-meta">
                  <span>Quantity: {order.quantity}</span>
                  <span>Unit Price: ${order.unitPrice}</span>
                </div>
                <div className="order-product-price">
                  Total: ${order.totalPrice.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="order-details-list">
              <div className="order-detail-item">
                <span className="order-detail-label">
                  <Calendar size={16} style={{ display: 'inline', marginRight: 6 }} />
                  Order Date
                </span>
                <span className="order-detail-value">{formatDate(order.createdAt)}</span>
              </div>
              
              <div className="order-detail-item">
                <span className="order-detail-label">
                  <MapPin size={16} style={{ display: 'inline', marginRight: 6 }} />
                  Delivery Address
                </span>
                <span className="order-detail-value">{order.deliveryAddress}</span>
              </div>

              <div className="order-detail-item">
                <span className="order-detail-label">
                  <Shield size={16} style={{ display: 'inline', marginRight: 6 }} />
                  Secure Payment Amount
                </span>
                <span className="order-detail-value highlight">
                  ${order.escrowAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="order-timeline-card">
            <h2>Order Timeline</h2>
            <div className="timeline">
              {timelineSteps.map((step) => (
                <div
                  key={step.id}
                  className={`timeline-item ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}
                >
                  <div className="timeline-marker" />
                  <div className="timeline-content">
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                    {step.time && (
                      <div className="timeline-time">
                        <Clock size={12} />
                        {formatDate(step.time)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="order-sidebar">
          {/* Actions */}
          <div className="order-actions-card">
            <h3>Actions</h3>
            
            {/* Pay Now button for buyers with pending payment */}
            {isBuyer && order.status === 'pending' && (
              <button className="order-action-btn pay-now" onClick={() => showToast('info', 'Opening payment options...')}>
                <CreditCard size={18} />
                Pay Now - ${order.escrowAmount.toFixed(2)}
              </button>
            )}

            {isBuyer && order.status === 'delivered' && (
              <button className="order-action-btn primary" onClick={handleConfirmDelivery}>
                <CheckCircle size={18} />
                Confirm Delivery
              </button>
            )}

            {(isBuyer || isSeller) && order.status === 'pending' && (
              <button className="order-action-btn danger" onClick={handleCancelOrder}>
                <AlertTriangle size={18} />
                Cancel Order
              </button>
            )}

            {(isBuyer || isSeller) && ['accepted', 'in_transit', 'delivered'].includes(order.status) && (
              <button className="order-action-btn danger" onClick={handleRaiseDispute}>
                <AlertTriangle size={18} />
                Raise Dispute
              </button>
            )}

            <button className="order-action-btn secondary" onClick={handleDownloadInvoice}>
              <Download size={18} />
              Download Invoice
            </button>

            {order.status === 'completed' && !existingReview && (
              <button className="order-action-btn success" onClick={() => setShowReviewModal(true)}>
                <Star size={18} />
                Write a Review
              </button>
            )}

            {existingReview && (
              <div className="review-submitted">
                <CheckCircle size={16} />
                <span>You've reviewed this order</span>
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="participants-card">
            <h3>Participants</h3>
            
            {seller && (
              <div className="participant-item">
                <img
                  src={seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name)}&background=0a6b2b&color=fff&size=44`}
                  alt={seller.name}
                  className="participant-avatar"
                />
                <div className="participant-info">
                  <h4>{seller.name}</h4>
                  <span className="participant-role">Seller</span>
                </div>
                <div className="participant-actions">
                  <button
                    className="participant-action-btn"
                    onClick={() => handleContactParticipant(seller.id)}
                    title="Message"
                  >
                    <MessageSquare size={16} />
                  </button>
                  {seller.phone && (
                    <button 
                      className="participant-action-btn" 
                      onClick={() => handleCallParticipant(seller.phone, seller.name)}
                      title="Call"
                    >
                      <Phone size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {buyer && (
              <div className="participant-item">
                <img
                  src={buyer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(buyer.name)}&background=0a6b2b&color=fff&size=44`}
                  alt={buyer.name}
                  className="participant-avatar"
                />
                <div className="participant-info">
                  <h4>{buyer.name}</h4>
                  <span className="participant-role">Buyer</span>
                </div>
                <div className="participant-actions">
                  <button
                    className="participant-action-btn"
                    onClick={() => handleContactParticipant(buyer.id)}
                    title="Message"
                  >
                    <MessageSquare size={16} />
                  </button>
                  {buyer.phone && (
                    <button 
                      className="participant-action-btn" 
                      onClick={() => handleCallParticipant(buyer.phone, buyer.name)}
                      title="Call"
                    >
                      <Phone size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="payment-summary-card">
            <h3>Payment Summary</h3>
            
            <div className="payment-item">
              <span>Subtotal</span>
              <span>${order.totalPrice.toFixed(2)}</span>
            </div>
            
            <div className="payment-item">
              <span>Platform Fee (5%)</span>
              <span>${(order.totalPrice * 0.05).toFixed(2)}</span>
            </div>
            
            <div className="payment-item total">
              <span>Total Amount</span>
              <span className="amount">${order.escrowAmount.toFixed(2)}</span>
            </div>

            <div className="escrow-status">
              <Shield size={16} />
              <span>Funds held in Secure Payment</span>
            </div>
          </div>

          {/* Seller Reviews */}
          {otherPartyReviews.length > 0 && (
            <div className="seller-reviews-card">
              <h3>
                {isBuyer ? 'Seller' : 'Buyer'} Reviews
                <span className="reviews-count">({otherPartyReviews.length})</span>
              </h3>
              
              <div className="reviews-list">
                {otherPartyReviews.map((review: any) => (
                  <div key={review.id} className="review-item-mini">
                    <div className="review-header-mini">
                      <img
                        src={review.reviewerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.reviewerName || review.authorName || 'User')}&background=0a6b2b&color=fff&size=32`}
                        alt={review.reviewerName || review.authorName || 'User'}
                      />
                      <div>
                        <span className="reviewer-name">{review.reviewerName || review.authorName || 'User'}</span>
                        <div className="review-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              fill={star <= review.rating ? '#f59e0b' : 'none'}
                              stroke={star <= review.rating ? '#f59e0b' : '#d1d5db'}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="review-comment-mini">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Write a Review</h2>
              <button className="close-btn" onClick={() => setShowReviewModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="review-target">
              <img
                src={isBuyer ? seller?.avatar : buyer?.avatar}
                alt={isBuyer ? seller?.name : buyer?.name}
              />
              <div>
                <p>Rate your experience with</p>
                <h4>{isBuyer ? seller?.name : buyer?.name}</h4>
              </div>
            </div>

            <div className="rating-selector">
              <p>Your Rating</p>
              <div className="stars-selector">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="star-btn"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setReviewRating(star)}
                  >
                    <Star
                      size={32}
                      fill={(hoveredRating || reviewRating) >= star ? '#f59e0b' : 'none'}
                      stroke={(hoveredRating || reviewRating) >= star ? '#f59e0b' : '#d1d5db'}
                    />
                  </button>
                ))}
              </div>
              <span className="rating-text">
                {reviewRating === 1 && 'Poor'}
                {reviewRating === 2 && 'Fair'}
                {reviewRating === 3 && 'Good'}
                {reviewRating === 4 && 'Very Good'}
                {reviewRating === 5 && 'Excellent'}
              </span>
            </div>

            <div className="form-group">
              <label>Review Title</label>
              <input
                type="text"
                placeholder="Summarize your experience"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Your Review</label>
              <textarea
                placeholder="Share your experience with this seller..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowReviewModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmitReview}
                disabled={!reviewRating || !reviewComment}
              >
                <Star size={16} />
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && order && (
        <div className="modal-overlay" onClick={() => setShowInvoice(false)}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="invoice-modal-header">
              <h2>Invoice Preview</h2>
              <div className="invoice-modal-actions">
                <button className="btn-print" onClick={handlePrintInvoice}>
                  <Download size={18} />
                  Print / Save PDF
                </button>
                <button className="btn-close-modal" onClick={() => setShowInvoice(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="invoice-preview" ref={invoiceRef}>
              <div className="invoice-container">
                <div className="invoice-header">
                  <div className="invoice-logo">
                    🌾 MAKEFARMHUB
                  </div>
                  <div className="invoice-title">
                    <h1>INVOICE</h1>
                    <p>#{order.id}</p>
                  </div>
                </div>

                <div className="invoice-parties">
                  <div className="invoice-party">
                    <h3>From (Seller)</h3>
                    <p><strong>{seller?.name}</strong></p>
                    <p>{seller?.email}</p>
                    <p>{seller?.phone}</p>
                    <p>{seller?.location}</p>
                  </div>
                  <div className="invoice-party">
                    <h3>To (Buyer)</h3>
                    <p><strong>{buyer?.name}</strong></p>
                    <p>{buyer?.email}</p>
                    <p>{buyer?.phone}</p>
                    <p>{order.deliveryAddress}</p>
                  </div>
                </div>

                <div className="invoice-meta">
                  <div><strong>Invoice Date:</strong> {formatDate(order.createdAt)}</div>
                  <div><strong>Status:</strong> <span className="status-badge">{order.status.replace('_', ' ')}</span></div>
                </div>

                <div className="invoice-items">
                  <table>
                    <thead>
                      <tr>
                        <th>Item Description</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{order.listingTitle}</td>
                        <td>{order.quantity}</td>
                        <td>${order.unitPrice.toFixed(2)}</td>
                        <td>${order.totalPrice.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="invoice-totals">
                  <table className="invoice-totals-table">
                    <tbody>
                      <tr>
                        <td>Subtotal</td>
                        <td>${order.totalPrice.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>Platform Fee (5%)</td>
                        <td>${(order.totalPrice * 0.05).toFixed(2)}</td>
                      </tr>
                      <tr className="total">
                        <td>Total Amount</td>
                        <td>${order.escrowAmount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="invoice-footer">
                  <p>Thank you for using MAKEFARMHUB!</p>
                  <p>For questions, contact support@makefarmhub.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
