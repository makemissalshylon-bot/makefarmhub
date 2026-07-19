import { useState, useEffect } from 'react';
import { 
  Sun, Cloud, CloudRain, CloudSnow, Wind, Droplets, 
  Thermometer, Eye, Sunrise, Sunset, AlertTriangle, Leaf
} from 'lucide-react';
import './WeatherWidget.css';

interface WeatherData {
  location: string;
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'windy';
    description: string;
    visibility: number;
    uvIndex: number;
  };
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'windy';
    rainChance: number;
  }>;
  sunrise: string;
  sunset: string;
  alerts: Array<{
    type: 'frost' | 'heat' | 'rain' | 'drought' | 'wind';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  farmingTips: string[];
}

interface WeatherWidgetProps {
  location?: string;
  compact?: boolean;
}

export default function WeatherWidget({ location = 'Harare, Zimbabwe', compact = false }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>('C');

  useEffect(() => {
    fetchWeather();
  }, [location]);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    
    const apiKey =
      import.meta.env.VITE_OPENWEATHER_API_KEY || import.meta.env.VITE_WEATHER_API_KEY;
    
    // If no API key, use mock data
    if (!apiKey) {
      console.warn('No OpenWeatherMap API key found. Using mock data.');
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockWeather: WeatherData = {
        location,
        current: {
          temp: 28,
          feelsLike: 30,
          humidity: 65,
          windSpeed: 12,
          windDirection: 'NE',
          condition: 'sunny',
          description: 'Clear skies with light breeze',
          visibility: 10,
          uvIndex: 7
        },
        forecast: [
          { day: 'Mon', high: 29, low: 18, condition: 'sunny', rainChance: 5 },
          { day: 'Tue', high: 27, low: 17, condition: 'cloudy', rainChance: 20 },
          { day: 'Wed', high: 24, low: 16, condition: 'rainy', rainChance: 80 },
          { day: 'Thu', high: 25, low: 15, condition: 'cloudy', rainChance: 30 },
          { day: 'Fri', high: 28, low: 17, condition: 'sunny', rainChance: 10 },
          { day: 'Sat', high: 30, low: 19, condition: 'sunny', rainChance: 5 },
          { day: 'Sun', high: 31, low: 20, condition: 'sunny', rainChance: 5 }
        ],
        sunrise: '05:42',
        sunset: '18:23',
        alerts: [
          {
            type: 'rain',
            message: 'Heavy rain expected Wednesday - secure crops and equipment',
            severity: 'medium'
          }
        ],
        farmingTips: [
          'Good conditions for planting maize and vegetables',
          'Apply irrigation early morning before peak heat',
          'Prepare drainage for Wednesday rainfall',
          'Ideal time for harvesting tomatoes and peppers'
        ]
      };
      
      setWeather(mockWeather);
      setLoading(false);
      return;
    }
    
    // Real API call to OpenWeatherMap
    try {
      // Get coordinates from location name
      const geoResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`
      );
      
      if (!geoResponse.ok) {
        throw new Error('Failed to fetch location coordinates');
      }
      
      const geoData = await geoResponse.json();
      if (!geoData || geoData.length === 0) {
        throw new Error('Location not found');
      }
      
      const { lat, lon } = geoData[0];
      
      // Fetch current weather and forecast
      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`)
      ]);
      
      if (!currentResponse.ok || !forecastResponse.ok) {
        throw new Error('Failed to fetch weather data');
      }
      
      const currentData = await currentResponse.json();
      const forecastData = await forecastResponse.json();
      
      // Map OpenWeatherMap condition codes to our condition types
      const mapCondition = (code: number): 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'windy' => {
        if (code >= 200 && code < 300) return 'stormy'; // Thunderstorm
        if (code >= 300 && code < 600) return 'rainy';  // Drizzle/Rain
        if (code >= 600 && code < 700) return 'rainy';  // Snow (show as rainy)
        if (code === 800) return 'sunny';               // Clear
        if (code > 800) return 'cloudy';                // Clouds
        return 'windy';                                  // Atmosphere conditions
      };
      
      // Process forecast data - get one forecast per day
      const dailyForecasts: WeatherData['forecast'] = [];
      const processedDays = new Set<string>();
      
      forecastData.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toISOString().split('T')[0];
        
        if (!processedDays.has(dayKey) && dailyForecasts.length < 7) {
          processedDays.add(dayKey);
          dailyForecasts.push({
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            high: Math.round(item.main.temp_max),
            low: Math.round(item.main.temp_min),
            condition: mapCondition(item.weather[0].id),
            rainChance: item.pop ? Math.round(item.pop * 100) : 0
          });
        }
      });
      
      // Generate farming alerts based on weather conditions
      const alerts: WeatherData['alerts'] = [];
      if (currentData.main.temp < 5) {
        alerts.push({
          type: 'frost',
          message: 'Frost warning: Protect sensitive crops',
          severity: 'high'
        });
      }
      if (currentData.main.temp > 35) {
        alerts.push({
          type: 'heat',
          message: 'Extreme heat: Increase irrigation',
          severity: 'high'
        });
      }
      if (currentData.main.humidity < 30) {
        alerts.push({
          type: 'drought',
          message: 'Low humidity: Monitor soil moisture',
          severity: 'medium'
        });
      }
      
      // Generate farming tips
      const farmingTips: string[] = [];
      const temp = currentData.main.temp;
      const humidity = currentData.main.humidity;
      
      if (temp >= 20 && temp <= 30 && humidity >= 50) {
        farmingTips.push('Ideal conditions for planting vegetables');
      }
      if (currentData.weather[0].id >= 500 && currentData.weather[0].id < 600) {
        farmingTips.push('Recent rain - good time to apply fertilizer');
      }
      if (currentData.wind.speed > 10) {
        farmingTips.push('High winds - secure loose structures and supports');
      }
      if (farmingTips.length === 0) {
        farmingTips.push('Monitor weather conditions regularly for best results');
      }
      
      const realWeather: WeatherData = {
        location,
        current: {
          temp: Math.round(currentData.main.temp),
          feelsLike: Math.round(currentData.main.feels_like),
          humidity: currentData.main.humidity,
          windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
          windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(currentData.wind.deg / 45) % 8],
          condition: mapCondition(currentData.weather[0].id),
          description: currentData.weather[0].description,
          visibility: Math.round(currentData.visibility / 1000),
          uvIndex: 0 // OpenWeatherMap free tier doesn't include UV
        },
        forecast: dailyForecasts,
        sunrise: new Date(currentData.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        sunset: new Date(currentData.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        alerts,
        farmingTips
      };
      
      setWeather(realWeather);
      setLoading(false);
    } catch (err) {
      console.error('Weather API Error:', err);
      setError('Failed to fetch weather data. Using default values.');
      
      // Fallback to mock data on error
      const mockWeather: WeatherData = {
        location,
        current: {
          temp: 28,
          feelsLike: 30,
          humidity: 65,
          windSpeed: 12,
          windDirection: 'NE',
          condition: 'sunny',
          description: 'Clear skies with light breeze',
          visibility: 10,
          uvIndex: 7
        },
        forecast: [
          { day: 'Mon', high: 29, low: 18, condition: 'sunny', rainChance: 5 },
          { day: 'Tue', high: 27, low: 17, condition: 'cloudy', rainChance: 20 },
          { day: 'Wed', high: 24, low: 16, condition: 'rainy', rainChance: 80 },
          { day: 'Thu', high: 25, low: 15, condition: 'cloudy', rainChance: 30 },
          { day: 'Fri', high: 28, low: 17, condition: 'sunny', rainChance: 10 },
          { day: 'Sat', high: 30, low: 19, condition: 'sunny', rainChance: 5 },
          { day: 'Sun', high: 31, low: 20, condition: 'sunny', rainChance: 5 }
        ],
        sunrise: '05:42',
        sunset: '18:23',
        alerts: [
          {
            type: 'rain',
            message: 'Heavy rain expected Wednesday - secure crops and equipment',
            severity: 'medium'
          }
        ],
        farmingTips: [
          'Good conditions for planting maize and vegetables',
          'Apply irrigation early morning before peak heat',
          'Prepare drainage for Wednesday rainfall',
          'Ideal time for harvesting tomatoes and peppers'
        ]
      };
      
      setWeather(mockWeather);
      setLoading(false);
    }
  };

  const convertTemp = (celsius: number): number => {
    return unit === 'F' ? Math.round(celsius * 9/5 + 32) : celsius;
  };

  const getWeatherIcon = (condition: string, size = 24) => {
    const icons: Record<string, React.JSX.Element> = {
      sunny: <Sun size={size} className="weather-icon sunny" />,
      cloudy: <Cloud size={size} className="weather-icon cloudy" />,
      rainy: <CloudRain size={size} className="weather-icon rainy" />,
      stormy: <CloudRain size={size} className="weather-icon stormy" />,
      windy: <Wind size={size} className="weather-icon windy" />,
      snowy: <CloudSnow size={size} className="weather-icon snowy" />
    };
    return icons[condition] || <Sun size={size} />;
  };

  if (loading) {
    return (
      <div className={`weather-widget ${compact ? 'compact' : ''}`}>
        <div className="weather-loading">
          <div className="loading-spinner" />
          <span>Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className={`weather-widget ${compact ? 'compact' : ''} error`}>
        <p>{error || 'Weather unavailable'}</p>
        <button onClick={fetchWeather}>Retry</button>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="weather-widget compact">
        <div className="compact-weather">
          {getWeatherIcon(weather.current.condition, 32)}
          <div className="compact-info">
            <span className="compact-temp">{convertTemp(weather.current.temp)}°{unit}</span>
            <span className="compact-location">{weather.location.split(',')[0]}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="weather-widget">
      <div className="weather-header">
        <div>
          <h3>Farm Weather</h3>
          <p className="weather-location">{weather.location}</p>
        </div>
        <div className="unit-toggle">
          <button 
            className={unit === 'C' ? 'active' : ''} 
            onClick={() => setUnit('C')}
          >°C</button>
          <button 
            className={unit === 'F' ? 'active' : ''} 
            onClick={() => setUnit('F')}
          >°F</button>
        </div>
      </div>

      <div className="current-weather">
        <div className="current-main">
          {getWeatherIcon(weather.current.condition, 64)}
          <div className="current-temp">
            <span className="temp-value">{convertTemp(weather.current.temp)}°</span>
            <span className="temp-unit">{unit}</span>
          </div>
        </div>
        <p className="weather-description">{weather.current.description}</p>
        <p className="feels-like">Feels like {convertTemp(weather.current.feelsLike)}°{unit}</p>
      </div>

      <div className="weather-details">
        <div className="detail-item">
          <Droplets size={18} />
          <span>{weather.current.humidity}%</span>
          <label>Humidity</label>
        </div>
        <div className="detail-item">
          <Wind size={18} />
          <span>{weather.current.windSpeed} km/h</span>
          <label>{weather.current.windDirection} Wind</label>
        </div>
        <div className="detail-item">
          <Eye size={18} />
          <span>{weather.current.visibility} km</span>
          <label>Visibility</label>
        </div>
        <div className="detail-item">
          <Thermometer size={18} />
          <span>UV {weather.current.uvIndex}</span>
          <label>{weather.current.uvIndex > 6 ? 'High' : 'Moderate'}</label>
        </div>
      </div>

      <div className="sun-times">
        <div className="sun-item">
          <Sunrise size={18} />
          <span>{weather.sunrise}</span>
          <label>Sunrise</label>
        </div>
        <div className="sun-item">
          <Sunset size={18} />
          <span>{weather.sunset}</span>
          <label>Sunset</label>
        </div>
      </div>

      {weather.alerts.length > 0 && (
        <div className="weather-alerts">
          {weather.alerts.map((alert, index) => (
            <div key={index} className={`alert-item ${alert.severity}`}>
              <AlertTriangle size={18} />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="forecast-section">
        <h4>7-Day Forecast</h4>
        <div className="forecast-list">
          {weather.forecast.map((day, index) => (
            <div key={index} className="forecast-day">
              <span className="day-name">{day.day}</span>
              {getWeatherIcon(day.condition, 24)}
              <div className="day-temps">
                <span className="high">{convertTemp(day.high)}°</span>
                <span className="low">{convertTemp(day.low)}°</span>
              </div>
              <div className="rain-chance">
                <Droplets size={12} />
                <span>{day.rainChance}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="farming-tips">
        <h4><Leaf size={18} /> Farming Tips</h4>
        <ul>
          {weather.farmingTips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
