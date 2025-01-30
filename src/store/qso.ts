import { defineStore } from "pinia";
import { useRigStore } from "./rig";
import { StationData, BaseStationData, GeoData } from "../types/station";
import { qrzService } from "../services/QRZService";
import { getCountryCodeForCallsign } from "../utils/callsign";
import { geocodeLocation } from "../utils/geocoding";
import { getWeather } from "../utils/weather";
import { QsoEntry } from "../types/qso";

declare global {
  interface Window {
    electronAPI: {
      addQso: (qso: any) => Promise<any>;
      getAllDocs: () => Promise<any>;
      importAdif: () => Promise<{
        imported: boolean;
        count?: number;
        error?: any;
      }>;
      loadSettings: () => Promise<any>;
      saveSettings: (settings: any) => Promise<void>;
    };
  }
}

const CALLSIGN_REGEX =
  /((2[A-Z]{1,2}|[BFGIKMNRW][A-Z]{0,2}|3[A-CE-Z][A-Z]{0,1}|4[A-MO-Z][A-Z]{0,1}|[5-9OUX][A-Z][A-Z]{0,1})([0-9][0-9A-Z]{0,3}[A-Z])|([ACDLP][2-9A-Z][A-Z]{0,1}|E[2-7A-Z][A-Z]{0,1}|H[2-46-9A-Z][A-Z]{0,1}|[JTV][2-8A-Z][A-Z]{0,1}|S[2-35-9A-RT-Z][A-Z]{0,1}|Y[2-9A-Y][A-Z]{0,1}|Z[238A-Z][A-Z]{0,1})([0-9A-Z]{0,3}[A-Z]))/;

export function isValidCallsign(callsign: string): boolean {
  return CALLSIGN_REGEX.test(callsign.toUpperCase());
}

export const useQsoStore = defineStore("qso", {
  state: () => ({
    currentSession: [] as QsoEntry[],
    allQsos: [] as QsoEntry[],
    currentUTCTime: "",
    initialized: false,
    stationInfo: {
      baseData: {} as BaseStationData,
      geodata: {} as GeoData,
      flag: "",
      weather: "",
      localTime: "",
      greetings: [],
    } satisfies StationData,
    qsoForm: {
      callsign: "",
      band: "40m",
      mode: "SSB",
      rstr: "59",
      rstt: "59",
      date: "",
      utc: "",
      remark: "",
      notes: "",
    },
  }),
  actions: {
    async init() {
      if (!this.initialized) {
        await this.initializeStore();
      }
    },
    async addQso() {
      const now = new Date();
      const utcDateStr = now.toLocaleDateString("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const utcTimeStr = now.toLocaleTimeString("en-US", {
        timeZone: "UTC",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const rigStore = useRigStore();

      const newQso: QsoEntry = {
        callsign: this.qsoForm.callsign.toUpperCase(),
        band: this.qsoForm.band,
        freqRx: parseFloat(rigStore.frequency),
        mode: rigStore.selectedMode,
        datetime: now.toISOString(),
      };

      // Handle TX frequency
      newQso.freqTx = rigStore.splitActive
        ? parseFloat(rigStore.txFrequency)
        : "--";

      // Use form values or defaults for RST
      newQso.rstr = this.qsoForm.rstr || "59";
      newQso.rstt = this.qsoForm.rstt || "59";
      newQso.remark = this.qsoForm.remark?.trim() || "--";
      newQso.notes = this.qsoForm.notes?.trim() || "--";

      // Send to main process to save
      try {
        const response = await window.electronAPI.addQso({
          ...newQso,
          _id: new Date().toISOString(),
        });

        if (response.ok) {
          this.currentSession.push(newQso);
          this.allQsos.push(newQso);
        }
      } catch (error) {
        console.error("Failed to save QSO:", error);
      }

      // Reset form
      this.qsoForm = {
        callsign: "",
        band: "40m",
        mode: "SSB",
        rstr: "59",
        rstt: "59",
        date: "",
        utc: "",
        remark: "",
        notes: "",
      };
    },
    updateQsoForm(field: keyof typeof this.qsoForm, value: string) {
      this.qsoForm[field] = value;
    },
    async initializeStore() {
      try {
        const result = await window.electronAPI.getAllDocs();
        this.allQsos = result.rows.map((row) => row.doc as QsoEntry);
        this.initialized = true;
      } catch (error) {
        console.error("Failed to initialize QSO store:", error);
      }
    },

    async importAdif() {
      try {
        const result = await window.electronAPI.importAdif();
        if (result.imported) {
          await this.initializeStore();
          return { success: true, count: result.count };
        }
        return { success: false, error: result.error };
      } catch (error) {
        console.error("Failed to import ADIF:", error);
        return { success: false, error };
      }
    },

    updateCurrentUTCTime() {
      const now = new Date();
      this.currentUTCTime = now.toLocaleTimeString("en-US", {
        timeZone: "UTC",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    },
    async fetchStationInfo(callsign: string): Promise<void | Error> {
      try {
        // Reset station info first to avoid showing stale data
        this.stationInfo = {
          baseData: {
            call: "",
            name: "",
            country: "",
            lat: undefined,
            lon: undefined,
            grid: "",
            qth: "",
          },
          geodata: {},
          flag: "",
          weather: "",
          localTime: "",
          greetings: [],
        };

        const countryCode = getCountryCodeForCallsign(callsign);
        const qrzData = await qrzService.lookupStationByCallsign(callsign);

        // If QRZ lookup failed, try to find info in existing QSOs
        if (qrzData instanceof Error) {
          const existingQso = this.allQsos.find(
            (qso: QsoEntry) => qso.callsign === callsign
          );

          // Create basic station data with just country and flag
          this.stationInfo = {
            baseData: {
              call: callsign,
              name: "",
              country: existingQso?.country || "Unknown",
              lat: undefined,
              lon: undefined,
              grid: "",
              qth: "",
            },
            geodata: {},
            flag:
              countryCode !== "xx"
                ? `https://flagcdn.com/h80/${countryCode}.png`
                : "",
            weather: "",
            localTime: "",
            qrzData: undefined,
            greetings: [],
          };
        } else {
          // If QRZ lookup succeeded, create full station data
          this.stationInfo = {
            baseData: {
              call: callsign,
              name: qrzData.name,
              country: qrzData.country,
              lat: qrzData.lat,
              lon: qrzData.lon,
              grid: qrzData.grid,
              qth: qrzData.qth,
            },
            geodata: {},
            flag:
              countryCode !== "xx"
                ? `https://flagcdn.com/h80/${countryCode}.png`
                : "",
            weather: "",
            localTime: "",
            greetings: [],
          };

          // Get coordinates from QRZ or geocoding
          this.stationInfo.geodata =
            this.stationInfo.baseData.lat && this.stationInfo.baseData.lon
              ? {
                  lat: this.stationInfo.baseData.lat,
                  lon: this.stationInfo.baseData.lon,
                  display_name: "",
                }
              : {};
        }
        // If QRZ doesn't provide coordinates, try geocoding
        if (!this.stationInfo.geodata && this.stationInfo.baseData.qth) {
          const geoData = await geocodeLocation(this.stationInfo.baseData.qth);
          if (geoData) {
            this.stationInfo.geodata = {
              lat: geoData.lat,
              lon: geoData.lon,
              display_name: geoData.display_name,
            };
          }
        }

        // Get weather if we have coordinates
        if (this.stationInfo.geodata) {
          const weatherData = await getWeather(
            this.stationInfo.geodata.lat,
            this.stationInfo.geodata.lon
          );
          if (weatherData) {
            this.stationInfo.weather = `${weatherData.temperature}°C, ${weatherData.description}`;
          }
        }

        // Calculate local time using timezone offset
        if (this.stationInfo.baseData.time_offset !== undefined) {
          const localTime = new Date();
          localTime.setHours(
            localTime.getHours() + this.stationInfo.baseData.time_offset
          );
          this.stationInfo.localTime = localTime.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      } catch (error) {
        console.error("Error fetching station info:", error);
        return error;
      }
    },
  },
  getters: {
    sessionCount: (state) => state.currentSession.length,
    totalCount: (state) => state.allQsos.length,
    isCallsignValid: (state) => {
      return state.qsoForm.callsign
        ? isValidCallsign(state.qsoForm.callsign)
        : true;
    },
  },
});
