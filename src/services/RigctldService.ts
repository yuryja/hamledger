import { RigCapabilities, RigState, RigctldConnection, RigctldResponse } from '../types/rig';

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
      return await window.electronAPI.rigctldCommand('f');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async setFrequency(frequency: number): Promise<RigctldResponse> {
    try {
      return await window.electronAPI.rigctldCommand(`F ${frequency}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async getMode(): Promise<RigctldResponse> {
    try {
      return await window.electronAPI.rigctldCommand('m');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async setMode(mode: string, passband: number = 0): Promise<RigctldResponse> {
    try {
      return await window.electronAPI.rigctldCommand(`M ${mode} ${passband}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async getVfo(): Promise<RigctldResponse> {
    try {
      return await window.electronAPI.rigctldCommand('v');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async setVfo(vfo: string): Promise<RigctldResponse> {
    try {
      return await window.electronAPI.rigctldCommand(`V ${vfo}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async getPtt(): Promise<RigctldResponse> {
    try {
      return await window.electronAPI.rigctldCommand('t');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async setPtt(ptt: boolean): Promise<RigctldResponse> {
    try {
      return await window.electronAPI.rigctldCommand(`T ${ptt ? '1' : '0'}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async getSplit(): Promise<RigctldResponse> {
    try {
      return await window.electronAPI.rigctldCommand('s');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async setSplit(split: boolean, txVfo: string = 'VFOB'): Promise<RigctldResponse> {
    try {
      return await window.electronAPI.rigctldCommand(`S ${split ? '1' : '0'} ${txVfo}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async getSplitFrequency(): Promise<RigctldResponse> {
    try {
      return await window.electronAPI.rigctldCommand('i');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async setSplitFrequency(frequency: number): Promise<RigctldResponse> {
    try {
      return await window.electronAPI.rigctldCommand(`I ${frequency}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async getRit(): Promise<RigctldResponse> {
    try {
      return await window.electronAPI.rigctldCommand('j');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async setRit(rit: number): Promise<RigctldResponse> {
    try {
      return await window.electronAPI.rigctldCommand(`J ${rit}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async getXit(): Promise<RigctldResponse> {
    try {
      return await window.electronAPI.rigctldCommand('z');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async setXit(xit: number): Promise<RigctldResponse> {
    try {
      return await window.electronAPI.rigctldCommand(`Z ${xit}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async sendCommand(command: string): Promise<RigctldResponse> {
    try {
      return await window.electronAPI.rigctldCommand(command);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const rigctldService = new RigctldService();
