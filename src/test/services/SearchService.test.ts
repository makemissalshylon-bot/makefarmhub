/**
 * SearchService Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { searchService } from '../../services/search';
import type { Listing } from '../../types';

const mockListings: Listing[] = [
  {
    id: '1',
    sellerId: 'seller-1',
    sellerName: 'John',
    sellerRating: 4.5,
    sellerVerified: true,
    title: 'Fresh Tomatoes',
    description: 'Organic tomatoes from local farm',
    category: 'crops',
    subcategory: 'Vegetables',
    price: 50,
    unit: 'kg',
    quantity: 100,
    location: 'Harare, Zimbabwe',
    images: [],
    status: 'active',
    featured: true,
    createdAt: '2024-01-01',
    views: 100,
  },
  {
    id: '2',
    sellerId: 'seller-2',
    sellerName: 'Jane',
    sellerRating: 4.8,
    sellerVerified: true,
    title: 'Grade A Maize',
    description: 'High quality maize grain',
    category: 'crops',
    subcategory: 'Grains',
    price: 350,
    unit: 'tonne',
    quantity: 10,
    location: 'Bulawayo, Zimbabwe',
    images: [],
    status: 'active',
    featured: false,
    createdAt: '2024-01-15',
    views: 50,
  },
  {
    id: '3',
    sellerId: 'seller-1',
    sellerName: 'John',
    sellerRating: 4.5,
    sellerVerified: true,
    title: 'Broiler Chickens',
    description: 'Healthy broiler chickens ready for sale',
    category: 'livestock',
    subcategory: 'Poultry',
    price: 8,
    unit: 'bird',
    quantity: 500,
    location: 'Harare, Zimbabwe',
    images: [],
    status: 'active',
    featured: false,
    createdAt: '2024-01-20',
    views: 75,
  },
];

describe('SearchService', () => {
  beforeEach(() => {
    searchService.clearHistory();
    // Also clear saved searches
    searchService.getSavedSearches().forEach(s => searchService.deleteSavedSearch(s.id));
  });

  describe('search', () => {
    it('returns all items when no filters', () => {
      const result = searchService.search(mockListings, {});
      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('filters by text query', () => {
      const result = searchService.search(mockListings, { query: 'tomatoes' });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Fresh Tomatoes');
    });

    it('filters by category', () => {
      const result = searchService.search(mockListings, { category: 'livestock' });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Broiler Chickens');
    });

    it('filters by price range', () => {
      const result = searchService.search(mockListings, { minPrice: 10, maxPrice: 100 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Fresh Tomatoes');
    });

    it('filters by location', () => {
      const result = searchService.search(mockListings, { location: 'Bulawayo' });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Grade A Maize');
    });

    it('filters by verified sellers', () => {
      const result = searchService.search(mockListings, { verified: true });
      expect(result.items).toHaveLength(3);
    });

    it('filters by featured', () => {
      const result = searchService.search(mockListings, { featured: true });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Fresh Tomatoes');
    });

    it('sorts by price ascending', () => {
      const result = searchService.search(mockListings, { sortBy: 'price-asc' });
      expect(result.items[0].price).toBe(8);
      expect(result.items[2].price).toBe(350);
    });

    it('sorts by price descending', () => {
      const result = searchService.search(mockListings, { sortBy: 'price-desc' });
      expect(result.items[0].price).toBe(350);
      expect(result.items[2].price).toBe(8);
    });

    it('sorts by newest', () => {
      const result = searchService.search(mockListings, { sortBy: 'newest' });
      expect(result.items[0].title).toBe('Broiler Chickens');
    });

    it('paginates results', () => {
      const result = searchService.search(mockListings, { page: 1, limit: 2 });
      expect(result.items).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(2);
    });

    it('returns facets', () => {
      const result = searchService.search(mockListings, {});
      expect(result.facets).toBeDefined();
      expect(result.facets?.categories).toHaveLength(2);
      expect(result.facets?.locations).toHaveLength(2);
    });
  });

  describe('getSuggestions', () => {
    it('returns suggestions for partial query', () => {
      const suggestions = searchService.getSuggestions('tom', mockListings);
      expect(suggestions).toContain('Fresh Tomatoes');
    });

    it('returns empty array for short query', () => {
      const suggestions = searchService.getSuggestions('t', mockListings);
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('search history', () => {
    it('adds search to history', () => {
      searchService.search(mockListings, { query: 'tomatoes' });
      const history = searchService.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].query).toBe('tomatoes');
    });

    it('clears history', () => {
      searchService.search(mockListings, { query: 'tomatoes' });
      searchService.clearHistory();
      const history = searchService.getHistory();
      expect(history).toHaveLength(0);
    });

    it('removes duplicate queries', () => {
      searchService.search(mockListings, { query: 'tomatoes' });
      searchService.search(mockListings, { query: 'maize' });
      searchService.search(mockListings, { query: 'tomatoes' });
      const history = searchService.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].query).toBe('tomatoes');
    });
  });

  describe('saved searches', () => {
    it('saves a search', () => {
      const saved = searchService.saveSearch('My Search', { category: 'crops' });
      expect(saved.name).toBe('My Search');
      expect(saved.filters.category).toBe('crops');
    });

    it('gets saved searches', () => {
      searchService.saveSearch('Search 1', { category: 'crops' });
      searchService.saveSearch('Search 2', { category: 'livestock' });
      const saved = searchService.getSavedSearches();
      expect(saved).toHaveLength(2);
    });

    it('deletes a saved search', () => {
      const saved = searchService.saveSearch('My Search', { category: 'crops' });
      searchService.deleteSavedSearch(saved.id);
      const searches = searchService.getSavedSearches();
      expect(searches).toHaveLength(0);
    });
  });
});
