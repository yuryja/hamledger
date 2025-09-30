import { defineStore } from 'pinia';
import { getWeather } from '../utils/weather';

declare global {
  interface Window {
    electronAPI: {
      fetchWeather: (lat: number, lon: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    };
  }
}

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
        const weatherResult = await getWeather(lat, lon);
        
        if (weatherResult) {
          this.weatherInfo = `${Math.round(weatherResult.temperature)}°C ${weatherResult.description}`;
        } else {
          this.error = 'Nem sikerült betölteni az időjárási adatokat';
          this.weatherInfo = 'Weather unavailable';
        }
      } catch (error) {
        console.error('Weather fetch error:', error);
        this.error = 'Hálózati hiba történt';
        this.weatherInfo = 'Weather unavailable';
      } finally {
        this.isLoading = false;
      }
    },
  },
});
