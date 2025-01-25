export interface OnlineStationData {
  name: string;
  qth: string;
  country: string;
}

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

export interface QRZResponse {
  version: string;
  callsign: QRZData;
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
  qrzData?: QRZData;
  weather: string;
  localTime: string;
  greetings: {
    greeting: string;
    ipa: string;
    label: string;
  }[];
}
