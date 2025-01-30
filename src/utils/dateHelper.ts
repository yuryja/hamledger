export class DateHelper {
  public static formatUTCDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  public static formatUTCTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      timeZone: 'UTC',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  public static getCurrentUTCTime(): string {
    const now = new Date()
    const utcHours = String(now.getUTCHours()).padStart(2, "0")
    const utcMinutes = String(now.getUTCMinutes()).padStart(2, "0")
    const utcSeconds = String(now.getUTCSeconds()).padStart(2, "0")
    return `${utcHours}:${utcMinutes}:${utcSeconds}`
  }
}
