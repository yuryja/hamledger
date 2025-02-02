/**
 * Class representing a Maidenhead Grid Locator system
 */
export class MaidenheadLocator {
  private static readonly FIELD_SIZE_LON = 20; // degrees (360°/18)
  private static readonly FIELD_SIZE_LAT = 10; // degrees (180°/18)

  /**
   * Converts a Maidenhead grid locator (e.g., "FN31pr") to latitude/longitude.
   * The returned coordinates represent the center of the grid square.
   *
   * @param grid - The Maidenhead grid locator string. Must have an even number of characters (2, 4, 6, …).
   * @returns An object with properties `lat` and `lon` (in degrees).
   * @throws Error if the grid locator is invalid.
   */
  public static gridToLatLon(grid: string): { lat: number; lon: number } {
    // Normalize the input
    grid = grid.trim().toUpperCase();
    
    if (!MaidenheadLocator.isValidGridFormat(grid)) {
      throw new Error("Grid locator must be an even-length string (e.g., 2, 4, 6, … characters).");
    }

    // Start at the southwest corner of the world
    let lon = -180;
    let lat = -90;
    let lonSize = this.FIELD_SIZE_LON;
    let latSize = this.FIELD_SIZE_LAT;

    // Process each pair of characters
    for (let pair = 0; pair < grid.length / 2; pair++) {
      const i = pair * 2;
      
      if (pair === 0) {
        const { newLon, newLat } = this.processField(grid.charAt(i), grid.charAt(i + 1), lon, lat, lonSize, latSize);
        lon = newLon;
        lat = newLat;
      } else if (pair % 2 === 1) {
        const { newLon, newLat, newLonSize, newLatSize } = this.processDigitPair(
          grid.charAt(i),
          grid.charAt(i + 1),
          lon,
          lat,
          lonSize,
          latSize
        );
        lon = newLon;
        lat = newLat;
        lonSize = newLonSize;
        latSize = newLatSize;
      } else {
        const { newLon, newLat, newLonSize, newLatSize } = this.processSubsquare(
          grid.charAt(i),
          grid.charAt(i + 1),
          lon,
          lat,
          lonSize,
          latSize
        );
        lon = newLon;
        lat = newLat;
        lonSize = newLonSize;
        latSize = newLatSize;
      }
    }

    // Return the center of the grid square
    return {
      lat: lat + latSize / 2,
      lon: lon + lonSize / 2,
    };
  }

  private static isValidGridFormat(grid: string): boolean {
    return grid.length >= 2 && grid.length % 2 === 0;
  }

  private static processField(
    lonChar: string,
    latChar: string,
    lon: number,
    lat: number,
    lonSize: number,
    latSize: number
  ): { newLon: number; newLat: number } {
    if (lonChar < "A" || lonChar > "R" || latChar < "A" || latChar > "R") {
      throw new Error("Invalid field characters in grid locator (must be A–R).");
    }

    const newLon = lon + (lonChar.charCodeAt(0) - "A".charCodeAt(0)) * lonSize;
    const newLat = lat + (latChar.charCodeAt(0) - "A".charCodeAt(0)) * latSize;

    return { newLon, newLat };
  }

  private static processDigitPair(
    lonDigitChar: string,
    latDigitChar: string,
    lon: number,
    lat: number,
    lonSize: number,
    latSize: number
  ): { newLon: number; newLat: number; newLonSize: number; newLatSize: number } {
    const lonDigit = parseInt(lonDigitChar, 10);
    const latDigit = parseInt(latDigitChar, 10);

    if (isNaN(lonDigit) || isNaN(latDigit)) {
      throw new Error("Invalid digit characters in grid locator.");
    }

    const newLonSize = lonSize / 10;
    const newLatSize = latSize / 10;

    return {
      newLon: lon + lonDigit * newLonSize,
      newLat: lat + latDigit * newLatSize,
      newLonSize,
      newLatSize,
    };
  }

  private static processSubsquare(
    lonChar: string,
    latChar: string,
    lon: number,
    lat: number,
    lonSize: number,
    latSize: number
  ): { newLon: number; newLat: number; newLonSize: number; newLatSize: number } {
    if (lonChar < "A" || lonChar > "X" || latChar < "A" || latChar > "X") {
      throw new Error("Invalid subsquare characters in grid locator (must be A–X).");
    }

    const newLonSize = lonSize / 24;
    const newLatSize = latSize / 24;

    return {
      newLon: lon + (lonChar.charCodeAt(0) - "A".charCodeAt(0)) * newLonSize,
      newLat: lat + (latChar.charCodeAt(0) - "A".charCodeAt(0)) * newLatSize,
      newLonSize,
      newLatSize,
    };
  }
}
