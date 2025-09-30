<script lang="ts">
import { useQsoStore } from '../../store/qso';
import { StationData } from '../../types/station';

export default {
  name: 'RemoteStation',
  setup() {
    const qsoStore = useQsoStore();
    return { qsoStore };
  },
  computed: {
    callsign() {
      return this.qsoStore.qsoForm.callsign;
    },
    isValid() {
      return this.qsoStore.isCallsignValid;
    },
    stationInfo(): StationData | null {
      return this.qsoStore.stationInfo;
    },
  },
  watch: {
    async callsign(newCallsign: string) {
      if (this.isValid && newCallsign) {
        await this.qsoStore.fetchStationInfo(newCallsign);
      }
    },
  },
};
</script>

<template>
  <section class="remote-station-section">
    <h2 class="section-title">Remote Station</h2>
    <div v-if="isValid && callsign" class="remote-station-boxes">
      <!-- Station details with integrated location -->
      <div class="station-block station-remote" :class="{ 'qrz-error': stationInfo?.qrzError }">
        <img
          v-if="stationInfo?.flag"
          :src="stationInfo.flag"
          :alt="stationInfo.baseData.country"
          class="station-flag"
        />
        <div class="station-info">
          <p class="station-name">Remote: {{ stationInfo?.baseData?.name }}</p>
          <p class="station-qth">QTH: {{ stationInfo?.baseData?.qth || 'Loading...' }}</p>
          <p class="station-country">
            Country: {{ stationInfo?.baseData?.country || 'Loading...' }}
          </p>
          <template v-if="stationInfo?.geodata">
            <p class="station-coords-text">Lat: {{ stationInfo.geodata.lat?.toFixed(4) }}°</p>
            <p class="station-coords-text">Lon: {{ stationInfo.geodata.lon?.toFixed(4) }}°</p>
            <p v-if="stationInfo.geodata.display_name" class="station-coords-text">
              Location: {{ stationInfo.geodata.display_name }}
            </p>
          </template>
          <p v-if="stationInfo?.baseData?.grid" class="station-coords-text">
            Grid: {{ stationInfo.baseData.grid }}
          </p>
          <p v-if="stationInfo?.distance" class="station-distance">
            Distance: {{ stationInfo.distance }} km
          </p>
        </div>
      </div>

      <!-- Weather and Time -->
      <div
        v-if="stationInfo?.weather || stationInfo?.localTime"
        class="station-block station-weather"
      >
        <div class="station-info">
          <p class="station-weather-title">Local Info</p>
          <p v-if="stationInfo.weather" class="station-weather-text">{{ stationInfo.weather }}</p>
          <p v-if="stationInfo.localTime" class="station-time">
            Local time: {{ stationInfo.localTime }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Right: Remote Station side-by-side boxes */
.remote-station-section {
  flex: 1;
  background: #333;
  padding: 1rem;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  /* Title above the row of boxes */
  gap: 0.5rem;
}

/* The row of boxes side by side */
.remote-station-boxes {
  display: flex;
  flex-direction: row;
  gap: 1rem;
}

/* Station blocks */
.station-block {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  border: 1px solid var(--main-color);
  padding: 0.5rem;
  border-radius: 4px;
  background: #2b2b2b;
  min-width: 200px;
}

.qrz-error {
  background: rgba(255, 0, 0, 0.1);
}

.station-flag {
  height: 50px;
  width: auto;
  border: 1px solid #555;
  border-radius: 3px;
}

.station-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.85rem;
  line-height: 1.2;
}

.station-name {
  font-weight: bold;
  color: var(--main-color);
}

.station-weather,
.station-qth,
.station-coords-text,
.station-weather-text {
  color: var(--gray-color);
}

.station-distance {
  color: var(--main-color);
  font-weight: bold;
  margin-top: 0.2rem;
}

.station-coords-title,
.station-weather-title {
  font-weight: bold;
  color: var(--main-color);
  margin-bottom: 0.2rem;
}

.station-time {
  color: var(--gray-color);
  margin-top: 0.3rem;
  font-style: italic;
  font-weight: bold;
}

.station-greeting-line {
  margin-top: 0.3rem;
  color: var(--main-color);
  font-style: italic;
}
</style>
