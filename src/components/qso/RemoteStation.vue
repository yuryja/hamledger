<script lang="ts">
import { useQsoStore } from '../../store/qso'
import { StationData } from '../../types/station'

export default {
  name: 'RemoteStation',
  setup() {
    const qsoStore = useQsoStore()
    return { qsoStore }
  },
  computed: {
    callsign() {
      return this.qsoStore.qsoForm.callsign
    },
    isValid() {
      return this.qsoStore.isCallsignValid
    },
    stationInfo(): StationData | null {
      return this.qsoStore.stationInfo
    },
    getStationName(): string {
      if (!this.stationInfo?.qrzData) return this.callsign;

      const { name, nickname, fname } = this.stationInfo.qrzData;
      return [name, (nickname || ""), fname || this.callsign].join(" ")
    }
  },
  watch: {
    async callsign(newCallsign: string) {
      if (this.isValid && newCallsign) {
        await this.qsoStore.fetchStationInfo(newCallsign)
      }
    }
  }
}
</script>

<template>
  <section class="remote-station-section">
    <h2 class="section-title">Remote Station</h2>
    <div v-if="isValid && callsign" class="remote-station-boxes">
      <!-- Box 1: Station details -->
      <div class="station-block station-remote">
        <img v-if="stationInfo?.flag" :src="stationInfo.flag" :alt="stationInfo.country" class="station-flag" />
        <div class="station-info">
          <p class="station-name">Remote: {{ getStationName }}</p>
          <p class="station-qth">QTH: {{ stationInfo?.qrzData?.qth || 'Loading...' }}</p>
          <p class="station-country">Country: {{ stationInfo?.country || 'Loading...' }}</p>
        </div>
      </div>

      <!-- Box 2: Coordinates -->
      <div v-if="stationInfo?.qrzData?.lat && stationInfo?.qrzData?.lon" class="station-block station-coords">
        <div class="station-info">
          <p class="station-coords-title">Location</p>
          <p class="station-coords-text">Lat: {{ stationInfo.qrzData.lat.toFixed(4) }}°</p>
          <p class="station-coords-text">Lon: {{ stationInfo.qrzData.lon.toFixed(4) }}°</p>
          <p v-if="stationInfo.qrzData.grid" class="station-coords-text">Grid: {{ stationInfo.qrzData.grid }}</p>
        </div>
      </div>

      <!-- Box 3: Weather -->
      <div v-if="stationInfo?.weather" class="station-block station-weather">
        <div class="station-info">
          <p class="station-weather-title">Local Weather</p>
          <p class="station-weather-text">{{ stationInfo.weather }}</p>
          <p v-if="stationInfo.localTime" class="station-time">Local time: {{ stationInfo.localTime }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
