import { defineStore } from 'pinia';
import { useRigStore } from './rig';
import { StationData, BaseStationData, GeoData } from '../types/station';
import { qrzService } from '../services/QRZService';
import { CallsignHelper } from '../utils/callsign';
import { geocodeLocation } from '../utils/geocoding';
import { getWeather } from '../utils/weather';
import { QsoEntry } from '../types/qso';
import { MaidenheadLocator } from '../utils/maidenhead';
import { configHelper } from '../utils/configHelper';
import { calculateDistance } from '../utils/distance';
import * as countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
countries.registerLocale(en);

declare global {
  interface Window {
    electronAPI: {
      addQso: (qso: any) => Promise<any>;
      getAllDocs: () => Promise<any>;
      importAdif: () => Promise<{ imported: boolean; count?: number; error?: any }>;
      loadSettings: () => Promise<any>;
      saveSettings: (settings: any) => Promise<void>;
      updateQso: (qso: any) => Promise<any>;
      fetchDxSpots: (params: string) => Promise<any>;
    };
  }
}


export const useQsoStore = defineStore('qso', {
  state: () => ({
    currentSession: [] as QsoEntry[],
    allQsos: [] as QsoEntry[],
    currentUTCTime: '',
    initialized: false,
    stationInfo: {
      baseData: {} as BaseStationData,
      geodata: {} as GeoData,
      flag: '',
      weather: '',
      localTime: '',
      greetings: [],
      distance: undefined as number | undefined,
      qrzError: false,
    } satisfies StationData,
    qsoForm: {
      callsign: '',
      band: '40m',
      mode: 'SSB',
      rstr: '59',
      rstt: '59',
      date: '',
      utc: '',
      remark: '',
      notes: '',
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
      const rigStore = useRigStore();

      const newQso: QsoEntry = {
        callsign: this.qsoForm.callsign.toUpperCase(),
        band: this.qsoForm.band,
        freqRx: parseFloat(rigStore.frequency),
        mode: rigStore.selectedMode,
        datetime: now.toISOString(),
      };

      // Handle TX frequency
      newQso.freqTx = rigStore.splitActive ? parseFloat(rigStore.txFrequency) : '--';

      // Use form values or defaults for RST
      newQso.rstr = this.qsoForm.rstr || '59';
      newQso.rstt = this.qsoForm.rstt || '59';
      newQso.remark = this.qsoForm.remark?.trim() || '--';
      newQso.notes = this.qsoForm.notes?.trim() || '--';

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
        console.error('Failed to save QSO:', error);
      }

      // Reset form
      this.qsoForm = {
        callsign: '',
        band: '40m',
        mode: 'SSB',
        rstr: '59',
        rstt: '59',
        date: '',
        utc: '',
        remark: '',
        notes: '',
      };
    },
    updateQsoForm(field: keyof typeof this.qsoForm, value: string) {
      this.qsoForm[field] = value;
    },
    async initializeStore() {
      try {
        const result = await window.electronAPI.getAllDocs();
        this.allQsos = result.rows.map(row => row.doc as QsoEntry);
        this.initialized = true;
      } catch (error) {
        console.error('Failed to initialize QSO store:', error);
      }
    },

    async updateQso(updatedQso: QsoEntry) {
      try {
        const response = await window.electronAPI.updateQso(updatedQso);
        if (response.ok) {
          // Update in current session if present
          const sessionIndex = this.currentSession.findIndex(qso => qso._id === updatedQso._id);
          if (sessionIndex !== -1) {
            this.currentSession[sessionIndex] = updatedQso;
          }

          // Update in all QSOs
          const allIndex = this.allQsos.findIndex(qso => qso._id === updatedQso._id);
          if (allIndex !== -1) {
            this.allQsos[allIndex] = updatedQso;
          }
        }
      } catch (error) {
        console.error('Failed to update QSO:', error);
        throw error;
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
        console.error('Failed to import ADIF:', error);
        return { success: false, error };
      }
    },

    updateCurrentUTCTime() {
      const now = new Date();
      this.currentUTCTime = now.toLocaleTimeString('en-US', {
        timeZone: 'UTC',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    },
    async fetchStationInfo(callsign: string): Promise<void | Error> {
      try {
        // Reset station info first to avoid showing stale data
        this.stationInfo = {
          baseData: {
            call: callsign,
            name: '',
            country: '',
            lat: undefined,
            lon: undefined,
            grid: '',
            qth: '',
          },
          geodata: {},
          flag: '',
          weather: '',
          localTime: '',
          greetings: [],
          distance: undefined,
          qrzError: false,
        };

        // Get country information from callsign
        const countryCode = CallsignHelper.getCountryCodeForCallsign(callsign);
        const countryName = countries.getName(countryCode.toUpperCase(), 'en') || 'Unknown';

        // Set country and flag
        this.stationInfo.baseData.country = countryName;
        this.stationInfo.flag =
          countryCode !== 'xx' ? `https://flagcdn.com/h80/${countryCode}.png` : '';

        // Try to get additional info from QRZ
        // First try with the full callsign (including portable prefixes/suffixes)
        let qrzData = await qrzService.lookupStationByCallsign(callsign);
        
        // If not found, try with base callsign (remove portable prefixes and suffixes)
        if (qrzData instanceof Error) {
          const baseCallsign = CallsignHelper.extractBaseCallsign(callsign);
          if (baseCallsign !== callsign) {
            qrzData = await qrzService.lookupStationByCallsign(baseCallsign);
          }
        }
        
        if (qrzData instanceof Error) {
          this.stationInfo.qrzError = true;
          console.error('QRZ lookup failed:', qrzData);
        } else {
          this.stationInfo.baseData.name = qrzData.name;
          this.stationInfo.baseData.grid = qrzData.grid;
          this.stationInfo.baseData.qth = qrzData.qth;
        }

        // Try to get coordinates in order of preference:
        // 1. From grid square if available
        if (this.stationInfo.baseData.grid) {
          try {
            const coords = MaidenheadLocator.gridToLatLon(this.stationInfo.baseData.grid);
            this.stationInfo.geodata = {
              lat: coords.lat,
              lon: coords.lon,
              display_name: this.stationInfo.baseData.qth || '',
            };
          } catch (error) {
            console.error('Error converting grid to coordinates:', error);
          }
        }

        // 2. From QTH if available and grid failed
        if (!this.stationInfo.geodata.lat && this.stationInfo.baseData.qth) {
          const geoData = await geocodeLocation(this.stationInfo.baseData.qth);
          if (geoData) {
            this.stationInfo.geodata = {
              lat: geoData.lat,
              lon: geoData.lon,
              display_name: geoData.display_name,
            };
          }
        }

        // Calculate distance if we have remote coordinates and local grid
        if (
          this.stationInfo.geodata.lat !== undefined &&
          this.stationInfo.geodata.lon !== undefined
        ) {
          const localGrid = configHelper.getSetting(['station'], 'grid');
          if (localGrid) {
            try {
              const localCoords = MaidenheadLocator.gridToLatLon(localGrid);
              this.stationInfo.distance = calculateDistance(
                localCoords.lat,
                localCoords.lon,
                this.stationInfo.geodata.lat,
                this.stationInfo.geodata.lon
              );
            } catch (error) {
              console.error('Error calculating distance:', error);
            }
          }
        }

        // Get weather if we have coordinates
        if (this.stationInfo.geodata.lat !== undefined) {
          const weatherData = await getWeather(
            this.stationInfo.geodata.lat,
            this.stationInfo.geodata.lon
          );
          if (weatherData) {
            this.stationInfo.weather = `${weatherData.temperature}°C, ${weatherData.description}`;
          }
        }

        // Set local time based on coordinates
        if (this.stationInfo.geodata.lon !== undefined) {
          const timeZoneOffset = Math.round(this.stationInfo.geodata.lon / 15);
          const localTime = new Date();
          localTime.setHours(localTime.getUTCHours() + timeZoneOffset);
          this.stationInfo.localTime = localTime.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      } catch (error) {
        console.error('Error fetching station info:', error);
        return error;
      }
    },

  },
  getters: {
    sessionCount: state => state.currentSession.length,
    totalCount: state => state.allQsos.length,
    isCallsignValid: state => {
      return state.qsoForm.callsign ? CallsignHelper.isValidCallsign(state.qsoForm.callsign) : true;
    },
  },
});
