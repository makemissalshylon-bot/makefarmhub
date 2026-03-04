import { useState } from 'react';
import type { Review, SellerStats } from '../../types';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';
import { Star, MessageSquare } from 'lucide-react';
import '../../styles/reviews.css';

interface ReviewsSectionProps {
  reviews: Review[];
  sellerStats?: SellerStats;
  onWriteReview?: () => void;
  showWriteButton?: boolean;
}

export default function ReviewsSection({
  reviews,
  sellerStats,
  onWriteReview,
  showWriteButton = true,
}: ReviewsSectionProps) {
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'highest' | 'lowest'>('recent');

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'helpful':
        return b.helpful - a.helpful;
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const handleHelpful = (reviewId: string) => {
    // In a real app, this would update the helpful count via API
  };

  return (
    <section className="reviews-section">
      <h2>Customer Reviews</h2>

      {sellerStats && (
        <div className="reviews-summary">
          <div className="rating-overview">
            <div className="rating-big">{sellerStats.averageRating.toFixed(1)}</div>
            <StarRating rating={sellerStats.averageRating} size={20} />
            <div className="rating-count">{sellerStats.totalReviews} reviews</div>
          </div>
          
          <div className="rating-bars">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = sellerStats.ratings[star as keyof typeof sellerStats.ratings];
              const percentage = sellerStats.totalReviews > 0 
                ? (count / sellerStats.totalReviews) * 100 
                : 0;
              
              return (
                <div key={star} className="rating-bar">
                  <span className="rating-bar-label">
                    {star} <Star size={12} fill="#F7B733" color="#F7B733" />
                  </span>
                  <div className="rating-bar-track">
                    <div 
                      className="rating-bar-fill" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="rating-bar-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="reviews-header">
        <h3>All Reviews ({reviews.length})</h3>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select 
            className="reviews-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
          
          {showWriteButton && onWriteReview && (
            <button className="btn-primary" onClick={onWriteReview}>
              <MessageSquare size={18} />
              Write a Review
            </button>
          )}
        </div>
      </div>

      <div className="reviews-list">
        {sortedReviews.length > 0 ? (
          sortedReviews.map((review) => (
            <ReviewCard 
              key={review.id} 
              review={review}
              onHelpful={handleHelpful}
            />
          ))
        ) : (
          <div className="no-reviews">
            <h3>No reviews yet</h3>
            <p>Be the first to review this product!</p>
          </div>
        )}
      </div>
    </section>
  );
}
