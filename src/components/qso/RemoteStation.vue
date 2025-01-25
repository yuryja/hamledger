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
    <div v-if="isValid && callsign && stationInfo" class="remote-station-boxes">
      <!-- Box 1: Station details -->
      <div class="station-block station-remote">
        <img v-if="stationInfo.flag" :src="stationInfo.flag" :alt="stationInfo.country" class="station-flag" />
        <div class="station-info">
          <p class="station-name">Remote: {{ getStationName }}</p>
          <p class="station-qth">QTH: {{ stationInfo.qrzData?.qth || 'Loading...' }}</p>
          <p class="station-country">Country: {{ stationInfo.country || 'Loading...' }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
