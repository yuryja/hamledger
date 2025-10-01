import { configHelper } from './configHelper';

interface WeatherResult {
  temperature: number;
  weatherCode: number;
  description: string;
}

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

export async function getWeather(lat: number, lon: number): Promise<WeatherResult | null> {
  try {
    const baseUrl =
      configHelper.getSetting(['apis', 'openMeteo'], 'baseUrl') || 'https://api.open-meteo.com/v1';

    const response = await fetch(
      `${baseUrl}/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );

    const data = await response.json();

    if (data && data.current_weather) {
      const { temperature, weathercode } = data.current_weather;
      return {
        temperature,
        weatherCode: weathercode,
        description: WMO_CODES[weathercode] || 'Unknown',
      };
    }

    return null;
  } catch (error) {
    console.error('Weather API error:', error);
    return null;
  }
}
