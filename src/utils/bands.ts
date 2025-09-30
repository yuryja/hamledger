export interface BandRange {
  name: string;
  shortName: string;
  min: number; // kHz
  max: number; // kHz
  region1: { min: number; max: number }; // IARU Region 1 (Europe, Africa, Middle East, Northern Asia)
  region2: { min: number; max: number }; // IARU Region 2 (Americas)
  region3: { min: number; max: number }; // IARU Region 3 (Asia-Pacific)
}

// IARU band definitions with regional variations
export const BAND_RANGES: BandRange[] = [
  {
    name: '160m',
    shortName: '160',
    min: 1800,
    max: 2000,
    region1: { min: 1810, max: 2000 },
    region2: { min: 1800, max: 2000 },
    region3: { min: 1800, max: 2000 },
  },
  {
    name: '80m',
    shortName: '80',
    min: 3500,
    max: 4000,
    region1: { min: 3500, max: 3800 },
    region2: { min: 3500, max: 4000 },
    region3: { min: 3500, max: 3900 },
  },
  {
    name: '40m',
    shortName: '40',
    min: 7000,
    max: 7300,
    region1: { min: 7000, max: 7200 },
    region2: { min: 7000, max: 7300 },
    region3: { min: 7000, max: 7300 },
  },
  {
    name: '20m',
    shortName: '20',
    min: 14000,
    max: 14350,
    region1: { min: 14000, max: 14350 },
    region2: { min: 14000, max: 14350 },
    region3: { min: 14000, max: 14350 },
  },
  {
    name: '30m',
    shortName: '30',
    min: 10100,
    max: 10150,
    region1: { min: 10100, max: 10150 },
    region2: { min: 10100, max: 10150 },
    region3: { min: 10100, max: 10150 },
  },
  {
    name: '17m',
    shortName: '17',
    min: 18068,
    max: 18168,
    region1: { min: 18068, max: 18168 },
    region2: { min: 18068, max: 18168 },
    region3: { min: 18068, max: 18168 },
  },
  {
    name: '15m',
    shortName: '15',
    min: 21000,
    max: 21450,
    region1: { min: 21000, max: 21450 },
    region2: { min: 21000, max: 21450 },
    region3: { min: 21000, max: 21450 },
  },
  {
    name: '12m',
    shortName: '12',
    min: 24890,
    max: 24990,
    region1: { min: 24890, max: 24990 },
    region2: { min: 24890, max: 24990 },
    region3: { min: 24890, max: 24990 },
  },
  {
    name: '10m',
    shortName: '10',
    min: 28000,
    max: 29700,
    region1: { min: 28000, max: 29700 },
    region2: { min: 28000, max: 29700 },
    region3: { min: 28000, max: 29700 },
  },
];

export type IARURegion = 'region1' | 'region2' | 'region3';

export function getBandFromFrequency(freq: number): BandRange | null {
  return BAND_RANGES.find(band => freq >= band.min && freq <= band.max) || null;
}

export function getBandByShortName(shortName: string): BandRange | null {
  return BAND_RANGES.find(band => band.shortName === shortName) || null;
}

export function getRegionalBandRange(shortName: string, region?: IARURegion): { min: number; max: number } | null {
  const band = getBandByShortName(shortName);
  if (!band) return null;
  
  // Use provided region or try to get from config, fallback to region1
  const targetRegion = region || getConfiguredRegion();
  return band[targetRegion];
}

export function getConfiguredRegion(): IARURegion {
  try {
    // Import configHelper dynamically to avoid circular dependencies
    const { configHelper } = require('./configHelper');
    return configHelper.getIARURegion();
  } catch {
    // Fallback to region1 if configHelper is not available
    return 'region1';
  }
}

export function getAllBandShortNames(): string[] {
  return BAND_RANGES.map(band => band.shortName);
}

export function getBandFrequencyRange(shortName: string): { min: number; max: number } | null {
  const band = getBandByShortName(shortName);
  return band ? { min: band.min, max: band.max } : null;
}
