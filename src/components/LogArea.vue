<script lang="ts">
import { useQsoStore } from '../store/qso'
import { getCountryCodeForCallsign } from '../utils/callsign'
import { DateHelper } from '../utils/dateHelper'

export default {
  name: 'LogArea',
  setup() {
    const qsoStore = useQsoStore()
    return { qsoStore }
  },
  computed: {
    currentSession() {
      return this.qsoStore.currentSession
    },
    allQsos() {
      return this.qsoStore.allQsos
    },
    sessionCount() {
      return this.qsoStore.sessionCount
    },
    totalCount() {
      return this.qsoStore.totalCount
    }
  },
  data() {
    return {
      sortKey: 'datetime',
      sortOrder: 'desc'
    }
  },
  methods: {
    getCountryCodeForCallsign,
    sortBy(key: string) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortKey = key;
        this.sortOrder = 'asc';
      }
    },
    getSortedQsos() {
      return [...this.currentSession].sort((a, b) => {
        const aVal = a[this.sortKey];
        const bVal = b[this.sortKey];
        const modifier = this.sortOrder === 'asc' ? 1 : -1;
        
        if (aVal < bVal) return -1 * modifier;
        if (aVal > bVal) return 1 * modifier;
        return 0;
      });
    }
  },
}
</script>

<template>
  <main class="log-container">
    <div class="log-header">
      <h2 class="section-title">Log Area</h2>
      <div class="qso-count">
        <span>This session: {{ sessionCount }} QSO</span>
        <span>All: {{ totalCount }} QSO</span>
        <button class="tab-btn active">New session</button>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="qso-table">
        <thead>
          <tr>
            <th @click="sortBy('datetime')" class="sortable">
              Date
              <span v-if="sortKey === 'datetime'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th>Time</th>
            <th @click="sortBy('callsign')" class="sortable">
              Callsign
              <span v-if="sortKey === 'callsign'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('band')" class="sortable">
              Band
              <span v-if="sortKey === 'band'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('freqRx')" class="sortable">
              Freq. RX
              <span v-if="sortKey === 'freqRx'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('freqTx')" class="sortable">
              Freq. TX
              <span v-if="sortKey === 'freqTx'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('mode')" class="sortable">
              Mode
              <span v-if="sortKey === 'mode'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th>RSTr</th>
            <th>RSTr</th>
            <th>Remark</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in getSortedQsos()" :key="entry.callsign + entry.datetime">
            <td>{{ DateHelper.formatUTCDate(new Date(entry.datetime)) }}</td>
            <td>{{ DateHelper.formatUTCTime(new Date(entry.datetime)) }}</td>
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
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.table-wrapper {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  margin-bottom: 0;
}

.qso-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  color: var(--gray-color);
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

.qso-table thead th.sortable {
  cursor: pointer;
  user-select: none;
}

.qso-table thead th.sortable:hover {
  background: #555;
}

.sort-indicator {
  margin-left: 0.5rem;
  color: var(--main-color);
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

.qso-count {
  background: #444;
  border: 1px solid #777;
  padding: 0.5rem 1rem;
  border-radius: 3px;
  line-height: 1.3;
  font-size: 0.9rem;
  color: var(--gray-color);
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
}

.tab-btn {
  background: #444;
  border: none;
  color: var(--gray-color);
  padding: 0.6rem 1rem;
  cursor: pointer;
  border-radius: 3px;
  margin-left: 1rem;
}

.tab-btn.active {
  background: var(--main-color);
  color: #000;
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
</style>
