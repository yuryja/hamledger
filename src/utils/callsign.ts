interface PrefixMap {
  [key: string]: string;
}

const prefixMap: PrefixMap = {
  '2': 'gb',
  '3A': 'mc',
  '3B': 'mu',
  '3C': 'gq',
  '3D[A-M]': 'sz',
  '3D[N-Z]': 'fj',
  '3G': 'cl',
  '3V': 'tn',
  '3W': 'vn',
  '3X': 'gn',
  '3Y': 'no',
  '3Z': 'pl',
  '3[E-F]': 'pa',
  '3[H-U]': 'cn',
  '4L': 'ge',
  '4M': 've',
  '4O': 'me',
  '4T': 'pe',
  '4U': 'un',
  '4V': 'ht',
  '4W': 'tl',
  '4X': 'il',
  '4Z': 'il',
  '4[A-C]': 'mx',
  '4[D-I]': 'ph',
  '4[J-K]': 'az',
  '4[P-S]': 'lk',
  '5A': 'ly',
  '5B': 'cy',
  '5T': 'mr',
  '5U': 'ne',
  '5V': 'tg',
  '5W': 'ws',
  '5X': 'ug',
  '5[C-G]': 'ma',
  '5[H-I]': 'tz',
  '5[J-K]': 'co',
  '5[L-M]': 'lr',
  '5[N-O]': 'ng',
  '5[P-Q]': 'dk',
  '5[R-S]': 'mg',
  '5[Y-Z]': 'ke',
  '6C': 'sy',
  '6O': 'so',
  '6X': 'mg',
  '6Y': 'jm',
  '6Z': 'lr',
  '6[A-B]': 'eg',
  '6[D-J]': 'mx',
  '6[K-N]': 'kr',
  '6[P-S]': 'pk',
  '6[T-U]': 'sd',
  '6[V-W]': 'sn',
  '7O': 'ye',
  '7P': 'ls',
  '7Q': 'mw',
  '7R': 'dz',
  '7S': 'se',
  '7Z': 'sa',
  '7[A-I]': 'id',
  '7[J-N]': 'jp',
  '7[T-Y]': 'dz',
  '8O': 'bw',
  '8P': 'bb',
  '8Q': 'mv',
  '8R': 'gy',
  '8S': 'se',
  '8Z': 'sa',
  '8[A-I]': 'id',
  '8[J-N]': 'jp',
  '8[T-Y]': 'in',
  '9A': 'hr',
  '9G': 'gh',
  '9H': 'mt',
  '9K': 'kw',
  '9L': 'sl',
  '9M': 'my',
  '9N': 'np',
  '9U': 'bi',
  '9V': 'sg',
  '9W': 'my',
  '9X': 'rw',
  '9[B-D]': 'ir',
  '9[E-F]': 'et',
  '9[I-J]': 'zm',
  '9[O-T]': 'cd',
  '9[Y-Z]': 'tt',
  A2: 'bw',
  A3: 'to',
  A4: 'om',
  A5: 'bt',
  A6: 'ae',
  A7: 'qa',
  A8: 'lr',
  A9: 'bh',
  AX: 'au',
  'A[A-L]': 'us',
  'A[M-O]': 'es',
  'A[P-S]': 'pk',
  'A[T-W]': 'in',
  'A[Y-Z]': 'ar',
  B: 'cn',
  C2: 'nr',
  C3: 'ad',
  C4: 'cy',
  C5: 'gm',
  C6: 'bs',
  C7: 'wm',
  CN: 'ma',
  CO: 'cu',
  CP: 'bo',
  'C[8-9]': 'mz',
  'C[A-E]': 'cl',
  'C[F-K]': 'ca',
  'C[L-M]': 'cu',
  'C[Q-U]': 'pt',
  'C[V-X]': 'uy',
  'C[Y-Z]': 'ca',
  D4: 'cv',
  D5: 'lr',
  D6: 'km',
  'D[2-3]': 'ao',
  'D[7-9]': 'kr',
  'D[A-R]': 'de',
  'D[S-T]': 'kr',
  'D[U-Z]': 'ph',
  E2: 'th',
  E3: 'er',
  E4: 'ps',
  E5: 'ck',
  E6: 'nu',
  E7: 'ba',
  EK: 'am',
  EL: 'lr',
  ER: 'md',
  ES: 'ee',
  ET: 'et',
  EX: 'kg',
  EY: 'tj',
  EZ: 'tm',
  'E[A-H]': 'es',
  'E[I-J]': 'ie',
  'E[M-O]': 'ua',
  'E[P-Q]': 'ir',
  'E[U-W]': 'by',
  F: 'fr',
  G: 'gb',
  H2: 'cy',
  H3: 'pa',
  H4: 'sb',
  HA: 'hu',
  HB: 'ch',
  HE: 'ch',
  HF: 'pl',
  HG: 'hu',
  HH: 'ht',
  HI: 'do',
  HL: 'kr',
  HM: 'kp',
  HN: 'iq',
  HS: 'th',
  HT: 'ni',
  HU: 'sv',
  HV: 'va',
  HZ: 'sa',
  'H[6-7]': 'ni',
  'H[8-9]': 'pa',
  'H[C-D]': 'ec',
  'H[J-K]': 'co',
  'H[O-P]': 'pa',
  'H[Q-R]': 'hn',
  'H[W-Y]': 'fr',
  I: 'it',
  J2: 'dj',
  J3: 'gd',
  J4: 'gr',
  J5: 'gw',
  J6: 'lc',
  J7: 'dm',
  J8: 'vc',
  JY: 'jo',
  JZ: 'id',
  'J[A-S]': 'jp',
  'J[T-V]': 'mn',
  'J[W-X]': 'no',
  K: 'us',
  LX: 'lu',
  LY: 'lt',
  LZ: 'bg',
  'L[2-9]': 'ar',
  'L[A-N]': 'no',
  'L[O-W]': 'ar',
  M: 'gb',
  N: 'us',
  OD: 'lb',
  OE: 'at',
  OM: 'sk',
  'O[A-C]': 'pe',
  'O[F-J]': 'fi',
  'O[K-L]': 'cz',
  'O[N-T]': 'be',
  'O[U-Z]': 'dk',
  P2: 'pg',
  P3: 'cy',
  P4: 'aw',
  PJ: 'sx',
  PZ: 'sr',
  'P[5-9]': 'kp',
  'P[A-I]': 'nl',
  'P[K-O]': 'id',
  'P[P-Y]': 'br',
  R: 'ru',
  S5: 'si',
  S6: 'sg',
  S7: 'sc',
  S8: 'za',
  S9: 'st',
  'SS[A-M]': 'eg',
  'SS[N-Z]': 'sd',
  ST: 'sd',
  SU: 'eg',
  'S[2-3]': 'bd',
  'S[A-M]': 'se',
  'S[N-R]': 'pl',
  'S[V-Z]': 'gr',
  T2: 'tv',
  T3: 'ki',
  T4: 'cu',
  T5: 'so',
  T6: 'af',
  T7: 'sm',
  T8: 'pw',
  TD: 'gt',
  TE: 'cr',
  TF: 'is',
  TG: 'gt',
  TH: 'fr',
  TI: 'cr',
  TJ: 'cm',
  TK: 'fr',
  TL: 'cf',
  TM: 'fr',
  TN: 'cg',
  TR: 'ga',
  TS: 'tn',
  TT: 'td',
  TU: 'ci',
  TY: 'bj',
  TZ: 'ml',
  'T[A-C]': 'tr',
  'T[O-Q]': 'fr',
  'T[V-X]': 'fr',
  'U[A-I]': 'ru',
  'U[J-M]': 'uz',
  'U[N-Q]': 'kz',
  'U[R-Z]': 'ua',
  V2: 'ag',
  V3: 'bz',
  V4: 'kn',
  V5: 'na',
  V6: 'fm',
  V7: 'mh',
  V8: 'bn',
  VO: 'ca',
  VR: 'hk',
  VS: 'gb',
  VZ: 'au',
  'V[A-G]': 'ca',
  'V[H-N]': 'au',
  'V[P-Q]': 'gb',
  'V[T-W]': 'in',
  'V[X-Y]': 'ca',
  W: 'us',
  XP: 'dk',
  XS: 'cn',
  XT: 'bf',
  XU: 'kh',
  XV: 'vn',
  XW: 'la',
  XX: 'mo',
  'X[A-I]': 'mx',
  'X[J-O]': 'ca',
  'X[Q-R]': 'cl',
  'X[Y-Z]': 'mm',
  YA: 'af',
  YI: 'iq',
  YJ: 'vu',
  YK: 'sy',
  YL: 'lv',
  YM: 'tr',
  YN: 'ni',
  YS: 'sv',
  'Y[2-9]': 'de',
  'Y[B-H]': 'id',
  'Y[O-R]': 'ro',
  'Y[T-U]': 'rs',
  'Y[V-Y]': 've',
  Z2: 'zw',
  Z3: 'mk',
  Z8: 'ss',
  ZA: 'al',
  ZP: 'py',
  ZQ: 'gb',
  'Z[B-J]': 'gb',
  'Z[K-M]': 'nz',
  'Z[N-O]': 'gb',
  'Z[R-U]': 'za',
  'Z[V-Z]': 'br',
};

const CALLSIGN_REGEX =
  /((2[A-Z]{1,2}|[BFGIKMNRW][A-Z]{0,2}|3[A-CE-Z][A-Z]{0,1}|4[A-MO-Z][A-Z]{0,1}|[5-9OUX][A-Z][A-Z]{0,1})([0-9][0-9A-Z]{0,3}[A-Z])|([ACDLP][2-9A-Z][A-Z]{0,1}|E[2-7A-Z][A-Z]{0,1}|H[2-46-9A-Z][A-Z]{0,1}|[JTV][2-8A-Z][A-Z]{0,1}|S[2-35-9A-RT-Z][A-Z]{0,1}|Y[2-9A-Y][A-Z]{0,1}|Z[238A-Z][A-Z]{0,1})([0-9A-Z]{0,3}[A-Z]))/;

export class CallsignHelper {
  /**
   * Get country code for a given callsign
   */
  public static getCountryCodeForCallsign(callsign: string): string {
    callsign = callsign.toUpperCase();
    const knownPrefixes = Object.keys(prefixMap).sort((a, b) => b.length - a.length);

    for (const prefix of knownPrefixes) {
      // Convert prefix pattern to regex
      const regexStr = prefix.replace(/\[([A-Z])-([A-Z])\]/g, '[$1-$2]');
      const regex = new RegExp(`^${regexStr}`);

      if (regex.test(callsign)) {
        return prefixMap[prefix];
      }
    }
    return 'xx';
  }

  /**
   * Validate if a string is a valid callsign
   */
  public static isValidCallsign(callsign: string): boolean {
    return CALLSIGN_REGEX.test(callsign.toUpperCase());
  }

  /**
   * Extract base callsign by removing portable prefixes and suffixes
   * Examples:
   * - DL/HA5XB -> HA5XB
   * - HA5XB/P -> HA5XB
   * - DL/HA5XB/M -> HA5XB
   */
  public static extractBaseCallsign(callsign: string): string {
    let baseCall = callsign.toUpperCase();

    // Remove portable prefix (e.g., DL/HA5XB -> HA5XB)
    if (baseCall.includes('/')) {
      const parts = baseCall.split('/');

      // If there are multiple parts, find the main callsign
      // Usually the longest part or the one that matches callsign pattern best
      if (parts.length === 2) {
        // Simple case: PREFIX/CALL or CALL/SUFFIX
        const [first, second] = parts;

        // Check which part looks more like a base callsign
        // Base callsign usually has numbers and is longer
        if (this.looksLikeBaseCallsign(first) && this.looksLikeBaseCallsign(second)) {
          // Both look like callsigns, prefer the longer one
          baseCall = first.length >= second.length ? first : second;
        } else if (this.looksLikeBaseCallsign(first)) {
          baseCall = first;
        } else if (this.looksLikeBaseCallsign(second)) {
          baseCall = second;
        } else {
          // Neither looks perfect, use the longer one
          baseCall = first.length >= second.length ? first : second;
        }
      } else if (parts.length === 3) {
        // Case like DL/HA5XB/M - middle part is usually the base callsign
        baseCall = parts[1];
      } else if (parts.length > 3) {
        // Complex case, find the part that looks most like a base callsign
        baseCall = parts.reduce((best, current) =>
          this.looksLikeBaseCallsign(current) && current.length > best.length ? current : best
        );
      }
    }

    return baseCall;
  }

  /**
   * Check if a string looks like a base callsign
   * Base callsigns typically contain at least one digit and are 3+ characters
   */
  public static looksLikeBaseCallsign(call: string): boolean {
    return call.length >= 3 && /\d/.test(call) && /[A-Z]/.test(call);
  }

  /**
   * Get flag URL for callsign, handling portable prefixes
   * For portable operations (e.g., DL/HA5XB), creates a composite flag
   * @param callsign - The callsign to get flag for
   * @returns Promise that resolves to flag URL or composite flag data URL
   */
  public static async getFlagUrl(callsign: string): Promise<string> {
    const upperCallsign = callsign.toUpperCase();
    let flagUrl = '';

    // Check if it's a portable operation
    if (upperCallsign.includes('/')) {
      const parts = upperCallsign.split('/');

      if (parts.length === 2) {
        const [first, second] = parts;

        // Determine which is prefix and which is base callsign
        let prefixCountry = '';
        let baseCountry = '';

        // Check if either part is a portable suffix (P, M, MM, AM)
        const isFirstPortableSuffix = ['P', 'M', 'MM', 'AM'].includes(first);
        const isSecondPortableSuffix = ['P', 'M', 'MM', 'AM'].includes(second);

        if (this.looksLikeBaseCallsign(first) && this.looksLikeBaseCallsign(second)) {
          // Both look like callsigns, treat first as prefix
          prefixCountry = this.getCountryCodeForCallsign(first);
          baseCountry = this.getCountryCodeForCallsign(second);
        } else if (this.looksLikeBaseCallsign(second) && !isFirstPortableSuffix) {
          // Second is base callsign, first is prefix (not a portable suffix)
          prefixCountry = this.getCountryCodeForCallsign(first);
          baseCountry = this.getCountryCodeForCallsign(second);
        } else if (this.looksLikeBaseCallsign(first) && !isSecondPortableSuffix) {
          // First is base callsign, second is prefix (not a portable suffix)
          baseCountry = this.getCountryCodeForCallsign(first);
          prefixCountry = this.getCountryCodeForCallsign(second);
        }

        // Only create composite flag if we have two different countries AND neither is a portable suffix
        if (
          prefixCountry &&
          baseCountry &&
          prefixCountry !== baseCountry &&
          prefixCountry !== 'xx' &&
          baseCountry !== 'xx' &&
          !isFirstPortableSuffix &&
          !isSecondPortableSuffix
        ) {
          flagUrl = await this.createCompositeFlagUrl(prefixCountry, baseCountry);
        }
      } else if (parts.length === 3) {
        // Handle three-part callsigns like MM/HA5XB/MM
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [first, middle, third] = parts;

        // Middle part is usually the base callsign
        if (this.looksLikeBaseCallsign(middle)) {
          const baseCountry = this.getCountryCodeForCallsign(middle);

          // Check if first part gives a valid country code (could be prefix like MM for UK)
          const firstCountry = this.getCountryCodeForCallsign(first);

          // Create composite flag if first part is a valid country different from base
          if (firstCountry !== 'xx' && firstCountry !== baseCountry && baseCountry !== 'xx') {
            flagUrl = await this.createCompositeFlagUrl(firstCountry, baseCountry);
          }
        }
      }
    }

    // If no composite flag was created, use regular single country flag
    if (!flagUrl) {
      const countryCode = this.getCountryCodeForCallsign(upperCallsign);
      flagUrl = countryCode !== 'xx' ? `https://flagcdn.com/h80/${countryCode}.png` : '';
    }

    // Check for portable suffixes and add icon if needed
    const portableSuffix = this.getPortableSuffix(upperCallsign);
    if (portableSuffix && flagUrl) {
      return await this.addPortableIcon(flagUrl, portableSuffix);
    }

    return flagUrl;
  }

  /**
   * Get portable suffix from callsign
   * @param callsign - The callsign to check
   * @returns Portable suffix or null
   */
  public static getPortableSuffix(callsign: string): string | null {
    const upperCallsign = callsign.toUpperCase();

    if (upperCallsign.includes('/')) {
      const parts = upperCallsign.split('/');

      // Check all parts for portable suffixes, prioritize the last one
      for (let i = parts.length - 1; i >= 0; i--) {
        if (['P', 'M', 'MM', 'AM'].includes(parts[i])) {
          return parts[i];
        }
      }
    }

    return null;
  }

  /**
   * Add portable icon to flag
   * @param flagUrl - The base flag URL or data URL
   * @param suffix - The portable suffix (P, M, MM, AM)
   * @param isComposite - Whether the flag is already a composite
   * @returns Promise that resolves to data URL with portable icon
   */
  private static async addPortableIcon(flagUrl: string, suffix: string): Promise<string> {
    return new Promise<string>(resolve => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(flagUrl);
        return;
      }

      canvas.width = 80;
      canvas.height = 60;

      const flagImg = new Image();
      flagImg.crossOrigin = 'anonymous';

      flagImg.onload = () => {
        // Draw the base flag
        ctx.drawImage(flagImg, 0, 0, canvas.width, canvas.height);

        // Get the appropriate icon URL
        const iconUrl = this.getPortableIconUrl(suffix);
        if (!iconUrl) {
          resolve(canvas.toDataURL());
          return;
        }

        // Load and draw the icon
        const iconImg = new Image();
        iconImg.crossOrigin = 'anonymous';

        iconImg.onload = () => {
          // Draw portable icon in bottom-right corner
          const iconSize = 20;
          const iconX = canvas.width - iconSize - 2;
          const iconY = canvas.height - iconSize - 2;

          // Draw background circle for icon
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2 + 1, 0, 2 * Math.PI);
          ctx.fill();

          // Draw border
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Draw the icon
          ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);

          resolve(canvas.toDataURL());
        };

        iconImg.onerror = () => {
          // Fallback to original flag if icon fails to load
          resolve(canvas.toDataURL());
        };

        iconImg.src = iconUrl;
      };

      flagImg.onerror = () => resolve(flagUrl);
      flagImg.src = flagUrl;
    });
  }

  /**
   * Get the appropriate icon URL for portable suffix
   * @param suffix - The portable suffix (P, M, MM, AM)
   * @returns Icon URL or null
   */
  private static getPortableIconUrl(suffix: string): string | null {
    const iconUrls = {
      P: 'https://img.icons8.com/?size=100&id=25055&format=png&color=000000', // Portable - walking person
      M: 'https://img.icons8.com/?size=100&id=1548&format=png&color=000000', // Mobile - handheld radio
      MM: 'https://img.icons8.com/?size=100&id=17856&format=png&color=000000', // Maritime Mobile - ship
      AM: 'https://img.icons8.com/?size=100&id=2487&format=png&color=000000', // Aeronautical Mobile - airplane
    };

    return iconUrls[suffix] || null;
  }

  /**
   * Get the meaning of portable suffix
   * @param suffix - The portable suffix (P, M, MM, AM)
   * @returns Human readable meaning or null
   */
  public static getPortableSuffixMeaning(suffix: string): string | null {
    const meanings = {
      P: 'Portable',
      M: 'Mobile',
      MM: 'Maritime Mobile',
      AM: 'Aeronautical Mobile',
    };

    return meanings[suffix] || null;
  }

  /**
   * Create a composite flag from two country codes
   * The composite is divided diagonally from bottom-left to top-right
   * @param prefixCountry - Country code for the prefix
   * @param baseCountry - Country code for the base callsign
   * @returns Promise that resolves to data URL for the composite flag
   */
  private static async createCompositeFlagUrl(
    prefixCountry: string,
    baseCountry: string
  ): Promise<string> {
    return new Promise<string>(resolve => {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(`https://flagcdn.com/h80/${baseCountry}.png`);
        return;
      }

      canvas.width = 80;
      canvas.height = 60;

      // Create image elements for both flags
      const prefixImg = new Image();
      const baseImg = new Image();

      // Set CORS to allow loading external images
      prefixImg.crossOrigin = 'anonymous';
      baseImg.crossOrigin = 'anonymous';

      let loadedCount = 0;

      const onImageLoad = () => {
        loadedCount++;
        if (loadedCount === 2) {
          // Both images loaded, create composite
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw base country flag (top-left triangle)
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(0, 0); // top-left
          ctx.lineTo(canvas.width, 0); // top-right
          ctx.lineTo(0, canvas.height); // bottom-left
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
          ctx.restore();

          // Draw prefix country flag (bottom-right triangle)
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(canvas.width, 0); // top-right
          ctx.lineTo(canvas.width, canvas.height); // bottom-right
          ctx.lineTo(0, canvas.height); // bottom-left
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(prefixImg, 0, 0, canvas.width, canvas.height);
          ctx.restore();

          // Add a diagonal line to separate the flags
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(canvas.width, 0);
          ctx.lineTo(canvas.width, canvas.height);
          ctx.stroke();

          resolve(canvas.toDataURL());
        }
      };

      // Handle errors - fallback to base country flag
      const onError = () => resolve(`https://flagcdn.com/h80/${baseCountry}.png`);

      prefixImg.onload = onImageLoad;
      baseImg.onload = onImageLoad;
      prefixImg.onerror = onError;
      baseImg.onerror = onError;

      prefixImg.src = `https://flagcdn.com/h80/${prefixCountry}.png`;
      baseImg.src = `https://flagcdn.com/h80/${baseCountry}.png`;
    });
  }
}

// Backward compatibility - export the original function
export function getCountryCodeForCallsign(callsign: string): string {
  return CallsignHelper.getCountryCodeForCallsign(callsign);
}
