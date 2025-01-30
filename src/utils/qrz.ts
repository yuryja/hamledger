import { QRZData } from "../types/station";
import { QRZClient } from "./qrzClient";
import { configHelper } from "./configHelper";

// Initialize QRZ client with credentials from config
function getQrzClient(): QRZClient {
  const username = configHelper.getSetting(['qrz'], 'username');
  const password = configHelper.getSetting(['qrz'], 'password');
  
  return new QRZClient({
    username: username || '',
    password: password || ''
  });
}

export async function fetchQRZData(callsign: string): Promise<QRZData | Error> {
  try {
    const username = configHelper.getSetting(['qrz'], 'username');
    const password = configHelper.getSetting(['qrz'], 'password');

    if (!username || !password) {
      throw new Error("QRZ credentials not configured in settings");
    }
    
    const qrzClient = getQrzClient();
    const data = await qrzClient.lookupCallsign(callsign);
    return data;
  } catch (error) {
    console.error("Error fetching QRZ data:", error);
    return error as Error;
  }
}
