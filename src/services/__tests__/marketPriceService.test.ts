import { describe, it, expect, beforeEach, vi } from 'vitest';
import { marketPriceService } from '../marketPriceService';

describe('marketPriceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentPrices', () => {
    it('should return all market prices', async () => {
      const prices = await marketPriceService.getCurrentPrices();

      expect(prices).toBeInstanceOf(Array);
      expect(prices.length).toBeGreaterThan(0);
      expect(prices[0]).toHaveProperty('commodity');
      expect(prices[0]).toHaveProperty('currentPrice');
      expect(prices[0]).toHaveProperty('unit');
    });

    it('should include major Zimbabwe commodities', async () => {
      const prices = await marketPriceService.getCurrentPrices();
      const commodities = prices.map(p => p.commodity.toLowerCase());

      expect(commodities).toContain('maize');
      expect(commodities).toContain('tobacco');
      expect(commodities).toContain('cattle');
    });

    it('should filter by commodity when provided', async () => {
      const prices = await marketPriceService.getCurrentPrices(['Maize', 'Wheat']);
      expect(prices.length).toBe(2);
    });
  });

  describe('getPriceTrend', () => {
    it('should return price history array for a commodity', async () => {
      const trend = await marketPriceService.getPriceTrend('Maize', 7);

      expect(trend).toBeInstanceOf(Array);
      expect(trend.length).toBe(8); // days + current
      expect(trend[0]).toHaveProperty('date');
      expect(trend[0]).toHaveProperty('price');
    });

    it('should respect days parameter', async () => {
      const trend = await marketPriceService.getPriceTrend('Maize', 3);
      expect(trend.length).toBe(4); // 3 + 1
    });
  });

  describe('getMarketInsights', () => {
    it('should provide market insights', async () => {
      const insights = await marketPriceService.getMarketInsights();

      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);
      expect(typeof insights[0]).toBe('string');
    });
  });

  describe('searchPrices', () => {
    it('should filter prices by query', async () => {
      const results = await marketPriceService.searchPrices('maize');
      const commodities = results.map(r => r.commodity.toLowerCase());

      expect(commodities.every(c => c.includes('maize'))).toBe(true);
    });

    it('should be case insensitive', async () => {
      const results1 = await marketPriceService.searchPrices('MAIZE');
      const results2 = await marketPriceService.searchPrices('maize');

      expect(results1.length).toBe(results2.length);
    });
  });
});
