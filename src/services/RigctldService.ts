import { RigctldConnection, RigctldResponse } from '../types/rig';
import '../types/electron';

export class RigctldService {
  private connection: RigctldConnection = {
    host: 'localhost',
    port: 4532,
    connected: false,
  };

  constructor() {}

  public setConnection(host: string, port: number, model?: number, device?: string): void {
    this.connection = {
      host,
      port,
      connected: false,
      model,
      device,
    };
  }

  public getConnection(): RigctldConnection {
    return { ...this.connection };
  }

  public async connect(): Promise<RigctldResponse> {
    try {
      const response = await window.electronAPI.rigctldConnect(
        this.connection.host,
        this.connection.port,
        this.connection.model,
        this.connection.device
      );

      if (response.success) {
        this.connection.connected = true;
      }
##AI! Type '{ success: boolean; data?: RigConnectionData | undefined; error?: string | undefined; }' is not assignable to type 'RigctldResponse'.
Types of property 'data' are incompatible.
  Type 'RigConnectionData | undefined' is not assignable to type 'string | string[] | null | undefined'.
    Type 'RigConnectionData' is not assignable to type 'string | string[] | null | undefined'.ts(2322)
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async disconnect(): Promise<RigctldResponse> {
    try {
      const response = await window.electronAPI.rigctldDisconnect();

      if (response.success) {
        this.connection.connected = false;
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async getCapabilities(): Promise<RigctldResponse> {
    try {
      return await window.electronAPI.rigctldGetCapabilities();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async getFrequency(): Promise<RigctldResponse> {
    try {
      console.log('RIG GET: f (get frequency)');
      const response = await window.electronAPI.rigctldCommand('f');
      console.log('RIG GET RESPONSE:', response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async setFrequency(frequency: number): Promise<RigctldResponse> {
    try {
      const command = `F ${frequency}`;
      console.log('RIG SET:', command);
      const response = await window.electronAPI.rigctldCommand(command);
      console.log('RIG SET RESPONSE:', response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async getMode(): Promise<RigctldResponse> {
    try {
      console.log('RIG GET: m (get mode)');
      const response = await window.electronAPI.rigctldCommand('m');
      console.log('RIG GET RESPONSE:', response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async setMode(mode: string, passband: number = 0): Promise<RigctldResponse> {
    try {
      const command = `M ${mode} ${passband}`;
      console.log('RIG SET:', command);
      const response = await window.electronAPI.rigctldCommand(command);
      console.log('RIG SET RESPONSE:', response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async getVfo(): Promise<RigctldResponse> {
    try {
      console.log('RIG GET: v (get VFO)');
      const response = await window.electronAPI.rigctldCommand('v');
      console.log('RIG GET RESPONSE:', response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async setVfo(vfo: string): Promise<RigctldResponse> {
    try {
      const command = `V ${vfo}`;
      console.log('RIG SET:', command);
      const response = await window.electronAPI.rigctldCommand(command);
      console.log('RIG SET RESPONSE:', response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async getPtt(): Promise<RigctldResponse> {
    try {
      console.log('RIG GET: t (get PTT)');
      const response = await window.electronAPI.rigctldCommand('t');
      console.log('RIG GET RESPONSE:', response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async setPtt(ptt: boolean): Promise<RigctldResponse> {
    try {
      const command = `T ${ptt ? '1' : '0'}`;
      console.log('RIG SET:', command);
      const response = await window.electronAPI.rigctldCommand(command);
      console.log('RIG SET RESPONSE:', response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async getSplit(): Promise<RigctldResponse> {
    try {
      console.log('RIG GET: s (get split)');
      const response = await window.electronAPI.rigctldCommand('s');
      console.log('RIG GET RESPONSE:', response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async setSplit(split: boolean, txVfo: string = 'VFOB'): Promise<RigctldResponse> {
    try {
      const command = `S ${split ? '1' : '0'} ${txVfo}`;
      console.log('RIG SET:', command);
      const response = await window.electronAPI.rigctldCommand(command);
      console.log('RIG SET RESPONSE:', response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async getSplitFrequency(): Promise<RigctldResponse> {
    try {
      console.log('RIG GET: i (get split frequency)');
      const response = await window.electronAPI.rigctldCommand('i');
      console.log('RIG GET RESPONSE:', response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async setSplitFrequency(frequency: number): Promise<RigctldResponse> {
    try {
      const command = `I ${frequency}`;
      console.log('RIG SET:', command);
      const response = await window.electronAPI.rigctldCommand(command);
      console.log('RIG SET RESPONSE:', response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async getRit(): Promise<RigctldResponse> {
    try {
      console.log('RIG GET: j (get RIT)');
      const response = await window.electronAPI.rigctldCommand('j');
      console.log('RIG GET RESPONSE:', response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async setRit(rit: number): Promise<RigctldResponse> {
    try {
      const command = `J ${rit}`;
      console.log('RIG SET:', command);
      const response = await window.electronAPI.rigctldCommand(command);
      console.log('RIG SET RESPONSE:', response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async getXit(): Promise<RigctldResponse> {
    try {
      console.log('RIG GET: z (get XIT)');
      const response = await window.electronAPI.rigctldCommand('z');
      console.log('RIG GET RESPONSE:', response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async setXit(xit: number): Promise<RigctldResponse> {
    try {
      const command = `Z ${xit}`;
      console.log('RIG SET:', command);
      const response = await window.electronAPI.rigctldCommand(command);
      console.log('RIG SET RESPONSE:', response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async sendCommand(command: string): Promise<RigctldResponse> {
    try {
      console.log('RIG COMMAND:', command);
      const response = await window.electronAPI.rigctldCommand(command);
      console.log('RIG COMMAND RESPONSE:', response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const rigctldService = new RigctldService();
