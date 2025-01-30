import { defineStore } from 'pinia'

export const useWeatherStore = defineStore('weather', {
  state: () => ({
    weatherInfo: '28°C Sunny'
  }),

  actions: {
    async updateWeatherInfo(lat?: number, lon?: number) {
      if (!lat || !lon) return
      
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        )
        const data = await response.json()
        if (data?.current_weather) {
          const { temperature, weathercode } = data.current_weather
          this.weatherInfo = `${temperature}°C ${this.getWeatherDescription(weathercode)}`
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error)
      }
    },

    getWeatherDescription(code: number): string {
      // Simplified weather code mapping
      const weatherCodes: { [key: number]: string } = {
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
        95: 'Thunderstorm'
      }
      return weatherCodes[code] || 'Unknown'
    }
  }
})
