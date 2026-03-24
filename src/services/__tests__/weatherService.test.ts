import { describe, it, expect, beforeEach, vi } from 'vitest';
import { weatherService } from '../weatherService';

describe('weatherService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn() as any;
  });

  describe('getCurrentWeather', () => {
    it('should return mock weather when no API key', async () => {
      const result = await weatherService.getCurrentWeather(-17.8292, 31.0522);

      expect(result).toHaveProperty('temperature');
      expect(result).toHaveProperty('condition');
      expect(result).toHaveProperty('humidity');
      expect(result).toHaveProperty('windSpeed');
      expect(result).toHaveProperty('rainfall');
      expect(result).toHaveProperty('forecast');
      expect(result.forecast).toHaveLength(7);
    });

    it('should fetch weather with valid API key', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          main: { temp: 25, humidity: 60 },
          weather: [{ main: 'Sunny' }],
          wind: { speed: 10 },
          rain: { '1h': 0 },
        }),
      });

      // Mock getForecast
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          list: Array(7).fill({
            dt: Date.now() / 1000,
            main: { temp: 25 },
            weather: [{ main: 'Sunny' }],
            pop: 0.1,
          }),
        }),
      });

      const result = await weatherService.getCurrentWeather(-17.8292, 31.0522);

      expect(result.temperature).toBeDefined();
      expect(result.condition).toBeDefined();
    });
  });

  describe('getForecast', () => {
    it('should fetch 7-day forecast', async () => {
      const mockForecast = {
        list: Array(7).fill({
          dt: Date.now() / 1000,
          main: { temp: 25, humidity: 60 },
          weather: [{ main: 'Sunny', icon: '01d' }],
        }),
      };

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForecast,
      });

      const result = await weatherService.getForecast(-17.8292, 31.0522);

      expect(result).toHaveLength(7);
      expect(result[0]).toHaveProperty('tempHigh');
      expect(result[0]).toHaveProperty('tempLow');
      expect(result[0]).toHaveProperty('condition');
    });
  });

  describe('getFarmingRecommendations', () => {
    it('should provide recommendations based on weather', () => {
      const recommendations = weatherService.getFarmingRecommendations({
        temperature: 25,
        humidity: 70,
        condition: 'Rain',
        windSpeed: 10,
        rainfall: 15,
        forecast: [],
      });

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend irrigation when hot and dry', () => {
      const recommendations = weatherService.getFarmingRecommendations({
        temperature: 35,
        humidity: 30,
        condition: 'Clear',
        windSpeed: 5,
        rainfall: 0,
        forecast: [],
      });

      const hasIrrigationAdvice = recommendations.some(r => 
        r.toLowerCase().includes('irrigat') || r.toLowerCase().includes('water')
      );
      expect(hasIrrigationAdvice).toBe(true);
    });

    it('should warn about frost in cold weather', () => {
      const recommendations = weatherService.getFarmingRecommendations({
        temperature: 2,
        humidity: 80,
        condition: 'Clear',
        windSpeed: 5,
        rainfall: 0,
        forecast: [],
      });

      const hasFrostWarning = recommendations.some(r => 
        r.toLowerCase().includes('frost') || r.toLowerCase().includes('cold')
      );
      expect(hasFrostWarning).toBe(true);
    });
  });

  describe('getPlantingCalendar', () => {
    it('should return planting info for specific crop', () => {
      const maizeInfo = weatherService.getPlantingCalendar('maize');

      expect(maizeInfo).toHaveProperty('start');
      expect(maizeInfo).toHaveProperty('end');
      expect(maizeInfo).toHaveProperty('notes');
      expect(maizeInfo.start).toBe('October');
    });

    it('should handle multiple crops', () => {
      const maize = weatherService.getPlantingCalendar('maize');
      const tobacco = weatherService.getPlantingCalendar('tobacco');
      const wheat = weatherService.getPlantingCalendar('wheat');

      expect(maize.start).toBe('October');
      expect(tobacco.start).toBe('September');
      expect(wheat.start).toBe('April');
    });

    it('should handle unknown crops with fallback', () => {
      const unknown = weatherService.getPlantingCalendar('unknown-crop');
      
      expect(unknown.start).toBe('Consult local extension');
      expect(unknown.notes).toContain('not available');
    });
  });
});
