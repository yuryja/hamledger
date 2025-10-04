export interface WSJTXDecodeMessage {
  id: string;
  isNew: boolean;
  timeMs: number;
  snr: number;
  dt: number;
  df: number;
  mode: string;
  message: string;
  lowConfidence: boolean;
  offAir: boolean;
}

export interface WSJTXLoggedQSO {
  id: string;
  dateTimeOff: Date;
  dxCall: string;
  dxGrid: string;
  txFrequency: number;
  mode: string;
  reportSent: string;
  reportReceived: string;
  txPower: string;
  comments: string;
  name: string;
  dateTimeOn: Date;
  operatorCall: string;
  myCall: string;
  myGrid: string;
  exchangeSent: string;
  exchangeReceived: string;
}

export interface WSJTXSettings {
  enabled: boolean;
  port: number;
  autoLog: boolean;
  logOnlyConfirmed: boolean;
}
