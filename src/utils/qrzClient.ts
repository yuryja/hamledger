import { QRZData, QRZSessionResponse } from "../types/station";

interface QRZConfig {
  username: string;
  password: string;
  sessionKey?: string;
}

export class QRZClient {
  private baseUrl = "https://xmldata.qrz.com/xml/current";
  private config: QRZConfig;

  constructor(config: QRZConfig) {
    this.config = config;
  }

  private async getSessionKey(): Promise<string> {
    if (this.config.sessionKey) {
      return this.config.sessionKey;
    }

    const params = new URLSearchParams({
      username: this.config.username,
      password: this.config.password,
      agent: "hamlogger-1.0",
    });

    const response = await fetch(`${this.baseUrl}/?${params}`);
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    const key = xmlDoc.querySelector("Key")?.textContent;
    const error = xmlDoc.querySelector("Error")?.textContent;

    if (error) {
      throw new Error(`QRZ Authentication error: ${error}`);
    }
    if (!key) {
      throw new Error("No session key returned");
    }

    this.config.sessionKey = key;
    return key;
  }

  async lookupCallsign(callsign: string): Promise<QRZData> {
    const key = await this.getSessionKey();

    const params = new URLSearchParams({
      s: key,
      callsign: callsign,
    });

    const response = await fetch(`${this.baseUrl}/?${params}`);
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    const error = xmlDoc.querySelector("Error")?.textContent;
    if (error) {
      throw new Error(`QRZ Lookup error: ${error}`);
    }

    const callsignElem = xmlDoc.querySelector("Callsign");
    if (!callsignElem) {
      throw new Error("No callsign data returned");
    }

    return {
      call: callsignElem.querySelector("call")?.textContent || "",
      fname: callsignElem.querySelector("fname")?.textContent || "",
      name: callsignElem.querySelector("name")?.textContent || "",
      addr1: callsignElem.querySelector("addr1")?.textContent || "",
      addr2: callsignElem.querySelector("addr2")?.textContent || "",
      state: callsignElem.querySelector("state")?.textContent || "",
      zip: callsignElem.querySelector("zip")?.textContent || "",
      country: callsignElem.querySelector("country")?.textContent || "Unknown",
      lat: parseFloat(callsignElem.querySelector("lat")?.textContent || "0"),
      lon: parseFloat(callsignElem.querySelector("lon")?.textContent || "0"),
      grid: callsignElem.querySelector("grid")?.textContent || "",
      county: callsignElem.querySelector("county")?.textContent || "",
      qth: callsignElem.querySelector("addr2")?.textContent || "",
      class: callsignElem.querySelector("class")?.textContent || "",
      email: callsignElem.querySelector("email")?.textContent || "",
      timezone: callsignElem.querySelector("TimeZone")?.textContent || "",
      gmtOffset: parseInt(
        callsignElem.querySelector("GMTOffset")?.textContent || "0"
      ),
    };
  }
}
