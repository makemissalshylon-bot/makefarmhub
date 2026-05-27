import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../components/UI/Toast';
import {
  Search,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  XCircle,
  MessageSquare,
  Eye,
  ChevronRight,
  Download,
  CreditCard,
  X,
  Smartphone,
  MapPin,
} from 'lucide-react';

type OrderFilter = 'all' | 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'completed' | 'disputed';

export default function Orders() {
  const { user } = useAuth();
  const { orders, updateOrderStatus } = useAppData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderFilter>('all');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('ecocash');
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Get orders based on user role
  const myOrders = orders.filter((order) => {
    if (user?.role === 'farmer') return order.sellerId === 'farmer-1';
    if (user?.role === 'buyer') return order.buyerId === 'buyer-1';
    if (user?.role === 'transporter') return order.transporterId === 'transporter-1';
    return false;
  });

  const handleExportOrders = () => {
    if (myOrders.length === 0) {
      showToast('error', 'No orders to export');
      return;
    }
    
    setIsExporting(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      // Generate CSV content
      const headers = ['Order ID', 'Product', 'Status', 'Quantity', 'Unit Price', 'Total', 'Date', 'Delivery Address'];
      const rows = myOrders.map(order => [
        order.id,
        order.listingTitle,
        order.status,
        order.quantity,
        order.unitPrice,
        order.totalPrice,
        order.createdAt,
        order.deliveryAddress
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `makefarmhub-orders-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      showToast('success', `${myOrders.length} orders exported successfully!`);
      setIsExporting(false);
    }, 300);
  };

  // Helper function to get date in readable format
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Handle opening chat
  const handleOpenChat = (orderId: string) => {
    setChatOrderId(orderId);
    setShowChatModal(true);
  };

  const filteredOrders = myOrders
    .filter((order) => {
      const matchesSearch =
        order.listingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    // Sort: recent purchases and active orders at top
    .sort((a, b) => {
      const now = Date.now();
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      const aIsRecent = (now - aDate) < oneDayMs;
      const bIsRecent = (now - bDate) < oneDayMs;
      const aIsActive = ['pending', 'accepted', 'in_transit'].includes(a.status);
      const bIsActive = ['pending', 'accepted', 'in_transit'].includes(b.status);
      
      // Very recent orders (last 24h) at the very top
      if (aIsRecent && !bIsRecent) return -1;
      if (!aIsRecent && bIsRecent) return 1;
      
      // Then active orders
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      
      // Finally sort by date (newest first)
      return bDate - aDate;
    });

  // Handle Pay Now
  const handlePayNow = (orderId: string) => {
    setSelectedOrder(orderId);
    setShowPayModal(true);
  };

  const confirmPayment = () => {
    if (selectedOrder) {
      updateOrderStatus(selectedOrder, 'accepted');
      showToast('success', 'Payment successful! Seller has been notified.');
      setShowPayModal(false);
      
      // Auto-open chat thread after payment
      handleOpenChat(selectedOrder);
      setSelectedOrder(null);
    }
  };

  // Handle Cancel with reason
  const handleCancelClick = (orderId: string) => {
    setSelectedOrder(orderId);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const submitCancelRequest = () => {
    if (!cancelReason.trim()) {
      showToast('error', 'Please provide a reason for cancellation');
      return;
    }
    showToast('info', 'Cancellation request submitted. We will review and respond shortly.');
    setShowCancelModal(false);
    setSelectedOrder(null);
    setCancelReason('');
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: typeof Clock; class: string; label: string }> = {
      pending: { icon: Clock, class: 'status-pending', label: 'Pending' },
      accepted: { icon: CheckCircle, class: 'status-accepted', label: 'Accepted' },
      in_transit: { icon: Truck, class: 'status-transit', label: 'In Transit' },
      delivered: { icon: CheckCircle, class: 'status-delivered', label: 'Delivered' },
      completed: { icon: CheckCircle, class: 'status-completed', label: 'Completed' },
      disputed: { icon: AlertCircle, class: 'status-disputed', label: 'Disputed' },
      cancelled: { icon: XCircle, class: 'status-cancelled', label: 'Cancelled' },
    };
    return configs[status] || configs.pending;
  };

  const statusTabs: { id: OrderFilter; label: string }[] = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'in_transit', label: 'In Transit' },
    { id: 'completed', label: 'Completed' },
    { id: 'disputed', label: 'Disputed' },
  ];

  return (
    <div className="orders-page">
      <div className="page-header">
        <div>
          <h1>{user?.role === 'farmer' ? 'Orders Received' : 'My Orders'}</h1>
          <p className="header-subtitle">
            {user?.role === 'farmer'
              ? 'New orders appear at the top. Tap any order to see details or message buyers.'
              : 'New orders appear at the top. See order status and message sellers at any time.'}
          </p>
        </div>
        {myOrders.length > 0 && (
          <button className="btn-export" onClick={handleExportOrders}>
            <Download size={18} />
            Export Orders
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="orders-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="status-tabs">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              className={`status-tab ${filterStatus === tab.id ? 'active' : ''}`}
              onClick={() => setFilterStatus(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-list-container">
        {filteredOrders.length > 0 ? (
          <div className="orders-list">
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div key={order.id} className="order-card">
                  <div className="order-main">
                    <img src={order.listingImage} alt={order.listingTitle} loading="lazy" />
                    <div className="order-info">
                      <div className="order-header">
                        <h3>{order.listingTitle}</h3>
                        <span className={`status-badge ${statusConfig.class}`}>
                          <StatusIcon size={14} />
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="order-meta-simple">
                        <span>Order #{order.id.substr(-5)}</span>
                        <span className="order-dot">•</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="order-parties">
                        {user?.role === 'farmer' ? (
                          <span>From: <strong>{order.buyerName}</strong></span>
                        ) : (
                          <span>From: <strong>{order.sellerName}</strong></span>
                        )}
                      </div>
                      <div className="order-details">
                        <div>
                          <span className="detail-label">Quantity:</span>
                          <span className="detail-value">{order.quantity} units</span>
                        </div>
                        <div>
                          <span className="detail-label">Price:</span>
                          <span className="detail-value">${order.totalPrice}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="order-footer">
                    <div className="order-location">
                      <MapPin size={14} /> {order.deliveryAddress}
                    </div>
                    <div className="order-actions">
                      <button 
                        className="btn-icon"
                        onClick={() => handleOpenChat(order.id)}
                        title="Message"
                      >
                        <MessageSquare size={18} />
                      </button>
                      <Link to={`/orders/${order.id}`} className="btn-view">
                        <Eye size={18} />
                        View Details
                      </Link>
                    </div>
                  </div>

                  {/* Action buttons based on status and role */}
                  
                  {/* BUYER: Pay Now for pending orders */}
                  {order.status === 'pending' && user?.role === 'buyer' && (
                    <div className="order-action-bar">
                      <button 
                        className="btn-pay-now"
                        onClick={() => handlePayNow(order.id)}
                      >
                        <CreditCard size={18} />
                        Pay Now - ${order.totalPrice}
                      </button>
                      <button 
                        className="btn-cancel"
                        onClick={() => handleCancelClick(order.id)}
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}

                  {/* FARMER: Accept or Decline */}
                  {order.status === 'pending' && user?.role === 'farmer' && (
                    <div className="order-action-bar">
                      <button 
                        className="btn-accept"
                        onClick={() => {
                          updateOrderStatus(order.id, 'accepted');
                          showToast('success', `Order accepted!`);
                        }}
                      >
                        Accept Order
                      </button>
                      <button 
                        className="btn-decline"
                        onClick={() => handleCancelClick(order.id)}
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {order.status === 'accepted' && user?.role === 'farmer' && (
                    <div className="order-action-bar">
                      <button 
                        className="btn-accept"
                        onClick={() => {
                          updateOrderStatus(order.id, 'in_transit');
                          showToast('success', 'Order marked as in transit!');
                        }}
                      >
                        Mark as Shipped
                      </button>
                    </div>
                  )}

                  {order.status === 'delivered' && user?.role === 'buyer' && (
                    <div className="order-action-bar">
                      <button 
                        className="btn-confirm"
                        onClick={() => {
                          updateOrderStatus(order.id, 'completed');
                          showToast('success', 'Order completed! Thank you for your purchase.');
                        }}
                      >
                        Confirm Receipt
                      </button>
                      <button 
                        className="btn-dispute"
                        onClick={() => {
                          updateOrderStatus(order.id, 'disputed');
                          showToast('warning', 'Dispute opened. Our team will contact you.');
                        }}
                      >
                        Report Issue
                      </button>
                    </div>
                  )}

                  {order.status === 'in_transit' && user?.role === 'transporter' && (
                    <div className="order-action-bar">
                      <button 
                        className="btn-confirm"
                        onClick={() => {
                          updateOrderStatus(order.id, 'delivered');
                          showToast('success', 'Delivery marked as complete!');
                        }}
                      >
                        Mark as Delivered
                      </button>
                    </div>
                  )}

                  {order.status === 'in_transit' && (
                    <div className="tracking-bar">
                      <div className="tracking-progress">
                        <div className="progress-fill" style={{ width: '60%' }} />
                      </div>
                      <span>Estimated delivery: Tomorrow</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Clock size={48} />
            <h3>No orders found</h3>
            <p>
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : user?.role === 'buyer'
                ? "You haven't placed any orders yet"
                : "You haven't received any orders yet"}
            </p>
            {user?.role === 'buyer' && (
              <Link to="/marketplace" className="btn-primary">
                Browse Marketplace
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Pay Now Modal - Simple & Fast */}
      {showPayModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal-simple" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-simple">
              <h2>Quick Payment</h2>
              <button className="close-btn" onClick={() => setShowPayModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body-simple">
              <p className="payment-amount">
                Amount: <strong>${orders.find(o => o.id === selectedOrder)?.totalPrice}</strong>
              </p>
              
              <div className="payment-methods-simple">
                <label className={`payment-option-simple ${selectedPayment === 'ecocash' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    checked={selectedPayment === 'ecocash'}
                    onChange={() => setSelectedPayment('ecocash')}
                  />
                  <Smartphone size={24} />
                  <span>EcoCash</span>
                </label>
                
                <label className={`payment-option-simple ${selectedPayment === 'onemoney' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    checked={selectedPayment === 'onemoney'}
                    onChange={() => setSelectedPayment('onemoney')}
                  />
                  <Smartphone size={24} />
                  <span>OneMoney</span>
                </label>
                
                <label className={`payment-option-simple ${selectedPayment === 'innbucks' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    checked={selectedPayment === 'innbucks'}
                    onChange={() => setSelectedPayment('innbucks')}
                  />
                  <Smartphone size={24} />
                  <span>InnBucks</span>
                </label>
              </div>
              
              <div className="payment-info-box">
                <AlertCircle size={16} />
                <p>After payment, a chat will automatically open to coordinate with the seller</p>
              </div>
              
              <button className="btn-confirm-pay" onClick={confirmPayment}>
                <CheckCircle size={20} />
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal - With Reason */}
      {showCancelModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-simple" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-simple">
              <h2>Cancel Order</h2>
              <button className="close-btn" onClick={() => setShowCancelModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body-simple">
              <p className="cancel-note">
                Please tell us why you want to cancel this order. We will review your request.
              </p>
              
              <div className="cancel-reasons">
                <label className="reason-option">
                  <input 
                    type="radio" 
                    name="reason" 
                    onChange={() => setCancelReason('Changed my mind')}
                  />
                  <span>Changed my mind</span>
                </label>
                <label className="reason-option">
                  <input 
                    type="radio" 
                    name="reason" 
                    onChange={() => setCancelReason('Found better price elsewhere')}
                  />
                  <span>Found better price elsewhere</span>
                </label>
                <label className="reason-option">
                  <input 
                    type="radio" 
                    name="reason" 
                    onChange={() => setCancelReason('Ordered by mistake')}
                  />
                  <span>Ordered by mistake</span>
                </label>
                <label className="reason-option">
                  <input 
                    type="radio" 
                    name="reason" 
                    onChange={() => setCancelReason('Delivery time too long')}
                  />
                  <span>Delivery time too long</span>
                </label>
              </div>
              
              <textarea
                className="cancel-textarea"
                placeholder="Or type your reason here..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
              
              <button 
                className="btn-submit-cancel" 
                onClick={submitCancelRequest}
                disabled={!cancelReason.trim()}
              >
                Submit Cancellation Request
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Chat Modal */}
      {showChatModal && chatOrderId && (
        <div className="modal-overlay">
          <div className="chat-modal">
            <div className="chat-header">
              <h3>Chat with {user?.role === 'farmer' ? 'Buyer' : 'Seller'}</h3>
              <button className="close-btn" onClick={() => setShowChatModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="chat-body">
              <div className="message-list">
                {/* Initial message */}
                <div className="message seller">
                  <img src="https://randomuser.me/api/portraits/men/41.jpg" alt="Seller" />
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-sender">{user?.role === 'farmer' ? 'You' : 'Seller'}</span>
                      <span className="message-time">just now</span>
                    </div>
                    <p>Hello! How can I help you with your order?</p>
                  </div>
                </div>
              </div>
              <div className="chat-input">
                <textarea placeholder="Type your message here..."></textarea>
                <button className="send-btn">Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
