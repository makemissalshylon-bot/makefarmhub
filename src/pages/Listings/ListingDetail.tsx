import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../components/UI/Toast';
import ReviewsSection from '../../components/Reviews/ReviewsSection';
import WriteReviewModal from '../../components/Reviews/WriteReviewModal';
import ChatModal from '../../components/Messages/ChatModal';
import PaymentModal, { type PaymentDetails } from '../../components/Payment/PaymentModal';
import ShareButton from '../../components/Social/ShareButton';
import Breadcrumbs from '../../components/UI/Breadcrumbs';
import {
  MapPin,
  Heart,
  Share2,
  MessageSquare,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Star,
  Shield,
  Clock,
  Eye,
  Check,
  XCircle,
  CreditCard,
} from 'lucide-react';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addReview, createOrder, toggleFavorite, isFavorite: checkIsFavorite, createNotification, listings, reviews: appReviews } = useAppData();
  const { showToast } = useToast();
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [purchasedItem, setPurchasedItem] = useState<string | null>(null);

  // Find listing and check if it was purchased
  const rawListing = listings.find((l) => l.id === id);
  const [listing, setListing] = useState(rawListing);
  
  // Track if item is sold out
  const [isSoldOut, setIsSoldOut] = useState(false);
  
  useEffect(() => {
    // Check if this listing was previously purchased
    const purchasedItems = localStorage.getItem('purchasedItems');
    if (purchasedItems) {
      const items = JSON.parse(purchasedItems);
      if (items.includes(id)) {
        setIsSoldOut(true);
      }
    }
  }, [id]);

  if (!listing) {
    return (
      <div className="not-found">
        <h2>Listing not found</h2>
        <Link to="/marketplace" className="btn-primary">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const totalPrice = listing.price * quantity;
  const similarListings = listings
    .filter((l) => l.category === listing.category && l.id !== listing.id)
    .slice(0, 4);

  // Get reviews for this listing or seller
  const listingReviews = appReviews.filter(
    (r) => r.targetId === listing.id || r.targetId === listing.sellerId
  );
  const avgRating = listingReviews.length > 0 ? listingReviews.reduce((sum, r) => sum + r.rating, 0) / listingReviews.length : 0;
  const sellerStats = { rating: avgRating, totalSales: 0, responseTime: 'N/A' };

  const handleSubmitReview = (review: { rating: number; title: string; comment: string }) => {
    addReview({
      targetId: listing.id,
      targetType: 'listing',
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      authorName: user?.name || 'Anonymous',
    });
    showToast('success', 'Review submitted successfully!');
    setShowReviewModal(false);
  };

  const markItemAsPurchased = (itemId: string) => {
    // Get existing purchased items or initialize empty array
    const existingItems = localStorage.getItem('purchasedItems');
    const purchasedItems = existingItems ? JSON.parse(existingItems) : [];
    
    // Add current item if not already in list
    if (!purchasedItems.includes(itemId)) {
      purchasedItems.push(itemId);
      localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));
    }
    
    // Mark current listing as sold out
    setIsSoldOut(true);
    setPurchasedItem(itemId);
  };

  const handleBuyNow = () => {
    if (!user) {
      showToast('error', 'Please log in to make a purchase');
      navigate('/login');
      return;
    }

    // Create the order first
    const totalPrice = listing.price * quantity;
    const escrowAmount = totalPrice * 1.05;
    
    const newOrderId = createOrder({
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: listing.images[0],
      buyerId: user.id,
      buyerName: user.name,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      quantity: quantity,
      unitPrice: listing.price,
      totalPrice: totalPrice,
      escrowAmount: escrowAmount,
      status: 'pending',
      deliveryAddress: user.location || 'Delivery address to be confirmed',
      paymentMethod: 'Pending',
      transporterId: undefined,
      transporterName: undefined,
    });
    
    setPendingOrderId(newOrderId);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = (paymentDetails: PaymentDetails) => {
    if (pendingOrderId) {
      markItemAsPurchased(listing.id);

      const isPending = paymentDetails.status === 'pending_verification';
      createNotification({
        type: isPending ? 'info' : 'success',
        title: isPending ? 'Payment Pending Verification' : 'Payment Successful',
        message: isPending
          ? `Reference ${paymentDetails.transactionRef} submitted. $${paymentDetails.amount.toFixed(2)} awaits confirmation.`
          : `Your payment of $${paymentDetails.amount.toFixed(2)} has been confirmed`,
        actionUrl: `/orders/${pendingOrderId}`,
      });

      createNotification({
        type: 'info',
        title: 'Contact Seller',
        message: `You can now message ${listing.sellerName} to coordinate delivery`,
        actionUrl: '/messages',
      });

      showToast(
        isPending ? 'info' : 'success',
        isPending ? 'Order created — payment awaiting verification' : 'Order created successfully! Redirecting...'
      );

      setTimeout(() => {
        navigate(`/orders/${pendingOrderId}`);
      }, 1000);
    }
  };

  const handleContactSeller = () => {
    if (!user) {
      showToast('error', 'Please log in to contact the seller');
      navigate('/login');
      return;
    }
    // Navigate to Messages page with seller context
    navigate('/messages', { state: { 
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      sellerAvatar: listing.sellerAvatar,
      listingId: listing.id,
      listingTitle: listing.title
    }});
    showToast('info', 'Opening chat with seller...');
  };

  const handleToggleFavorite = () => {
    toggleFavorite(listing.id);
    const isNowFavorite = !checkIsFavorite(listing.id);
    showToast(isNowFavorite ? 'success' : 'info', isNowFavorite ? 'Added to favorites' : 'Removed from favorites');
  };


  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % listing.images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + listing.images.length) % listing.images.length);
  };

  return (
    <div className="listing-detail-page">
      <Breadcrumbs 
        items={[
          { label: 'Marketplace', path: '/marketplace' },
          { label: listing.category, path: `/marketplace?category=${listing.category}` },
          { label: listing.title }
        ]}
      />

      <div className="listing-detail-container">
        {/* Image Gallery */}
        <div className="listing-gallery">
          <div className="main-image">
            <img src={listing.images[currentImage]} alt={listing.title} />
            {listing.images.length > 1 && (
              <>
                <button className="gallery-nav prev" onClick={prevImage}>
                  <ChevronLeft size={24} />
                </button>
                <button className="gallery-nav next" onClick={nextImage}>
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            <div className="image-counter">
              {currentImage + 1} / {listing.images.length}
            </div>
          </div>
          {listing.images.length > 1 && (
            <div className="thumbnail-strip">
              {listing.images.map((img, index) => (
                <button
                  key={index}
                  className={`thumbnail ${index === currentImage ? 'active' : ''}`}
                  onClick={() => setCurrentImage(index)}
                >
                  <img src={img} alt={`${listing.title} ${index + 1}`} loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Listing Info */}
        <div className="listing-info">
          <div className="listing-header">
            <div className="listing-badges">
              <span className="category-badge">{listing.subcategory}</span>
              {listing.featured && <span className="featured-badge">Featured</span>}
              <span className={`status-badge status-${listing.status}`}>
                {listing.status}
              </span>
            </div>
            <div className="listing-actions">
              <button 
                className={`action-btn ${checkIsFavorite(listing.id) ? 'active' : ''}`}
                onClick={handleToggleFavorite}
                title={checkIsFavorite(listing.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart size={20} fill={checkIsFavorite(listing.id) ? 'currentColor' : 'none'} />
              </button>
              <ShareButton 
                title={listing.title}
                text={`Check out ${listing.title} - $${listing.price} per ${listing.unit}`}
                url={window.location.href}
                imageUrl={listing.images[0]}
              />
            </div>
          </div>

          <h1>{listing.title}</h1>

          <div className="listing-location">
            <MapPin size={16} />
            {listing.location}
          </div>

          <div className="listing-stats">
            <span><Eye size={16} /> {listing.views} views</span>
            <span><Clock size={16} /> Listed {listing.createdAt}</span>
          </div>

          <div className="price-section">
            <div className="price-main">
              <span className="price">${listing.price}</span>
              <span className="unit">per {listing.unit}</span>
            </div>
            <div className="stock-info">
              {isSoldOut ? (
                <span className="sold-out">
                  <XCircle size={16} color="#e53e3e" />
                  Sold Out
                </span>
              ) : (
                <>
                  <Check size={16} />
                  {listing.quantity} {listing.unit}s available
                </>
              )}
            </div>
          </div>

          <div className="description-section">
            <h3>Description</h3>
            <p>{listing.description}</p>
          </div>

          {/* Quantity & Order */}
          {user?.role === 'buyer' && (
            <div className="order-section">
              {!isSoldOut ? (
                <>
                  <div className="quantity-selector">
                    <label>Quantity ({listing.unit}s)</label>
                    <div className="quantity-input">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(listing.quantity, Number(e.target.value))))}
                        min={1}
                        max={listing.quantity}
                      />
                      <button onClick={() => setQuantity(Math.min(listing.quantity, quantity + 1))}>+</button>
                    </div>
                  </div>

                  <div className="order-total">
                    <span>Total:</span>
                    <strong>${totalPrice.toFixed(2)}</strong>
                  </div>

                  <div className="order-actions">
                    {/* Direct Purchase Button if marked ready to sell */}
                    {listing.readyToSell ? (
                      <button 
                        className="btn-primary" 
                        onClick={handleBuyNow}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <span className="spinner"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard size={20} />
                            Pay Now - ${totalPrice.toFixed(2)}
                          </>
                        )}
                      </button>
                    ) : (
                      <button className="btn-message" onClick={handleContactSeller}>
                        <MessageSquare size={20} />
                        Contact Seller to Buy
                      </button>
                    )}
                  </div>

                  {/* Only show contact button when Ready to Sell is enabled */}
                  {listing.readyToSell && (
                    <div className="delivery-terms">
                      <h4>Delivery Terms</h4>
                      <p>{listing.deliveryTerms || "Standard delivery terms apply. Contact seller for details."}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="sold-out-message">
                  <XCircle size={24} />
                  <h3>This item is no longer available</h3>
                  <p>This product has been sold. Please check similar listings or visit the marketplace for more options.</p>
                  <Link to="/marketplace" className="btn-primary">
                    Browse Marketplace
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Trust Badges */}
          <div className="trust-badges">
            <div className="trust-badge">
              <Shield size={20} />
              <div>
                <strong>Secure Payment Protected</strong>
                <span>Your money is held safely until you confirm delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Card */}
        <div className="seller-card">
          <h3>Seller Information</h3>
          <div className="seller-profile">
            <img src={listing.sellerAvatar} alt={listing.sellerName} />
            <div>
              <h4>{listing.sellerName}</h4>
              <div className="seller-rating">
                <Star size={16} fill="#f7b733" color="#f7b733" />
                <span>4.8 (23 reviews)</span>
              </div>
              <span className="verified-badge">
                <Check size={14} /> Verified Seller
              </span>
            </div>
          </div>
          <div className="seller-stats">
            <div>
              <strong>45</strong>
              <span>Listings</span>
            </div>
            <div>
              <strong>156</strong>
              <span>Sales</span>
            </div>
            <div>
              <strong>98%</strong>
              <span>Response</span>
            </div>
          </div>
          <Link to={`/seller/${listing.sellerId}`} className="btn-outline">
            View Profile
          </Link>
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewsSection
        reviews={listingReviews as any}
        sellerStats={sellerStats as any}
        onWriteReview={() => setShowReviewModal(true)}
        showWriteButton={user?.role === 'buyer'}
      />

      {/* Similar Listings */}
      {similarListings.length > 0 && (
        <section className="similar-listings">
          <h2>Similar Products</h2>
          <div className="similar-grid">
            {similarListings.map((item) => (
              <Link key={item.id} to={`/listing/${item.id}`} className="similar-card">
                <img src={item.images[0]} alt={item.title} />
                <div className="similar-info">
                  <h4>{item.title}</h4>
                  <p className="similar-price">${item.price}/{item.unit}</p>
                  <p className="similar-location">
                    <MapPin size={12} /> {item.location}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Write Review Modal */}
      {showReviewModal && (
        <WriteReviewModal
          targetName={listing.title}
          targetType="listing"
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleSubmitReview}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && pendingOrderId && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={listing.price * quantity * 1.05}
          orderId={pendingOrderId}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

    </div>
  );
}
