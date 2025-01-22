<script lang="ts">
interface QsoEntry {
  callsign: string;
  band: string;
  freqRx: string;
  freqTx: string;
  mode: string;
  rstr1: string;
  rstr2: string;
  datetime: string;
  remark: string;
  notes: string;
}

export default {
  name: 'LogArea',
  data() {
    return {
      qsoEntries: [
        {
          callsign: 'F5FHB',
          band: '15 m',
          freqRx: '21.170',
          freqTx: '21.170',
          mode: 'SSB',
          rstr1: '59',
          rstr2: '599',
          datetime: '22/12/2022 08:18:03 UTC',
          remark: 'BE',
          notes: '--'
        },
        {
          callsign: 'HB9CPQ',
          band: '15 m',
          freqRx: '21.170',
          freqTx: '21.170',
          mode: 'SSB',
          rstr1: '59',
          rstr2: '599',
          datetime: '22/12/2022 08:13:50 UTC',
          remark: 'BP',
          notes: '--'
        },
        {
          callsign: 'OK5FF',
          band: '20 m',
          freqRx: '14.170',
          freqTx: '14.170',
          mode: 'SSB',
          rstr1: '59',
          rstr2: '599',
          datetime: '22/12/2022 07:48:19 UTC',
          remark: 'BP',
          notes: '--'
        }
      ] as QsoEntry[],
      prefixMap: {
        F: 'fr',
        HB9: 'ch',
        OK: 'cz',
        DL: 'de',
        G: 'gb',
        EA: 'es'
      },
      sessionCount: 3,
      totalCount: 5615
    }
  },
  methods: {
    getCountryCodeForCallsign(callsign: string): string {
      callsign = callsign.toUpperCase();
      const knownPrefixes = Object.keys(this.prefixMap).sort((a, b) => b.length - a.length);
      for (const prefix of knownPrefixes) {
        if (callsign.startsWith(prefix)) {
          return this.prefixMap[prefix as keyof typeof this.prefixMap];
        }
      }
      return 'xx';
    }
  }
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
        <tr v-for="entry in qsoEntries" :key="entry.callsign + entry.datetime">
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
