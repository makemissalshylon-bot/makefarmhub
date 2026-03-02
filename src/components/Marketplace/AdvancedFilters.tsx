import { Sliders, Check } from 'lucide-react';
import './AdvancedFilters.css';

interface AdvancedFiltersProps {
  priceRange: { min: string; max: string };
  setPriceRange: (range: { min: string; max: string }) => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  minRating: string;
  setMinRating: (rating: string) => void;
  showVerifiedOnly: boolean;
  setShowVerifiedOnly: (show: boolean) => void;
  showOrganicOnly: boolean;
  setShowOrganicOnly: (show: boolean) => void;
  maxDistance: string;
  setMaxDistance: (distance: string) => void;
  locations: string[];
  activeFilterCount: number;
  onClearAll: () => void;
}

export default function AdvancedFilters({
  priceRange,
  setPriceRange,
  selectedLocation,
  setSelectedLocation,
  minRating,
  setMinRating,
  showVerifiedOnly,
  setShowVerifiedOnly,
  showOrganicOnly,
  setShowOrganicOnly,
  maxDistance,
  setMaxDistance,
  locations,
  activeFilterCount,
  onClearAll,
}: AdvancedFiltersProps) {
  return (
    <div className="advanced-filters">
      <div className="filters-header">
        <h3>
          <Sliders size={20} />
          Advanced Filters
        </h3>
        {activeFilterCount > 0 && (
          <button className="clear-filters-btn" onClick={onClearAll}>
            Clear All ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Price Range */}
      <div className="filter-group">
        <label>Price Range (USD)</label>
        <div className="price-inputs">
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
          />
          <span>to</span>
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
          />
        </div>
      </div>

      {/* Location */}
      <div className="filter-group">
        <label>Location</label>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      {/* Distance */}
      <div className="filter-group">
        <label>Maximum Distance (km)</label>
        <input
          type="number"
          placeholder="e.g., 50"
          value={maxDistance}
          onChange={(e) => setMaxDistance(e.target.value)}
        />
        <small>Filter by distance from your location</small>
      </div>

      {/* Minimum Rating */}
      <div className="filter-group">
        <label>Minimum Seller Rating</label>
        <div className="rating-options">
          {['4', '4.5', '5'].map((rating) => (
            <button
              key={rating}
              className={`rating-btn ${minRating === rating ? 'active' : ''}`}
              onClick={() => setMinRating(minRating === rating ? '' : rating)}
            >
              ⭐ {rating}+
            </button>
          ))}
        </div>
      </div>

      {/* Checkboxes */}
      <div className="filter-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showVerifiedOnly}
            onChange={(e) => setShowVerifiedOnly(e.target.checked)}
          />
          <Check size={16} className={showVerifiedOnly ? 'visible' : 'hidden'} />
          <span>Verified Sellers Only</span>
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showOrganicOnly}
            onChange={(e) => setShowOrganicOnly(e.target.checked)}
          />
          <Check size={16} className={showOrganicOnly ? 'visible' : 'hidden'} />
          <span>Organic Products Only</span>
        </label>
      </div>
    </div>
  );
}
