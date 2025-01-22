<script lang="ts">
interface StationInfo {
  flag: string;
  name: string;
  weather: string;
  qth: string;
  localTime: string;
  greetings: {
    greeting: string;
    ipa: string;
    label: string;
  }[];
}

export default {
  name: 'RemoteStation',
  data() {
    return {
      stationInfo: {
        flag: 'https://flagcdn.com/h80/hu.png',
        name: 'ZOLTAN (Zoli) JUHASZ',
        weather: '19°C, Cloudy',
        qth: 'H-5932, Gadoros',
        localTime: '22:15',
        greetings: [
          {
            label: 'Appropriate greeting',
            greeting: 'Jó estét!',
            ipa: 'joː ɛʃteːt'
          },
          {
            label: 'Thank you',
            greeting: 'Köszönöm',
            ipa: 'køsønom'
          },
          {
            label: 'Good luck',
            greeting: 'Sok szerencsét',
            ipa: 'ʃok sɛrɛnt͡ʃeːt'
          }
        ]
      } as StationInfo
    }
  }
}
</script>

<template>
  <section class="remote-station-section">
    <h2 class="section-title">Remote Station</h2>
    <div class="remote-station-boxes">
      <!-- Box 1: Station details -->
      <div class="station-block station-remote">
        <img
          :src="stationInfo.flag"
          alt="Remote Station Flag"
          class="station-flag"
        />
        <div class="station-info">
          <p class="station-name">Remote: {{ stationInfo.name }}</p>
          <p class="station-weather">Weather: {{ stationInfo.weather }}</p>
          <p class="station-qth">QTH: {{ stationInfo.qth }}</p>
          <p class="station-time">Local time: {{ stationInfo.localTime }}</p>
        </div>
      </div>

      <!-- Box 2: Basic greetings info -->
      <div class="station-block station-greeting-block">
        <div class="station-info">
          <p v-for="(greeting, index) in stationInfo.greetings" 
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
