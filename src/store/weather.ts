import { defineStore } from 'pinia';
import '../types/electron';

export const useWeatherStore = defineStore('weather', {
  state: () => ({
    weatherInfo: '28°C Sunny',
    isLoading: false,
    error: null as string | null,
  }),

  actions: {
    async updateWeatherInfo(lat?: number, lon?: number) {
      if (!lat || !lon) return;

      this.isLoading = true;
      this.error = null;

      try {
        const response = await window.electronAPI.fetchWeather(lat, lon);

        if (response.success && response.data?.current_weather) {
          const { temperature, weathercode } = response.data.current_weather;

          // Use the weather description mapping from utils/weather.ts
          const WMO_CODES: { [key: number]: string } = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            71: 'Slight snow',
            73: 'Moderate snow',
            75: 'Heavy snow',
            77: 'Snow grains',
            80: 'Slight rain showers',
            81: 'Moderate rain showers',
            82: 'Violent rain showers',
            95: 'Thunderstorm',
          };

          const description = WMO_CODES[weathercode] || 'Unknown';
          this.weatherInfo = `${Math.round(temperature)}°C ${description}`;
        } else {
          this.error = response.error || 'Failed to load weather data';
          this.weatherInfo = 'Weather unavailable';
        }
      } catch (error) {
        console.error('Weather fetch error:', error);
        this.error = 'Network error occurred';
        this.weatherInfo = 'Weather unavailable';
      } finally {
        this.isLoading = false;
      }
    },
  },
});
