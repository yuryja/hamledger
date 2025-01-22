<script setup lang="ts">
import { useQsoStore } from '../store/qso'
import { storeToRefs } from 'pinia'

const qsoStore = useQsoStore()
const { currentSession, allQsos } = storeToRefs(qsoStore)
const { sessionCount, totalCount } = storeToRefs(qsoStore)

const prefixMap = {
  F: 'fr',
  HB9: 'ch',
  OK: 'cz',
  DL: 'de',
  G: 'gb',
  EA: 'es'
}
const getCountryCodeForCallsign = (callsign: string): string => {
  callsign = callsign.toUpperCase()
  const knownPrefixes = Object.keys(prefixMap).sort((a, b) => b.length - a.length)
  for (const prefix of knownPrefixes) {
    if (callsign.startsWith(prefix)) {
      return prefixMap[prefix as keyof typeof prefixMap]
    }
  }
  return 'xx'
}
</script>

<template>
  <main class="log-container">
    <h2 class="section-title">Log Area</h2>
    <nav class="tab-nav">
      <button class="tab-btn active">New session</button>
      <div class="qso-count">
        <span>This session: {{ sessionCount }} QSO</span>
        <span>All: {{ totalCount }} QSO</span>
      </div>
    </nav>

    <table class="qso-table">
      <thead>
        <tr>
          <th>Callsign</th>
          <th>Band</th>
          <th>Freq. RX</th>
          <th>Freq. TX</th>
          <th>Mode</th>
          <th>RSTr</th>
          <th>RSTr</th>
          <th>Date/Time</th>
          <th>Remark</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in currentSession" :key="entry.callsign + entry.datetime">
          <td>
            <img
              v-if="getCountryCodeForCallsign(entry.callsign) !== 'xx'"
              :src="`https://flagcdn.com/h40/${getCountryCodeForCallsign(entry.callsign)}.png`"
              :alt="getCountryCodeForCallsign(entry.callsign)"
              class="callsign-flag"
            />
            {{ entry.callsign }}
          </td>
          <td>{{ entry.band }}</td>
          <td>{{ entry.freqRx }}</td>
          <td>{{ entry.freqTx }}</td>
          <td>{{ entry.mode }}</td>
          <td>{{ entry.rstr1 }}</td>
          <td>{{ entry.rstr2 }}</td>
          <td>{{ entry.datetime }}</td>
          <td>{{ entry.remark }}</td>
          <td>{{ entry.notes }}</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>
