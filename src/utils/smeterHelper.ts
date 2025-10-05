import type { MajorTick, MinorTick } from '../types/smeter';

export class SMeterHelper {
  private majorTicks: MajorTick[];

  constructor() {
    this.majorTicks = [
      { label: 'S1', color: 'white' },
      { label: 'S3', color: 'white' },
      { label: 'S5', color: 'white' },
      { label: 'S9', color: 'gray' },
      { label: '+20', color: '#ffa500' },
      { label: '+40', color: '#ffa500' },
      { label: '+60', color: '#ffa500' },
    ];
  }

  public getMajorTicks(): MajorTick[] {
    return this.majorTicks;
  }

  public getMinorColorFromIndex(majorIndex: number): string {
    return this.majorTicks[majorIndex]?.color || 'white';
  }

  public generateMinorTicks(majorIndex: number): MinorTick[] {
    if (typeof majorIndex !== 'number' || majorIndex >= this.majorTicks.length - 1) {
      return [];
    }

    const color = this.getMinorColorFromIndex(majorIndex);
    return Array(4)
      .fill(null)
      .map(() => ({ color }));
  }

}

export const smeterHelper = new SMeterHelper();
