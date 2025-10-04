import dgram from 'dgram';
import { EventEmitter } from 'events';
import { WSJTXDecodeMessage, WSJTXLoggedQSO } from '../types/wsjtx';

export class WSJTXService extends EventEmitter {
  private server: dgram.Socket | null = null;
  private port: number = 2237; // Default WSJT-X UDP port
  private isListening: boolean = false;

  constructor(port: number = 2237) {
    super();
    this.port = port;
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isListening) {
        resolve();
        return;
      }

      this.server = dgram.createSocket('udp4');

      this.server.on('error', (err) => {
        console.error('WSJT-X UDP server error:', err);
        this.emit('error', err);
        reject(err);
      });

      this.server.on('message', (msg, rinfo) => {
        try {
          this.handleMessage(msg, rinfo);
        } catch (error) {
          console.error('Error handling WSJT-X message:', error);
        }
      });

      this.server.on('listening', () => {
        const address = this.server?.address();
        console.log(`WSJT-X UDP server listening on ${address?.address}:${address?.port}`);
        this.isListening = true;
        resolve();
      });

      this.server.bind(this.port);
    });
  }

  public stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
      this.isListening = false;
      console.log('WSJT-X UDP server stopped');
    }
  }

  public isRunning(): boolean {
    return this.isListening;
  }

  private handleMessage(buffer: Buffer, _rinfo: dgram.RemoteInfo): void {
    try {
      // WSJT-X uses a binary protocol, we need to parse it
      const messageType = this.parseMessageType(buffer);
      
      switch (messageType) {
        case 2: {// Decode message
          const decodeMessage = this.parseDecodeMessage(buffer);
          if (decodeMessage) {
            this.emit('decode', decodeMessage);
          }
          break;
        }
        case 5: {// Logged QSO message
          const loggedQSO = this.parseLoggedQSO(buffer);
          if (loggedQSO) {
            this.emit('qso', loggedQSO);
          }
          break;
        }
        default:
          // Ignore other message types for now
          break;
      }
    } catch (error) {
      console.error('Error parsing WSJT-X message:', error);
    }
  }

  private parseMessageType(buffer: Buffer): number {
    // WSJT-X messages start with magic number (0xADBCCBDA) followed by schema version and message type
    if (buffer.length < 12) return -1;
    
    const magic = buffer.readUInt32BE(0);
    if (magic !== 0xADBCCBDA) return -1;
    
    return buffer.readUInt32BE(8);
  }

  private parseDecodeMessage(buffer: Buffer): WSJTXDecodeMessage | null {
    try {
      let offset = 12; // Skip magic, schema, and message type
      
      // Parse fields according to WSJT-X protocol
      const id = this.readQString(buffer, offset);
      offset += 4 + id.length * 2; // QString is UTF-16
      
      const isNew = buffer.readUInt8(offset) !== 0;
      offset += 1;
      
      const timeMs = buffer.readUInt32BE(offset);
      offset += 4;
      
      const snr = buffer.readInt32BE(offset);
      offset += 4;
      
      const dt = buffer.readFloatBE(offset);
      offset += 4;
      
      const df = buffer.readUInt32BE(offset);
      offset += 4;
      
      const mode = this.readQString(buffer, offset);
      offset += 4 + mode.length * 2;
      
      const message = this.readQString(buffer, offset);
      offset += 4 + message.length * 2;
      
      const lowConfidence = buffer.readUInt8(offset) !== 0;
      offset += 1;
      
      const offAir = buffer.readUInt8(offset) !== 0;
      
      return {
        id,
        isNew,
        timeMs,
        snr,
        dt,
        df,
        mode,
        message,
        lowConfidence,
        offAir
      };
    } catch (error) {
      console.error('Error parsing decode message:', error);
      return null;
    }
  }

  private parseLoggedQSO(buffer: Buffer): WSJTXLoggedQSO | null {
    try {
      let offset = 12; // Skip magic, schema, and message type
      
      const id = this.readQString(buffer, offset);
      offset += 4 + id.length * 2;
      
      const dateTimeOff = this.readQDateTime(buffer, offset);
      offset += 8;
      
      const dxCall = this.readQString(buffer, offset);
      offset += 4 + dxCall.length * 2;
      
      const dxGrid = this.readQString(buffer, offset);
      offset += 4 + dxGrid.length * 2;
      
      const txFrequency = buffer.readBigUInt64BE(offset);
      offset += 8;
      
      const mode = this.readQString(buffer, offset);
      offset += 4 + mode.length * 2;
      
      const reportSent = this.readQString(buffer, offset);
      offset += 4 + reportSent.length * 2;
      
      const reportReceived = this.readQString(buffer, offset);
      offset += 4 + reportReceived.length * 2;
      
      const txPower = this.readQString(buffer, offset);
      offset += 4 + txPower.length * 2;
      
      const comments = this.readQString(buffer, offset);
      offset += 4 + comments.length * 2;
      
      const name = this.readQString(buffer, offset);
      offset += 4 + name.length * 2;
      
      const dateTimeOn = this.readQDateTime(buffer, offset);
      offset += 8;
      
      const operatorCall = this.readQString(buffer, offset);
      offset += 4 + operatorCall.length * 2;
      
      const myCall = this.readQString(buffer, offset);
      offset += 4 + myCall.length * 2;
      
      const myGrid = this.readQString(buffer, offset);
      offset += 4 + myGrid.length * 2;
      
      const exchangeSent = this.readQString(buffer, offset);
      offset += 4 + exchangeSent.length * 2;
      
      const exchangeReceived = this.readQString(buffer, offset);
      
      return {
        id,
        dateTimeOff,
        dxCall,
        dxGrid,
        txFrequency: Number(txFrequency),
        mode,
        reportSent,
        reportReceived,
        txPower,
        comments,
        name,
        dateTimeOn,
        operatorCall,
        myCall,
        myGrid,
        exchangeSent,
        exchangeReceived
      };
    } catch (error) {
      console.error('Error parsing logged QSO:', error);
      return null;
    }
  }

  private readQString(buffer: Buffer, offset: number): string {
    const length = buffer.readUInt32BE(offset);
    if (length === 0xFFFFFFFF) return ''; // Null string
    
    const stringBuffer = buffer.subarray(offset + 4, offset + 4 + length * 2);
    return stringBuffer.toString('utf16le');
  }

  private readQDateTime(buffer: Buffer, offset: number): Date {
    // Qt QDateTime is stored as milliseconds since epoch
    const msecs = buffer.readBigUInt64BE(offset);
    return new Date(Number(msecs));
  }
}

export const wsjtxService = new WSJTXService();
