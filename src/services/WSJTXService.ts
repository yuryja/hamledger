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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      
      console.log(`Parsing decode message, buffer length: ${buffer.length}, starting offset: ${offset}`);
      
      // Parse fields according to WSJT-X protocol
      const id = this.readQString(buffer, offset);
      offset += 4 + id.length * 2; // QString is UTF-16
      
      // Check bounds for remaining fields
      if (offset + 1 > buffer.length) {
        throw new Error(`Buffer too small to read isNew at offset ${offset}`);
      }
      const isNew = buffer.readUInt8(offset) !== 0;
      offset += 1;
      
      if (offset + 4 > buffer.length) {
        throw new Error(`Buffer too small to read timeMs at offset ${offset}`);
      }
      const timeMs = buffer.readUInt32BE(offset);
      offset += 4;
      
      if (offset + 4 > buffer.length) {
        throw new Error(`Buffer too small to read snr at offset ${offset}`);
      }
      const snr = buffer.readInt32BE(offset);
      offset += 4;
      
      if (offset + 4 > buffer.length) {
        throw new Error(`Buffer too small to read dt at offset ${offset}`);
      }
      const dt = buffer.readFloatBE(offset);
      offset += 4;
      
      if (offset + 4 > buffer.length) {
        throw new Error(`Buffer too small to read df at offset ${offset}`);
      }
      const df = buffer.readUInt32BE(offset);
      offset += 4;
      
      const mode = this.readQString(buffer, offset);
      offset += 4 + mode.length * 2;
      
      const message = this.readQString(buffer, offset);
      offset += 4 + message.length * 2;
      
      if (offset + 1 > buffer.length) {
        throw new Error(`Buffer too small to read lowConfidence at offset ${offset}`);
      }
      const lowConfidence = buffer.readUInt8(offset) !== 0;
      offset += 1;
      
      if (offset + 1 > buffer.length) {
        throw new Error(`Buffer too small to read offAir at offset ${offset}`);
      }
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
      console.error('Buffer hex dump:', buffer.toString('hex'));
      return null;
    }
  }

  private parseLoggedQSO(buffer: Buffer): WSJTXLoggedQSO | null {
    try {
      let offset = 12; // Skip magic, schema, and message type
      
      console.log(`Parsing logged QSO, buffer length: ${buffer.length}, starting offset: ${offset}`);
      
      const id = this.readQString(buffer, offset);
      offset += 4 + id.length * 2;
      console.log(`Read id: "${id}", new offset: ${offset}`);
      
      const dateTimeOff = this.readQDateTime(buffer, offset);
      offset += 8;
      console.log(`Read dateTimeOff: ${dateTimeOff}, new offset: ${offset}`);
      
      const dxCall = this.readQString(buffer, offset);
      offset += 4 + dxCall.length * 2;
      console.log(`Read dxCall: "${dxCall}", new offset: ${offset}`);
      
      const dxGrid = this.readQString(buffer, offset);
      offset += 4 + dxGrid.length * 2;
      console.log(`Read dxGrid: "${dxGrid}", new offset: ${offset}`);
      
      // Check if we have enough bytes for frequency
      if (offset + 8 > buffer.length) {
        throw new Error(`Buffer too small to read frequency at offset ${offset}`);
      }
      const txFrequency = buffer.readBigUInt64BE(offset);
      offset += 8;
      console.log(`Read txFrequency: ${txFrequency}, new offset: ${offset}`);
      
      const mode = this.readQString(buffer, offset);
      offset += 4 + mode.length * 2;
      console.log(`Read mode: "${mode}", new offset: ${offset}`);
      
      const reportSent = this.readQString(buffer, offset);
      offset += 4 + reportSent.length * 2;
      console.log(`Read reportSent: "${reportSent}", new offset: ${offset}`);
      
      const reportReceived = this.readQString(buffer, offset);
      offset += 4 + reportReceived.length * 2;
      console.log(`Read reportReceived: "${reportReceived}", new offset: ${offset}`);
      
      const txPower = this.readQString(buffer, offset);
      offset += 4 + txPower.length * 2;
      console.log(`Read txPower: "${txPower}", new offset: ${offset}`);
      
      const comments = this.readQString(buffer, offset);
      offset += 4 + comments.length * 2;
      console.log(`Read comments: "${comments}", new offset: ${offset}`);
      
      const name = this.readQString(buffer, offset);
      offset += 4 + name.length * 2;
      console.log(`Read name: "${name}", new offset: ${offset}`);
      
      const dateTimeOn = this.readQDateTime(buffer, offset);
      offset += 8;
      console.log(`Read dateTimeOn: ${dateTimeOn}, new offset: ${offset}`);
      
      const operatorCall = this.readQString(buffer, offset);
      offset += 4 + operatorCall.length * 2;
      console.log(`Read operatorCall: "${operatorCall}", new offset: ${offset}`);
      
      const myCall = this.readQString(buffer, offset);
      offset += 4 + myCall.length * 2;
      console.log(`Read myCall: "${myCall}", new offset: ${offset}`);
      
      const myGrid = this.readQString(buffer, offset);
      offset += 4 + myGrid.length * 2;
      console.log(`Read myGrid: "${myGrid}", new offset: ${offset}`);
      
      const exchangeSent = this.readQString(buffer, offset);
      offset += 4 + exchangeSent.length * 2;
      console.log(`Read exchangeSent: "${exchangeSent}", new offset: ${offset}`);
      
      const exchangeReceived = this.readQString(buffer, offset);
      console.log(`Read exchangeReceived: "${exchangeReceived}"`);
      
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
      console.error('Buffer hex dump:', buffer.toString('hex'));
      return null;
    }
  }

  private readQString(buffer: Buffer, offset: number): string {
    // Check if we have enough bytes to read the length
    if (offset + 4 > buffer.length) {
      throw new Error(`Buffer too small to read string length at offset ${offset}`);
    }
    
    const length = buffer.readUInt32BE(offset);
    if (length === 0xFFFFFFFF) return ''; // Null string
    
    // Check if we have enough bytes to read the string data
    const stringDataEnd = offset + 4 + length * 2;
    if (stringDataEnd > buffer.length) {
      throw new Error(`Buffer too small to read string data at offset ${offset}, need ${stringDataEnd} bytes but have ${buffer.length}`);
    }
    
    const stringBuffer = buffer.subarray(offset + 4, stringDataEnd);
    return stringBuffer.toString('utf16le');
  }

  private readQDateTime(buffer: Buffer, offset: number): Date {
    // Check if we have enough bytes to read the datetime
    if (offset + 8 > buffer.length) {
      throw new Error(`Buffer too small to read datetime at offset ${offset}`);
    }
    
    // Qt QDateTime is stored as milliseconds since epoch
    const msecs = buffer.readBigUInt64BE(offset);
    return new Date(Number(msecs));
  }
}

export const wsjtxService = new WSJTXService();
