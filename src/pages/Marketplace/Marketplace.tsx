import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppData } from '../../context/AppDataContext';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { useMeta } from '../../hooks/useMeta';
import { useToast } from '../../components/UI/Toast';
import ProductQuickView from '../../components/Marketplace/ProductQuickView';
import type { Listing, ListingCategory } from '../../types';
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
  Navigation,
  Clock,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  Trash2,
} from 'lucide-react';

// Zimbabwe locations for filtering
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

export default function Marketplace() {
  const { listings, toggleFavorite, isFavorite } = useAppData();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const productsAnim = useScrollAnimation({ threshold: 0.1, triggerOnce: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [minRating, setMinRating] = useState('');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [savedFilters, setSavedFilters] = useState<string[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('mfh_recent_searches');
    return saved ? JSON.parse(saved) : ['tomatoes', 'maize', 'chickens', 'cattle'];
  });
  const [savedSearches, setSavedSearches] = useState<{query: string, filters: any}[]>(() => {
    const saved = localStorage.getItem('mfh_saved_searches');
    return saved ? JSON.parse(saved) : [];
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  useMeta({
    title: 'Marketplace - MAKEFARMHUB',
    description: 'Browse thousands of agricultural products from verified farmers across Zimbabwe. Fresh produce, livestock, and equipment.',
    keywords: 'buy produce, farm products, agricultural goods, Zimbabwe farming, fresh vegetables, livestock market',
    url: '/marketplace',
    type: 'website',
  });

  // Popular/trending searches
  const trendingSearches = ['organic vegetables', 'broiler chickens', 'maize grain', 'beef cattle', 'fresh eggs'];

  // Read URL query parameters on mount
  useEffect(() => {
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    
    if (query) {
      setSearchQuery(query);
    }
    if (category && (category === 'crops' || category === 'livestock' || category === 'equipment')) {
      setSelectedCategory(category as ListingCategory);
    }
  }, [searchParams]);

  // Save recent searches to localStorage
  useEffect(() => {
    localStorage.setItem('mfh_recent_searches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    localStorage.setItem('mfh_saved_searches', JSON.stringify(savedSearches));
  }, [savedSearches]);

  // Handle search submission
  const handleSearchSubmit = (query: string) => {
    if (query.trim() && !recentSearches.includes(query.trim())) {
      setRecentSearches(prev => [query.trim(), ...prev.slice(0, 7)]);
    }
    setSearchQuery(query);
    setShowSearchDropdown(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(searchQuery);
    }
  };

  const clearRecentSearch = (search: string) => {
    setRecentSearches(prev => prev.filter(s => s !== search));
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    showToast('info', 'Recent searches cleared');
  };

  const saveCurrentSearch = () => {
    if (!searchQuery.trim()) {
      showToast('error', 'Enter a search query first');
      return;
    }
    const newSavedSearch = {
      query: searchQuery,
      filters: {
        category: selectedCategory,
        priceRange,
        location: selectedLocation,
        minRating,
        verifiedOnly: showVerifiedOnly,
      }
    };
    setSavedSearches(prev => [newSavedSearch, ...prev.slice(0, 4)]);
    showToast('success', 'Search saved!');
  };

  const applySavedSearch = (saved: typeof savedSearches[0]) => {
    setSearchQuery(saved.query);
    setSelectedCategory(saved.filters.category);
    setPriceRange(saved.filters.priceRange);
    setSelectedLocation(saved.filters.location);
    setMinRating(saved.filters.minRating);
    setShowVerifiedOnly(saved.filters.verifiedOnly);
    setShowSearchDropdown(false);
    showToast('info', 'Saved search applied');
  };

  const removeSavedSearch = (index: number) => {
    setSavedSearches(prev => prev.filter((_, i) => i !== index));
  };

  const isSearchSaved = savedSearches.some(s => s.query === searchQuery);

  const categories = [
    { id: 'all', label: 'All Products', icon: '🛒' },
    { id: 'crops', label: 'Crops', icon: '🌾' },
    { id: 'livestock', label: 'Livestock', icon: '🐄' },
    { id: 'equipment', label: 'Equipment', icon: '🚜' },
  ];

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (priceRange.min || priceRange.max) count++;
    if (selectedLocation !== 'All Locations') count++;
    if (minRating) count++;
    if (showVerifiedOnly) count++;
    return count;
  }, [selectedCategory, priceRange, selectedLocation, minRating, showVerifiedOnly]);

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || listing.category === selectedCategory;
    const matchesPrice = (!priceRange.min || listing.price >= Number(priceRange.min)) &&
      (!priceRange.max || listing.price <= Number(priceRange.max));
    const matchesLocation = selectedLocation === 'All Locations' || 
      listing.location.toLowerCase().includes(selectedLocation.toLowerCase());
    const matchesRating = !minRating || listing.sellerRating >= Number(minRating);
    const matchesVerified = !showVerifiedOnly || listing.sellerVerified;
    return matchesSearch && matchesCategory && matchesPrice && matchesLocation && matchesRating && matchesVerified;
  });

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange({ min: '', max: '' });
    setSelectedLocation('All Locations');
    setMinRating('');
    setShowVerifiedOnly(false);
  };

  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'popular':
        return b.views - a.views;
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="marketplace-page">
      {/* Search Header */}
      <div className="marketplace-header">
        <h1>Marketplace</h1>
        <p>Discover fresh produce from verified farmers across Zimbabwe</p>
        
        <div className="search-container">
          <div className="search-box-wrapper">
            <div className="search-box large">
              <Search size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for crops, livestock, equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                onKeyDown={handleSearchKeyDown}
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>
                  <X size={18} />
                </button>
              )}
              <button 
                className={`btn-save-search ${isSearchSaved ? 'saved' : ''}`}
                onClick={saveCurrentSearch}
                title={isSearchSaved ? 'Search saved' : 'Save this search'}
              >
                {isSearchSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
            </div>

            {/* Search Dropdown */}
            {showSearchDropdown && (
              <div className="search-dropdown">
                {/* Saved Searches */}
                {savedSearches.length > 0 && (
                  <div className="search-section">
                    <div className="section-header">
                      <span><BookmarkCheck size={14} /> Saved Searches</span>
                    </div>
                    {savedSearches.map((saved, index) => (
                      <div key={index} className="search-item saved">
                        <button 
                          className="search-item-content"
                          onClick={() => applySavedSearch(saved)}
                        >
                          <Bookmark size={14} />
                          <span>{saved.query}</span>
                          {saved.filters.category !== 'all' && (
                            <span className="search-tag">{saved.filters.category}</span>
                          )}
                        </button>
                        <button 
                          className="btn-remove"
                          onClick={() => removeSavedSearch(index)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="search-section">
                    <div className="section-header">
                      <span><Clock size={14} /> Recent Searches</span>
                      <button onClick={clearAllRecentSearches}>Clear all</button>
                    </div>
                    {recentSearches.slice(0, 5).map((search, index) => (
                      <div key={index} className="search-item">
                        <button 
                          className="search-item-content"
                          onClick={() => handleSearchSubmit(search)}
                        >
                          <Clock size={14} />
                          <span>{search}</span>
                        </button>
                        <button 
                          className="btn-remove"
                          onClick={() => clearRecentSearch(search)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Trending Searches */}
                <div className="search-section">
                  <div className="section-header">
                    <span><TrendingUp size={14} /> Trending</span>
                  </div>
                  <div className="trending-tags">
                    {trendingSearches.map((search, index) => (
                      <button 
                        key={index} 
                        className="trending-tag"
                        onClick={() => handleSearchSubmit(search)}
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="search-dropdown-footer">
                  <button onClick={() => setShowSearchDropdown(false)}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            className={`btn-filter ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Sliders size={18} />
            Filters
            {activeFilterCount > 0 && (
              <span className="filter-badge">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="categories-bar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id as ListingCategory | 'all')}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-header">
            <h3>
              <Filter size={18} />
              Filter Products
            </h3>
            {activeFilterCount > 0 && (
              <button className="btn-clear-all" onClick={clearAllFilters}>
                Clear all ({activeFilterCount})
              </button>
            )}
          </div>
          
          <div className="filters-grid">
            <div className="filter-group">
              <label>
                <MapPin size={16} />
                Location
              </label>
              <div className="location-select">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                <Navigation size={16} className="select-icon" />
              </div>
            </div>

            <div className="filter-group">
              <label>Price Range (USD)</label>
              <div className="price-inputs">
                <div className="price-input-wrapper">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  />
                </div>
                <span className="price-separator">to</span>
                <div className="price-input-wrapper">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  />
                </div>
              </div>
              <div className="quick-prices">
                <button onClick={() => setPriceRange({ min: '', max: '10' })}>Under $10</button>
                <button onClick={() => setPriceRange({ min: '10', max: '50' })}>$10-$50</button>
                <button onClick={() => setPriceRange({ min: '50', max: '200' })}>$50-$200</button>
                <button onClick={() => setPriceRange({ min: '200', max: '' })}>$200+</button>
              </div>
            </div>

            <div className="filter-group">
              <label>
                <Star size={16} />
                Seller Rating
              </label>
              <div className="rating-options">
                <label className="rating-option">
                  <input
                    type="radio"
                    name="rating"
                    value=""
                    checked={minRating === ''}
                    onChange={(e) => setMinRating(e.target.value)}
                  />
                  <span>Any Rating</span>
                </label>
                <label className="rating-option">
                  <input
                    type="radio"
                    name="rating"
                    value="4"
                    checked={minRating === '4'}
                    onChange={(e) => setMinRating(e.target.value)}
                  />
                  <span>
                    <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                    4+ Stars
                  </span>
                </label>
                <label className="rating-option">
                  <input
                    type="radio"
                    name="rating"
                    value="3"
                    checked={minRating === '3'}
                    onChange={(e) => setMinRating(e.target.value)}
                  />
                  <span>
                    <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                    3+ Stars
                  </span>
                </label>
              </div>
            </div>

            <div className="filter-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showVerifiedOnly}
                  onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                />
                <span className="checkmark"></span>
                Verified Sellers Only
              </label>
            </div>
          </div>

          <div className="filters-footer">
            <span className="results-preview">
              {filteredListings.length} products match your filters
            </span>
          </div>
        </div>
      )}

      {/* Results Bar */}
      <div className="results-bar">
        <span className="results-count">{sortedListings.length} products found</span>
        <div className="results-actions">
          <div className="sort-dropdown">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
            <ChevronDown size={16} />
          </div>
          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={18} />
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Listings Grid/List */}
      <div 
        ref={productsAnim.ref as React.RefObject<HTMLDivElement>}
        className={`listings-container ${viewMode} scroll-fade-up ${productsAnim.isVisible ? 'visible' : ''}`}
      >
        {sortedListings.length > 0 ? (
          sortedListings.map((listing) => (
            <div
              key={listing.id}
              className={`listing-card ${viewMode}`}
              onClick={() => setSelectedListing(listing)}
              style={{ cursor: 'pointer' }}
            >
              <div className="listing-image">
                <img src={listing.images[0]} alt={listing.title} />
                <button
                  className={`btn-favorite ${isFavorite(listing.id) ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(listing.id);
                    showToast(
                      isFavorite(listing.id) ? 'info' : 'success',
                      isFavorite(listing.id) ? 'Removed from favorites' : 'Added to favorites'
                    );
                  }}
                >
                  <Heart size={18} fill={isFavorite(listing.id) ? 'currentColor' : 'none'} />
                </button>
                {listing.featured && <span className="featured-badge">Featured</span>}
                <span className={`status-badge status-${listing.status}`}>
                  {listing.status}
                </span>
              </div>
              <div className="listing-content">
                <div className="listing-category">{listing.subcategory}</div>
                <h3>{listing.title}</h3>
                <p className="listing-description">{listing.description}</p>
                <div className="listing-location">
                  <MapPin size={14} />
                  {listing.location}
                </div>
                <div className="listing-footer">
                  <div className="listing-price">
                    <strong>${listing.price}</strong>
                    <span>/{listing.unit}</span>
                  </div>
                  <div className="listing-meta">
                    <span><Eye size={14} /> {listing.views}</span>
                    <span>{listing.quantity} available</span>
                  </div>
                </div>
                <div className="listing-seller">
                  <img src={listing.sellerAvatar} alt={listing.sellerName} />
                  <span>{listing.sellerName}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <Search size={48} />
            <h3>No products found</h3>
            <p>Try adjusting your search or filters</p>
            {activeFilterCount > 0 && (
              <button className="btn-primary" onClick={clearAllFilters}>
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Product Quick View Modal */}
      {selectedListing && (
        <ProductQuickView
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
        />
      )}
    </div>
  );
}
