<script setup lang="ts">
import { useRemoteStationStore } from '../../store/remote-station'
const remoteStore = useRemoteStationStore()
</script>

<template>
  <section class="remote-station-section">
    <h2 class="section-title">Remote Station</h2>
    <div class="remote-station-boxes">
      <!-- Box 1: Station details -->
      <div class="station-block station-remote">
        <img
          :src="remoteStore.stationInfo.flag"
          alt="Remote Station Flag"
          class="station-flag"
        />
        <div class="station-info">
          <p class="station-name">Remote: {{ remoteStore.stationInfo.name }}</p>
          <p class="station-weather">Weather: {{ remoteStore.stationInfo.weather }}</p>
          <p class="station-qth">QTH: {{ remoteStore.stationInfo.qth }}</p>
          <p class="station-time">Local time: {{ remoteStore.stationInfo.localTime }}</p>
        </div>
      </div>

      <!-- Box 2: Basic greetings info -->
      <div class="station-block station-greeting-block">
        <div class="station-info">
          <p v-for="(greeting, index) in remoteStore.stationInfo.greetings" 
             :key="index" 
             class="station-greeting-line">
            <strong>{{ greeting.label }}:</strong><br />
            "{{ greeting.greeting }}" — IPA: "{{ greeting.ipa }}"
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
