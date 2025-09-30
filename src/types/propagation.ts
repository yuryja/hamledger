export interface WWVData {
  id: number;
  station: string;
  time: string;
  a: number;
  k: number;
  sfi: number;
  r: number;
  expk: number;
  aurora: boolean;
}

export interface PropagationData {
  sfi: number;
  aIndex: number;
  kIndex: number;
  lastUpdated?: string;
  station?: string;
}
