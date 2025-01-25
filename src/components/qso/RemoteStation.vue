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
          <p class="station-name">Remote: {{ stationInfo.qrzData?.name ? "" + stationInfo.qrzData?.nickname ? "" +
            stationInfo.qrzData?.fname || callsign }}</p>
          <p class="station-qth">QTH: {{ stationInfo.qrzData?.qth || 'Loading...' }}</p>
          <p class="station-country">Country: {{ stationInfo.country || 'Loading...' }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
