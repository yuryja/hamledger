/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia';
import { getWeather } from '../utils/weather';

declare global {
  interface Window {
    electronAPI: {
      addQso: (qso: any) => Promise<any>;
      getAllDocs: () => Promise<any>;
      importAdif: () => Promise<{ imported: boolean; count?: number; error?: any }>;
      loadSettings: () => Promise<any>;
      saveSettings: (settings: any) => Promise<void>;
      updateQso: (qso: any) => Promise<any>;
      fetchDxSpots: (params: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      fetchPropagationData: () => Promise<{ success: boolean; data?: any; error?: string }>;
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
        const response = await window.electronAPI.fetchWeather(lat, lon);
        
        if (response.success && response.data?.current_weather) {
          const { temperature, weathercode } = response.data.current_weather;
          const weatherResult = await getWeather(lat, lon);
          
          if (weatherResult) {
            this.weatherInfo = `${Math.round(weatherResult.temperature)}°C ${weatherResult.description}`;
          } else {
            this.weatherInfo = `${Math.round(temperature)}°C Unknown`;
          }
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
