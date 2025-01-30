<script lang="ts">
import { useQsoStore } from '../store/qso'
import { getCountryCodeForCallsign } from '../utils/callsign'
import { DateHelper } from '../utils/dateHelper'

export default {
  name: 'LogBook',
  data() {
    return {
      DateHelper
    }
  },
  name: 'LogBook',
  setup() {
    const qsoStore = useQsoStore()
    return { qsoStore }
  },
  computed: {
    allQsos() {
      return this.qsoStore.allQsos
    },
    totalCount() {
      return this.qsoStore.totalCount
    }
  },
  methods: {
    getCountryCodeForCallsign,
    async handleImportAdif() {
      const result = await this.qsoStore.importAdif();
      if (!result.success) {
        console.error('ADIF import failed:', result.error);
      }
    }
  }
}
</script>

<template>
  <main class="log-container">
    <div class="log-header">
      <h2 class="section-title">LogBook</h2>
      <div class="qso-count">
        <span>Total QSOs: {{ totalCount }}</span>
      </div>
      <div class="log-actions">
        <button class="action-btn" @click="handleImportAdif">Import ADIF</button>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="qso-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Callsign</th>
            <th>Band</th>
            <th>Freq. RX</th>
            <th>Freq. TX</th>
            <th>Mode</th>
            <th>RSTr</th>
            <th>RSTt</th>
            <th>Remark</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in allQsos" :key="entry._id">
            <td>{{ this.DateHelper.formatUTCDate(new Date(entry.datetime)) }}</td>
            <td>{{ this.DateHelper.formatUTCTime(new Date(entry.datetime)) }}</td>
            <td>
              <img v-if="getCountryCodeForCallsign(entry.callsign) !== 'xx'"
                :src="`https://flagcdn.com/h40/${getCountryCodeForCallsign(entry.callsign)}.png`"
                :alt="getCountryCodeForCallsign(entry.callsign)" class="callsign-flag" />
              {{ entry.callsign }}
            </td>
            <td>{{ entry.band }}</td>
            <td>{{ entry.freqRx }}</td>
            <td>{{ entry.freqTx }}</td>
            <td>{{ entry.mode }}</td>
            <td>{{ entry.rstr }}</td>
            <td>{{ entry.rstt }}</td>
            <td>{{ entry.remark }}</td>
            <td>{{ entry.notes }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<style scoped>
.log-container {
  background: #333;
  border-radius: 5px;
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.table-wrapper {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.qso-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.qso-table thead th {
  background: #444;
  padding: 0.7rem;
  text-align: left;
  font-weight: normal;
  position: sticky;
  top: 0;
  z-index: 1;
}

.qso-table tbody td {
  border-top: 1px solid #555;
  padding: 0.7rem;
}

.qso-table tr:hover {
  background: #3c3c3c;
}

.callsign-flag {
  width: 20px;
  height: auto;
  margin-right: 0.3rem;
  vertical-align: baseline;
  border: 1px solid #555;
  border-radius: 2px;
}

.log-actions {
  margin-left: auto;
}

.action-btn {
  background: var(--main-color);
  border: none;
  padding: 0.5rem 1rem;
  color: #000;
  cursor: pointer;
  border-radius: 3px;
  font-weight: bold;
}

.qso-count {
  background: #444;
  border: 1px solid #777;
  padding: 0.5rem 1rem;
  border-radius: 3px;
  color: var(--gray-color);
}
</style>
