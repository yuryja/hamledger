export interface MagnifierPosition {
  x: number;
  y: number;
}

export interface ScaleTick {
  frequency: number;
  position: number;
  label?: string;
}

export interface LayoutSpot extends import('../store/dxCluster').DxSpot {
  position: number;
  leftOffset: number;
  column: number;
  customOpacity: number;
  worked: boolean;
}
