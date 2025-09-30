export interface BandRange {
  name: string;
  min: number;
  max: number;
}

export const BAND_RANGES: BandRange[] = [
  { name: '10m', min: 28.0, max: 29.7 },
  { name: '20m', min: 14.0, max: 14.35 },
  { name: '40m', min: 7.0, max: 7.3 },
];

export function getBandFromFrequency(freq: number): string {
  const band = BAND_RANGES.find(band => freq >= band.min && freq <= band.max);
  return band ? band.name : '';
}
