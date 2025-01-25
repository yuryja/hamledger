import { QRZData } from "../types/station";
import { QRZClient } from "./qrzClient";

// Initialize QRZ client with your credentials
const qrzClient = new QRZClient({
  username: import.meta.env.VITE_QRZ_USERNAME || '',
  password: import.meta.env.VITE_QRZ_PASSWORD || ''
});

export async function fetchQRZData(callsign: string): Promise<QRZData | Error> {
  try {
    if (!import.meta.env.VITE_QRZ_USERNAME || !import.meta.env.VITE_QRZ_PASSWORD) {
      throw new Error("QRZ credentials not configured");
    }
    
    const data = await qrzClient.lookupCallsign(callsign);
    return data;
  } catch (error) {
    console.error("Error fetching QRZ data:", error);
    return error as Error;
  }
}
