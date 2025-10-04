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
      
      // Parse fields according to WSJT-X protocol v2.6.x Type 2
      const { value: id, newOffset: idOffset } = this.readQStringWithOffset(buffer, offset);
      offset = idOffset;
      
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
      
      if (offset + 8 > buffer.length) {
        throw new Error(`Buffer too small to read dt at offset ${offset}`);
      }
      const dt = buffer.readDoubleBE(offset); // dt is double, not float
      offset += 8;
      
      if (offset + 4 > buffer.length) {
        throw new Error(`Buffer too small to read df at offset ${offset}`);
      }
      const df = buffer.readUInt32BE(offset);
      offset += 4;
      
      const { value: mode, newOffset: modeOffset } = this.readQStringWithOffset(buffer, offset);
      offset = modeOffset;
      
      const { value: message, newOffset: messageOffset } = this.readQStringWithOffset(buffer, offset);
      offset = messageOffset;
      
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
      console.log('Buffer hex dump:', buffer.toString('hex'));
      
      // Parse according to WSJT-X protocol v2.6.x Type 5
      // Type 5: QSO Logged contains: id (string) + adif (string)
      const { value: id, newOffset: idOffset } = this.readQStringWithOffset(buffer, offset);
      offset = idOffset;
      console.log(`Read id: "${id}", new offset: ${offset}`);
      
      const { value: adif, newOffset: adifOffset } = this.readQStringWithOffset(buffer, offset);
      offset = adifOffset;
      console.log(`Read ADIF: "${adif}", new offset: ${offset}`);
      
      // Parse ADIF string to extract structured data
      const parsedAdif = this.parseAdifString(adif);
      console.log('Parsed ADIF fields:', parsedAdif);
      
      return {
        id,
        dateTimeOff: parsedAdif.qso_date_off ? new Date(parsedAdif.qso_date_off + 'T' + (parsedAdif.time_off || '00:00:00') + 'Z') : new Date(),
        dxCall: parsedAdif.call || '',
        dxGrid: parsedAdif.gridsquare || '',
        txFrequency: parsedAdif.freq ? Math.round(parseFloat(parsedAdif.freq) * 1000000) : 0, // Convert MHz to Hz
        mode: parsedAdif.mode || '',
        reportSent: parsedAdif.rst_sent || '',
        reportReceived: parsedAdif.rst_rcvd || '',
        txPower: parsedAdif.tx_pwr || '',
        comments: parsedAdif.comment || '',
        name: parsedAdif.name || '',
        dateTimeOn: parsedAdif.qso_date ? new Date(parsedAdif.qso_date + 'T' + (parsedAdif.time_on || '00:00:00') + 'Z') : new Date(),
        operatorCall: parsedAdif.operator || '',
        myCall: parsedAdif.station_callsign || '',
        myGrid: parsedAdif.my_gridsquare || '',
        exchangeSent: parsedAdif.stx_string || '',
        exchangeReceived: parsedAdif.srx_string || '',
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
    
    // For empty strings, length is 0
    if (length === 0) return '';
    
    // Check if we have enough bytes to read the string data
    // WSJT-X uses UTF-16BE encoding, so each character is 2 bytes
    const stringDataEnd = offset + 4 + length;
    if (stringDataEnd > buffer.length) {
      throw new Error(`Buffer too small to read string data at offset ${offset}, need ${stringDataEnd} bytes but have ${buffer.length}`);
    }
    
    const stringBuffer = buffer.subarray(offset + 4, stringDataEnd);
    return stringBuffer.toString('utf8'); // Try UTF-8 first
  }

  private readQStringWithOffset(buffer: Buffer, offset: number): { value: string; newOffset: number } {
    // Check if we have enough bytes to read the length
    if (offset + 4 > buffer.length) {
      throw new Error(`Buffer too small to read string length at offset ${offset}`);
    }
    
    const length = buffer.readUInt32BE(offset);
    if (length === 0xFFFFFFFF) {
      return { value: '', newOffset: offset + 4 }; // Null string
    }
    
    // For empty strings, length is 0
    if (length === 0) {
      return { value: '', newOffset: offset + 4 };
    }
    
    // Check if we have enough bytes to read the string data
    const stringDataEnd = offset + 4 + length;
    if (stringDataEnd > buffer.length) {
      throw new Error(`Buffer too small to read string data at offset ${offset}, need ${stringDataEnd} bytes but have ${buffer.length}`);
    }
    
    const stringBuffer = buffer.subarray(offset + 4, stringDataEnd);
    const value = stringBuffer.toString('utf8');
    
    return { value, newOffset: stringDataEnd };
  }

  private getQStringSize(buffer: Buffer, offset: number): number {
    if (offset + 4 > buffer.length) {
      return 4; // Just the length field
    }
    
    const length = buffer.readUInt32BE(offset);
    if (length === 0xFFFFFFFF || length === 0) {
      return 4; // Just the length field for null or empty strings
    }
    
    return 4 + length; // Length field + string data
  }

  private parseAdifString(adifString: string): Record<string, string> {
    const fields: Record<string, string> = {};
    
    // ADIF field regex: <FIELD_NAME:LENGTH:TYPE>VALUE
    const regex = /<([^:>]+)(?::(\d+)(?::([^>]+))?)?>([^<]*)/gi;
    let match;
    
    while ((match = regex.exec(adifString)) !== null) {
      const [, fieldName, length, , value] = match;
      const normalizedFieldName = fieldName.toLowerCase();
      
      // Skip EOR (End of Record) markers
      if (normalizedFieldName === 'eor') {
        continue;
      }
      
      fields[normalizedFieldName] = value.trim();
    }
    
    return fields;
  }

  private readQDateTime(buffer: Buffer, offset: number): Date {
    // Check if we have enough bytes to read the datetime
    if (offset + 8 > buffer.length) {
      throw new Error(`Buffer too small to read datetime at offset ${offset}`);
    }
    
    // Qt QDateTime is stored as milliseconds since epoch (UTC)
    // But WSJT-X might use a different epoch or format
    const msecs = buffer.readBigUInt64BE(offset);
    
    // Handle special values
    if (msecs === 0n || msecs === 0xFFFFFFFFFFFFFFFFn) {
      return new Date(); // Return current time for invalid dates
    }
    
    // Qt uses milliseconds since 1970-01-01T00:00:00 UTC
    const date = new Date(Number(msecs));
    
    // Check if the date is reasonable (between 1990 and 2050)
    if (date.getFullYear() < 1990 || date.getFullYear() > 2050) {
      console.warn(`Suspicious date parsed: ${date}, raw value: ${msecs}`);
      return new Date(); // Return current time for suspicious dates
    }
    
    return date;
  }
}

export const wsjtxService = new WSJTXService();
