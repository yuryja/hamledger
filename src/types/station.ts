export interface QRZData {
  call: string;
  aliases?: string;
  fname: string;
  name: string;
  nickname?: string;
  addr1?: string;
  addr2?: string;
  state?: string;
  zip?: string;
  country: string;
  lat?: number;
  lon?: number;
  grid?: string;
  county?: string;
  class?: string;
  email?: string;
  url?: string;
  image?: string;
  timezone?: string;
  gmtOffset?: number;
  dxcc?: string;
  born?: string;
  qth: string;
}

export interface QRZSessionResponse {
  version: string;
  callsign: string;
  session: {
    key: string;
    count: number;
    subExp: string;
    gmTime: string;
  };
}

export interface StationData {
  flag: string;
  country: string;
  callsign: string;
  qrzData?: QRZData;
  weather: string;
  localTime: string;
  geodata?: {
    lat: number;
    lon: number;
    display_name?: string;
  };
  greetings: {
    greeting: string;
    ipa: string;
    label: string;
  }[];
}

export interface GeoData {
  lat: number;
  lon: number;
  display_name?: string;
}
