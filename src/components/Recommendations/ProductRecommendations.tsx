import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Clock, Heart, ShoppingCart, ChevronRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import type { Listing } from '../../types';
import './ProductRecommendations.css';

type RecommendationType = 'personalized' | 'trending' | 'recent' | 'similar';

interface ProductRecommendationsProps {
  type?: RecommendationType;
  productId?: string;
  limit?: number;
  title?: string;
}

export default function ProductRecommendations({
  type = 'personalized',
  productId,
  limit = 6,
  title
}: ProductRecommendationsProps) {
  const { user } = useAuth();
  const { listings } = useAppData();
  const [recommendations, setRecommendations] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    generateRecommendations();
  }, [type, productId, listings, user]);

  const generateRecommendations = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    let recommended: Listing[] = [];

    switch (type) {
      case 'personalized':
        // AI-based personalization using user history
        recommended = getPersonalizedRecommendations();
        break;
      case 'trending':
        // Most viewed/purchased in last 7 days
        recommended = getTrendingProducts();
        break;
      case 'recent':
        // Recently viewed products
        recommended = getRecentlyViewed();
        break;
      case 'similar':
        // Similar to current product
        recommended = getSimilarProducts(productId);
        break;
    }

    setRecommendations(recommended.slice(0, limit));
    setLoading(false);
  };

  const getPersonalizedRecommendations = (): Listing[] => {
    // Simulate AI recommendation based on user preferences
    const userCategories = JSON.parse(localStorage.getItem('user_categories') || '["crops"]');
    const viewHistory = JSON.parse(localStorage.getItem('view_history') || '[]');
    
    // Score listings based on user behavior
    const scored = listings.map(listing => {
      let score = 0;
      
      // Category match
      if (userCategories.includes(listing.category?.toLowerCase())) score += 30;
      
      // Previously viewed similar items
      if (viewHistory.includes(listing.id)) score += 20;
      
      // High rating boost
      if (listing.rating && listing.rating >= 4.5) score += 15;
      
      // Freshness score
      const daysSinceCreated = Math.floor((Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      score += Math.max(0, 10 - daysSinceCreated);
      
      // Price within typical range (mock)
      score += 10;
      
      // Random factor for diversity
      score += Math.random() * 10;
      
      return { ...listing, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .filter(l => l.status === 'active');
  };

  const getTrendingProducts = (): Listing[] => {
    // Simulate trending based on views/orders
    return [...listings]
      .filter(l => l.status === 'active')
      .sort((a, b) => {
        const aScore = (a.views || 0) * 2 + Math.random() * 100;
        const bScore = (b.views || 0) * 2 + Math.random() * 100;
        return bScore - aScore;
      });
  };

  const getRecentlyViewed = (): Listing[] => {
    const viewHistory = JSON.parse(localStorage.getItem('view_history') || '[]');
    return listings
      .filter(l => viewHistory.includes(l.id) && l.status === 'active')
      .reverse();
  };

  const getSimilarProducts = (currentProductId?: string): Listing[] => {
    if (!currentProductId) return listings.filter(l => l.status === 'active').slice(0, limit);
    
    const currentProduct = listings.find(l => l.id === currentProductId);
    if (!currentProduct) return [];

    return listings
      .filter(l => 
        l.id !== currentProductId &&
        l.status === 'active' &&
        (l.category === currentProduct.category || 
         l.title.toLowerCase().includes(currentProduct.title.toLowerCase().split(' ')[0]))
      )
      .sort((a, b) => {
        // Prioritize same category
        const aMatch = a.category === currentProduct.category ? 10 : 0;
        const bMatch = b.category === currentProduct.category ? 10 : 0;
        return bMatch - aMatch + Math.random() * 5;
      });
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  const handleProductClick = (listing: Listing) => {
    // Track view for recommendations
    const viewHistory = JSON.parse(localStorage.getItem('view_history') || '[]');
    if (!viewHistory.includes(listing.id)) {
      viewHistory.unshift(listing.id);
      localStorage.setItem('view_history', JSON.stringify(viewHistory.slice(0, 20)));
    }

    // Track category preference
    const userCategories = JSON.parse(localStorage.getItem('user_categories') || '[]');
    if (listing.category && !userCategories.includes(listing.category.toLowerCase())) {
      userCategories.push(listing.category.toLowerCase());
      localStorage.setItem('user_categories', JSON.stringify(userCategories.slice(-5)));
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'personalized': return <Sparkles size={20} />;
      case 'trending': return <TrendingUp size={20} />;
      case 'recent': return <Clock size={20} />;
      case 'similar': return <Sparkles size={20} />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'personalized': return 'Recommended for You';
      case 'trending': return 'Trending Now';
      case 'recent': return 'Recently Viewed';
      case 'similar': return 'Similar Products';
    }
  };

  if (loading) {
    return (
      <div className="recommendations-container">
        <div className="recommendations-header">
          <h3>{getIcon()} {getTitle()}</h3>
        </div>
        <div className="recommendations-grid loading">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="recommendation-skeleton">
              <div className="skeleton-image" />
              <div className="skeleton-text" />
              <div className="skeleton-text short" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="recommendations-container">
      <div className="recommendations-header">
        <h3>{getIcon()} {getTitle()}</h3>
        <div className="header-actions">
          <button className="refresh-btn" onClick={generateRecommendations}>
            <RefreshCw size={16} />
          </button>
          <button className="view-all-btn">
            View All <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="recommendations-grid">
        {recommendations.map(listing => (
          <div 
            key={listing.id} 
            className="recommendation-card"
            onClick={() => handleProductClick(listing)}
          >
            <div className="card-image">
              <img 
                src={listing.images?.[0] || '/images/placeholder.jpg'} 
                alt={listing.title}
                loading="lazy"
              />
              <button 
                className={`favorite-btn ${favorites.has(listing.id) ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(listing.id);
                }}
              >
                <Heart size={18} fill={favorites.has(listing.id) ? 'currentColor' : 'none'} />
              </button>
              {type === 'trending' && (
                <span className="trending-badge">
                  <TrendingUp size={12} /> Trending
                </span>
              )}
            </div>
            
            <div className="card-content">
              <h4>{listing.title}</h4>
              <p className="card-seller">{listing.sellerName || 'Seller'}</p>
              <div className="card-footer">
                <span className="card-price">
                  ${listing.price.toFixed(2)}
                  <small>/{listing.unit || 'kg'}</small>
                </span>
                <button className="add-cart-btn">
                  <ShoppingCart size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
