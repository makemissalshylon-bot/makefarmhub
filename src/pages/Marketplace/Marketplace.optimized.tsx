/**
 * Optimized Marketplace Component
 * Uses React.memo, useMemo, useCallback for maximum performance
 */

import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppData } from '../../context/AppDataContext';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { useMeta } from '../../hooks/useMeta';
import { useToast } from '../../components/UI/Toast';
import ProductQuickView from '../../components/Marketplace/ProductQuickView';
import type { Listing, ListingCategory } from '../../types';
import { VirtualGrid } from '../../components/UI/VirtualList';
import { perfMonitor } from '../../utils/performance';
import { requestDeduplicator } from '../../utils/requestBatcher';
import {
  Search,
  Filter,
  Grid,
  List,
  MapPin,
  Heart,
  Eye,
  ChevronDown,
  X,
  Star,
  Sliders,
} from 'lucide-react';

// Memoized constants
const LOCATIONS = [
  'All Locations',
  'Harare',
  'Bulawayo',
  'Chitungwiza',
  'Mutare',
  'Gweru',
  'Masvingo',
  'Bindura',
  'Kwekwe',
  'Kadoma',
  'Marondera',
];

// Memoized ListingCard component
const ListingCard = memo(({ 
  listing, 
  onToggleFavorite, 
  isFavorite,
  onQuickView 
}: { 
  listing: Listing; 
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  onQuickView: (listing: Listing) => void;
}) => {
  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(listing.id);
  }, [listing.id, onToggleFavorite]);

  const handleQuickView = useCallback(() => {
    onQuickView(listing);
  }, [listing, onQuickView]);

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
      onClick={handleQuickView}
    >
      <div className="relative aspect-[4/3]">
        <img
          src={listing.images?.[0] || '/placeholder.jpg'}
          alt={listing.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-400'}`} />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 dark:text-white line-clamp-1">
          {listing.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
          {listing.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            ${listing.price.toFixed(2)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {listing.unit}
          </span>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.listing.id === nextProps.listing.id &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.listing.price === nextProps.listing.price &&
    prevProps.listing.available === nextProps.listing.available
  );
});

ListingCard.displayName = 'ListingCard';

export default function MarketplaceOptimized() {
  perfMonitor.start('marketplace-render');

  const { listings, toggleFavorite, isFavorite } = useAppData();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [minRating, setMinRating] = useState('');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  useMeta({
    title: 'Marketplace - MAKEFARMHUB',
    description: 'Browse thousands of agricultural products from verified farmers across Zimbabwe.',
    keywords: 'buy produce, farm products, agricultural goods, Zimbabwe farming',
    url: '/marketplace',
    type: 'website',
  });

  // Memoized filtered and sorted listings
  const filteredListings = useMemo(() => {
    perfMonitor.start('filter-listings');
    
    let filtered = listings.filter((listing) => {
      const matchesSearch = searchQuery === '' || 
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || listing.category === selectedCategory;
      const matchesLocation = selectedLocation === 'All Locations' || listing.location === selectedLocation;
      
      const matchesPrice = (
        (priceRange.min === '' || listing.price >= parseFloat(priceRange.min)) &&
        (priceRange.max === '' || listing.price <= parseFloat(priceRange.max))
      );
      
      const matchesRating = minRating === '' || (listing.rating || 0) >= parseFloat(minRating);
      const matchesVerified = !showVerifiedOnly || listing.sellerVerified;

      return matchesSearch && matchesCategory && matchesLocation && matchesPrice && matchesRating && matchesVerified;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'popular':
          return (b.views || 0) - (a.views || 0);
        case 'newest':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    perfMonitor.end('filter-listings', { count: filtered.length });
    return filtered;
  }, [listings, searchQuery, selectedCategory, selectedLocation, priceRange, sortBy, minRating, showVerifiedOnly]);

  // Memoized handlers
  const handleToggleFavorite = useCallback((listingId: string) => {
    toggleFavorite(listingId);
    showToast(
      isFavorite(listingId) ? 'Removed from favorites' : 'Added to favorites',
      'success'
    );
  }, [toggleFavorite, isFavorite, showToast]);

  const handleQuickView = useCallback((listing: Listing) => {
    setSelectedListing(listing);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleCategoryChange = useCallback((category: ListingCategory | 'all') => {
    setSelectedCategory(category);
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  }, []);

  // Virtual grid rendering for large lists
  const renderListing = useCallback((listing: Listing, index: number) => (
    <ListingCard
      key={listing.id}
      listing={listing}
      onToggleFavorite={handleToggleFavorite}
      isFavorite={isFavorite(listing.id)}
      onQuickView={handleQuickView}
    />
  ), [handleToggleFavorite, isFavorite, handleQuickView]);

  useEffect(() => {
    perfMonitor.end('marketplace-render');
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="popular">Most Popular</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'crops', 'livestock', 'equipment'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {cat === 'all' ? 'All Products' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-gray-600 dark:text-gray-400">
        Found {filteredListings.length} products
      </div>

      {/* Virtual Grid for performance */}
      {viewMode === 'grid' && filteredListings.length > 20 ? (
        <VirtualGrid
          items={filteredListings}
          itemWidth={300}
          itemHeight={400}
          containerWidth={1200}
          containerHeight={800}
          gap={16}
          renderItem={renderListing}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={isFavorite(listing.id)}
              onQuickView={handleQuickView}
            />
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      {selectedListing && (
        <ProductQuickView
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
        />
      )}
    </div>
  );
}
