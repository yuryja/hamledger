import type { MajorTick, MinorTick } from '../types/smeter';

export class SMeterHelper {
  private majorTicks: MajorTick[];

  constructor() {
    this.majorTicks = [
      { label: 'S1', color: 'white' },
      { label: 'S3', color: 'white' },
      { label: 'S5', color: 'white' },
      { label: 'S7', color: 'white' },
      { label: 'S9', color: 'gray' },
      { label: '+10', color: '#ffa500' },
      { label: '+20', color: '#ffa500' },
      { label: '+30', color: '#ffa500' },
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

  /**
   * Convert signal strength in dB to S-meter units
   * S9 = -73 dBm, each S-unit = 6 dB
   * Above S9: +10dB, +20dB, +30dB etc.
   */
  public dbToSMeter(strengthDb: number): { sUnit: number; isOverS9: boolean; overS9Value: number } {
    // Assuming strengthDb is relative to S9 (-73 dBm reference)
    // Positive values are stronger signals
    const s9Reference = -73; // dBm
    const sUnitStep = 6; // dB per S-unit
    
    // Calculate relative to S9
    const relativeToS9 = strengthDb - s9Reference;
    
    if (relativeToS9 <= -48) { // Below S1 (-73 - 48 = -121 dBm)
      return { sUnit: 0, isOverS9: false, overS9Value: 0 };
    } else if (relativeToS9 <= 0) { // S1 to S9
      const sUnit = Math.max(1, Math.min(9, Math.floor((relativeToS9 + 48) / sUnitStep) + 1));
      return { sUnit, isOverS9: false, overS9Value: 0 };
    } else { // Above S9
      const overS9 = Math.min(60, Math.floor(relativeToS9 / 10) * 10); // Round to nearest 10dB
      return { sUnit: 9, isOverS9: true, overS9Value: overS9 };
    }
  }

  /**
   * Get the active tick count based on signal strength
   */
  public getActiveTicks(strengthDb: number): number {
    const { sUnit, isOverS9, overS9Value } = this.dbToSMeter(strengthDb);
    
    if (!isOverS9) {
      // Each S-unit has 5 ticks (1 major + 4 minor)
      return Math.max(0, (sUnit - 1) * 5 + 5);
    } else {
      // S9 + over S9 ticks
      const s9Ticks = 9 * 5; // 45 ticks for S1-S9
      const overS9Ticks = Math.min(3, Math.floor(overS9Value / 10)) * 5; // +10, +20, +30
      return s9Ticks + overS9Ticks;
    }
  }
}

export const smeterHelper = new SMeterHelper();
