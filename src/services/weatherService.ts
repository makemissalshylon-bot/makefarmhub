/**
 * Weather Service for Farmers
 * Integrates with OpenWeatherMap API
 */

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  forecast: ForecastDay[];
}

interface ForecastDay {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  rainProbability: number;
}

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const weatherService = {
  /**
   * Get current weather for location
   */
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    if (!API_KEY) {
      return this.getMockWeather();
    }

    const response = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();

    return {
      temperature: data.main.temp,
      condition: data.weather[0].main,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      rainfall: data.rain?.['1h'] || 0,
      forecast: await this.getForecast(lat, lon),
    };
  },

  /**
   * Get 7-day forecast
   */
  async getForecast(lat: number, lon: number): Promise<ForecastDay[]> {
    if (!API_KEY) {
      return this.getMockForecast();
    }

    const response = await fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();

    const dailyData = data.list.filter((_: any, index: number) => index % 8 === 0);
    
    return dailyData.slice(0, 7).map((day: any) => ({
      date: new Date(day.dt * 1000).toLocaleDateString(),
      tempHigh: day.main.temp_max,
      tempLow: day.main.temp_min,
      condition: day.weather[0].main,
      rainProbability: day.pop * 100,
    }));
  },

  /**
   * Get farming recommendations based on weather
   */
  getFarmingRecommendations(weather: WeatherData): string[] {
    const recommendations: string[] = [];

    if (weather.temperature > 30) {
      recommendations.push('High temperatures - Ensure adequate irrigation');
      recommendations.push('Consider shade cloth for sensitive crops');
    }

    if (weather.rainfall > 10) {
      recommendations.push('Heavy rainfall expected - Check drainage systems');
      recommendations.push('Postpone spraying activities');
    }

    if (weather.humidity > 80) {
      recommendations.push('High humidity - Monitor for fungal diseases');
      recommendations.push('Improve air circulation in greenhouses');
    }

    if (weather.windSpeed > 20) {
      recommendations.push('Strong winds - Secure loose structures');
      recommendations.push('Delay pesticide application');
    }

    if (recommendations.length === 0) {
      recommendations.push('Good conditions for general farm activities');
    }

    return recommendations;
  },

  /**
   * Get planting calendar for Zimbabwe
   */
  getPlantingCalendar(crop: string): { start: string; end: string; notes: string } {
    const calendar: Record<string, any> = {
      maize: { start: 'October', end: 'December', notes: 'Plant after first rains' },
      tobacco: { start: 'September', end: 'November', notes: 'Requires nursery preparation' },
      wheat: { start: 'April', end: 'June', notes: 'Winter crop, needs irrigation' },
      soybeans: { start: 'November', end: 'December', notes: 'Plant in warm soil' },
      cotton: { start: 'October', end: 'November', notes: 'Requires consistent moisture' },
      tomatoes: { start: 'Year-round', end: '', notes: 'With irrigation and proper timing' },
      potatoes: { start: 'February', end: 'April', notes: 'Cool season crop' },
    };

    return calendar[crop.toLowerCase()] || { 
      start: 'Consult local extension', 
      end: '', 
      notes: 'Crop-specific information not available' 
    };
  },

  // Mock data for development
  getMockWeather(): WeatherData {
    return {
      temperature: 28,
      condition: 'Partly Cloudy',
      humidity: 65,
      windSpeed: 12,
      rainfall: 0,
      forecast: this.getMockForecast(),
    };
  },

  getMockForecast(): ForecastDay[] {
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy'];
    return Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toLocaleDateString(),
      tempHigh: 30 + Math.random() * 5,
      tempLow: 18 + Math.random() * 5,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      rainProbability: Math.random() * 100,
    }));
  },
};
