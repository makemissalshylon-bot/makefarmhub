/**
 * Product Recommendation Engine
 * Provides personalized product recommendations based on user behavior
 */

import type { Listing } from '../types';

export interface UserBehavior {
  viewedProducts: string[];
  searchHistory: string[];
  purchaseHistory: string[];
  savedProducts: string[];
  categories: string[];
  priceRange: { min: number; max: number };
}

class RecommendationService {
  /**
   * Get personalized recommendations
   */
  getRecommendations(
    allListings: Listing[],
    userBehavior: Partial<UserBehavior>,
    limit: number = 10
  ): Listing[] {
    const scores = new Map<string, number>();

    allListings.forEach(listing => {
      let score = 0;

      // Category matching (30% weight)
      if (userBehavior.categories?.includes(listing.category)) {
        score += 30;
      }

      // Price range matching (20% weight)
      if (userBehavior.priceRange) {
        const { min, max } = userBehavior.priceRange;
        if (listing.price >= min && listing.price <= max) {
          score += 20;
        }
      }

      // Search history matching (25% weight)
      if (userBehavior.searchHistory) {
        const searchMatch = userBehavior.searchHistory.some(term =>
          listing.title.toLowerCase().includes(term.toLowerCase()) ||
          listing.description.toLowerCase().includes(term.toLowerCase())
        );
        if (searchMatch) score += 25;
      }

      // Similar to viewed products (15% weight)
      if (userBehavior.viewedProducts?.length) {
        const viewedCategories = userBehavior.viewedProducts.map(id => {
          const viewed = allListings.find(l => l.id === id);
          return viewed?.category;
        });
        if (viewedCategories.includes(listing.category)) {
          score += 15;
        }
      }

      // Boost for high ratings (10% weight)
      if ((listing.sellerRating || listing.rating || 0) >= 4.5) {
        score += 10;
      }

      scores.set(listing.id, score);
    });

    // Sort by score and return top recommendations
    return allListings
      .filter(listing => !userBehavior.viewedProducts?.includes(listing.id))
      .sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0))
      .slice(0, limit);
  }

  /**
   * Get similar products
   */
  getSimilarProducts(
    currentListing: Listing,
    allListings: Listing[],
    limit: number = 6
  ): Listing[] {
    return allListings
      .filter(listing => 
        listing.id !== currentListing.id &&
        (listing.category === currentListing.category ||
         Math.abs(listing.price - currentListing.price) < currentListing.price * 0.3)
      )
      .sort((a, b) => {
        const aScore = this.calculateSimilarityScore(currentListing, a);
        const bScore = this.calculateSimilarityScore(currentListing, b);
        return bScore - aScore;
      })
      .slice(0, limit);
  }

  /**
   * Calculate similarity score between two listings
   */
  private calculateSimilarityScore(listing1: Listing, listing2: Listing): number {
    let score = 0;

    // Same category
    if (listing1.category === listing2.category) score += 40;

    // Similar price (within 30%)
    const priceDiff = Math.abs(listing1.price - listing2.price) / listing1.price;
    if (priceDiff < 0.3) score += 30;

    // Same location
    if (listing1.location === listing2.location) score += 20;

    // Similar rating
    const ratingDiff = Math.abs((listing1.sellerRating || 0) - (listing2.sellerRating || 0));
    if (ratingDiff < 0.5) score += 10;

    return score;
  }

  /**
   * Get trending products
   */
  getTrendingProducts(allListings: Listing[], limit: number = 10): Listing[] {
    return allListings
      .sort((a, b) => {
        // Simple trending algorithm: high rating + recent + popular
        const aScore = (a.sellerRating || 0) * 20 + (a.views || 0) * 0.1;
        const bScore = (b.sellerRating || 0) * 20 + (b.views || 0) * 0.1;
        return bScore - aScore;
      })
      .slice(0, limit);
  }

  /**
   * Get products from same seller
   */
  getFromSameSeller(
    currentListing: Listing,
    allListings: Listing[],
    limit: number = 6
  ): Listing[] {
    return allListings
      .filter(listing => 
        listing.sellerId === currentListing.sellerId &&
        listing.id !== currentListing.id
      )
      .slice(0, limit);
  }

  /**
   * Get frequently bought together
   */
  getFrequentlyBoughtTogether(
    currentListing: Listing,
    allListings: Listing[],
    limit: number = 4
  ): Listing[] {
    // In a real app, this would use purchase history data
    // For now, return complementary products from same category
    return allListings
      .filter(listing => 
        listing.id !== currentListing.id &&
        listing.category === currentListing.category &&
        listing.sellerId !== currentListing.sellerId
      )
      .slice(0, limit);
  }

  /**
   * Update user behavior tracking
   */
  trackBehavior(
    action: 'view' | 'search' | 'purchase' | 'save',
    data: { productId?: string; searchTerm?: string; category?: string }
  ): void {
    const key = `user_behavior_${action}`;
    const stored = localStorage.getItem(key);
    const history = stored ? JSON.parse(stored) : [];

    if (action === 'view' && data.productId) {
      history.push({ productId: data.productId, timestamp: Date.now() });
    } else if (action === 'search' && data.searchTerm) {
      history.push({ term: data.searchTerm, timestamp: Date.now() });
    } else if (action === 'purchase' && data.productId) {
      history.push({ productId: data.productId, timestamp: Date.now() });
    } else if (action === 'save' && data.productId) {
      history.push({ productId: data.productId, timestamp: Date.now() });
    }

    // Keep only last 50 items
    const trimmed = history.slice(-50);
    localStorage.setItem(key, JSON.stringify(trimmed));
  }

  /**
   * Get user behavior from storage
   */
  getUserBehavior(): Partial<UserBehavior> {
    const views = localStorage.getItem('user_behavior_view');
    const searches = localStorage.getItem('user_behavior_search');
    const purchases = localStorage.getItem('user_behavior_purchase');
    const saves = localStorage.getItem('user_behavior_save');

    return {
      viewedProducts: views ? JSON.parse(views).map((v: any) => v.productId) : [],
      searchHistory: searches ? JSON.parse(searches).map((s: any) => s.term) : [],
      purchaseHistory: purchases ? JSON.parse(purchases).map((p: any) => p.productId) : [],
      savedProducts: saves ? JSON.parse(saves).map((s: any) => s.productId) : [],
    };
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;
