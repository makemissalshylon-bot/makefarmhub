/**
 * Market Price Service
 * Track commodity prices and trends
 */

export interface PriceData {
  commodity: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  lastUpdated: string;
}

export interface PriceTrend {
  date: string;
  price: number;
}

export const marketPriceService = {
  /**
   * Get current market prices for commodities
   */
  async getCurrentPrices(commodities?: string[]): Promise<PriceData[]> {
    // In production, fetch from real market data API
    // For now, return Zimbabwe agricultural commodity prices
    
    const allPrices: PriceData[] = [
      { commodity: 'Maize', currentPrice: 450, previousPrice: 420, change: 30, changePercent: 7.14, trend: 'up', unit: 'per ton', lastUpdated: new Date().toISOString() },
      { commodity: 'Wheat', currentPrice: 520, previousPrice: 510, change: 10, changePercent: 1.96, trend: 'up', unit: 'per ton', lastUpdated: new Date().toISOString() },
      { commodity: 'Soybeans', currentPrice: 680, previousPrice: 690, change: -10, changePercent: -1.45, trend: 'down', unit: 'per ton', lastUpdated: new Date().toISOString() },
      { commodity: 'Tobacco', currentPrice: 4.80, previousPrice: 4.75, change: 0.05, changePercent: 1.05, trend: 'up', unit: 'per kg', lastUpdated: new Date().toISOString() },
      { commodity: 'Cotton', currentPrice: 2.20, previousPrice: 2.20, change: 0, changePercent: 0, trend: 'stable', unit: 'per kg', lastUpdated: new Date().toISOString() },
      { commodity: 'Tomatoes', currentPrice: 1.50, previousPrice: 1.80, change: -0.30, changePercent: -16.67, trend: 'down', unit: 'per kg', lastUpdated: new Date().toISOString() },
      { commodity: 'Potatoes', currentPrice: 0.80, previousPrice: 0.75, change: 0.05, changePercent: 6.67, trend: 'up', unit: 'per kg', lastUpdated: new Date().toISOString() },
      { commodity: 'Onions', currentPrice: 1.20, previousPrice: 1.15, change: 0.05, changePercent: 4.35, trend: 'up', unit: 'per kg', lastUpdated: new Date().toISOString() },
      { commodity: 'Cattle', currentPrice: 1200, previousPrice: 1150, change: 50, changePercent: 4.35, trend: 'up', unit: 'per head', lastUpdated: new Date().toISOString() },
      { commodity: 'Goats', currentPrice: 80, previousPrice: 80, change: 0, changePercent: 0, trend: 'stable', unit: 'per head', lastUpdated: new Date().toISOString() },
    ];

    if (commodities && commodities.length > 0) {
      return allPrices.filter(p => commodities.includes(p.commodity));
    }

    return allPrices;
  },

  /**
   * Get price trend history for a commodity
   */
  async getPriceTrend(commodity: string, days: number = 30): Promise<PriceTrend[]> {
    // Generate mock trend data
    const basePrice = 450;
    const trend: PriceTrend[] = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const randomVariation = (Math.random() - 0.5) * 50;
      const price = basePrice + randomVariation;
      
      trend.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(price * 100) / 100,
      });
    }

    return trend;
  },

  /**
   * Get price alerts for user's watchlist
   */
  async getPriceAlerts(userId: string): Promise<any[]> {
    // Fetch user's price alert preferences from database
    return [];
  },

  /**
   * Set price alert for commodity
   */
  async setPriceAlert(userId: string, commodity: string, targetPrice: number, condition: 'above' | 'below') {
    // Store in database
    return {
      success: true,
      message: `Alert set for ${commodity} when price goes ${condition} $${targetPrice}`,
    };
  },

  /**
   * Search prices by commodity name
   */
  async searchPrices(query: string): Promise<PriceData[]> {
    const all = await this.getCurrentPrices();
    return all.filter(p => p.commodity.toLowerCase().includes(query.toLowerCase()));
  },

  /**
   * Get market insights and recommendations
   */
  async getMarketInsights(prices?: PriceData[]): Promise<string[]> {
    const data = prices || await this.getCurrentPrices();
    const insights: string[] = [];

    const rising = data.filter(p => p.trend === 'up').length;
    const falling = data.filter(p => p.trend === 'down').length;

    if (rising > falling) {
      insights.push('Overall market trend is positive with rising commodity prices');
    } else if (falling > rising) {
      insights.push('Market showing downward pressure on several commodities');
    } else {
      insights.push('Market prices are relatively stable');
    }

    const highRise = data.filter(p => p.changePercent > 5);
    if (highRise.length > 0) {
      insights.push(`Strong gains in: ${highRise.map(p => p.commodity).join(', ')}`);
    }

    const highFall = data.filter(p => p.changePercent < -5);
    if (highFall.length > 0) {
      insights.push(`Significant drops in: ${highFall.map(p => p.commodity).join(', ')}`);
    }

    return insights;
  },
};
