import { configHelper } from './configHelper';

interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
}

export async function geocodeLocation(qth: string): Promise<GeocodingResult | null> {
  try {
    const baseUrl =
      configHelper.getSetting(['apis', 'nominatim'], 'baseUrl') ||
      'https://nominatim.openstreetmap.org';
    const userAgent =
      configHelper.getSetting(['apis', 'nominatim'], 'userAgent') || 'HamLedger/1.0';

    const response = await fetch(
      `${baseUrl}/search?q=${encodeURIComponent(qth)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': userAgent,
        },
      }
    );

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
