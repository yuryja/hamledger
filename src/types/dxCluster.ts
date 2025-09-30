export interface MagnifierPosition {
  x: number;
  y: number;
}

export interface ScaleTick {
  frequency: number;
  position: number;
  label?: string;
}

export interface DxSpot {
  Nr: number;
  Spotter: string;
  Spotters: string[]; // Array of all spotters for this callsign/frequency
  Frequency: string;
  DXCall: string;
  Time: string;
  Date: string;
  Beacon: boolean;
  MM: boolean;
  AM: boolean;
  Valid: boolean;
  EQSL?: boolean;
  LOTW?: boolean;
  LOTW_Date?: string;
  DXHomecall: string;
  Comment: string;
  Flag: string;
  Band: number;
  Mode: string;
  Continent_dx: string;
  Continent_spotter: string;
  DXLocator?: string;
}

export interface DxClusterFilters {
  selectedCdx: string[];
  selectedCde: string[];
  selectedBand: string;
  selectedModes: string[];
  validatedOnly: boolean;
  pageLength: number;
}

export interface LayoutSpot extends DxSpot {
  position: number;
  leftOffset: number;
  column: number;
  customOpacity: number;
  worked: boolean;
}
