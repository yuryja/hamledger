/**
 * Converts a Maidenhead grid locator (e.g., "FN31pr") to latitude/longitude.
 * The returned coordinates represent the center of the grid square.
 *
 * @param grid - The Maidenhead grid locator string. Must have an even number of characters (2, 4, 6, …).
 * @returns An object with properties `lat` and `lon` (in degrees).
 * @throws Error if the grid locator is invalid.
 */
function gridToLatLon(grid: string): { lat: number; lon: number } {
    // Normalize the input.
    grid = grid.trim().toUpperCase();
    if (grid.length < 2 || grid.length % 2 !== 0) {
      throw new Error("Grid locator must be an even-length string (e.g., 2, 4, 6, … characters).");
    }
  
    // Start at the southwest corner of the world.
    let lon = -180;
    let lat = -90;
  
    // The initial cell size is defined by the Field:
    let lonSize = 20; // degrees (360°/18)
    let latSize = 10; // degrees (180°/18)
  
    // Process each pair (each “level”) of characters.
    // Pair index 0: Field (letters A–R)
    // Pair index 1: Square (digits 0–9)
    // Pair index 2: Subsquare (letters A–X)
    // Pair index 3: Extended square (digits 0–9) ... etc.
    for (let pair = 0; pair < grid.length / 2; pair++) {
      const i = pair * 2;
      if (pair === 0) {
        // Field: expect letters A-R.
        const lonChar = grid.charAt(i);
        const latChar = grid.charAt(i + 1);
        if (lonChar < "A" || lonChar > "R" || latChar < "A" || latChar > "R") {
          throw new Error("Invalid field characters in grid locator (must be A–R).");
        }
        lon += (lonChar.charCodeAt(0) - "A".charCodeAt(0)) * lonSize;
        lat += (latChar.charCodeAt(0) - "A".charCodeAt(0)) * latSize;
      } else if (pair % 2 === 1) {
        // Odd pairs: digits (0–9) for squares or extended squares.
        // Each digit pair subdivides the previous cell by 10.
        lonSize /= 10;
        latSize /= 10;
        const lonDigit = parseInt(grid.charAt(i), 10);
        const latDigit = parseInt(grid.charAt(i + 1), 10);
        if (isNaN(lonDigit) || isNaN(latDigit)) {
          throw new Error("Invalid digit characters in grid locator.");
        }
        lon += lonDigit * lonSize;
        lat += latDigit * latSize;
      } else {
        // Even pairs (other than the first pair): letters (A–X) for subsquares.
        // Each letter pair subdivides the previous cell by 24.
        lonSize /= 24;
        latSize /= 24;
        const lonChar = grid.charAt(i);
        const latChar = grid.charAt(i + 1);
        if (lonChar < "A" || lonChar > "X" || latChar < "A" || latChar > "X") {
          throw new Error("Invalid subsquare characters in grid locator (must be A–X).");
        }
        lon += (lonChar.charCodeAt(0) - "A".charCodeAt(0)) * lonSize;
        lat += (latChar.charCodeAt(0) - "A".charCodeAt(0)) * latSize;
      }
    }
  
    // Finally, return the center of the grid square.
    return {
      lat: lat + latSize / 2,
      lon: lon + lonSize / 2,
    };
  }

