<script lang="ts">
import { useQsoStore } from '../store/qso';
import { getCountryCodeForCallsign } from '../utils/callsign';
import { DateHelper } from '../utils/dateHelper';
import { TextMatcher } from '../utils/textMatcher';
import QsoDetailDialog from './qso/QsoDetailDialog.vue';

export default {
  components: {
    QsoDetailDialog,
  },
  name: 'LogArea',
  setup() {
    const qsoStore = useQsoStore();
    return { qsoStore, DateHelper };
  },
  computed: {
    currentSession() {
      return this.qsoStore.currentSession;
    },
    allQsos() {
      return this.qsoStore.allQsos;
    },
    sessionCount() {
      return this.qsoStore.sessionCount;
    },
    totalCount() {
      return this.qsoStore.totalCount;
    },
    filteredCurrentSession() {
      let filtered = [...this.currentSession];

      // Text search with wildcard/regex support
      if (this.filters.searchText.trim()) {
        const matchOptions = {
          useRegex: this.filters.useRegex,
          useWildcard: this.filters.useWildcard,
          caseSensitive: this.filters.caseSensitive,
        };

        // Validate regex if regex mode is enabled
        if (this.filters.useRegex) {
          this.regexError = !TextMatcher.isValidRegex(this.filters.searchText);
          if (this.regexError) {
            // If regex is invalid, don't filter
            return filtered;
          }
        } else {
          this.regexError = false;
        }

        filtered = filtered.filter(qso => 
          TextMatcher.matches(qso.callsign || '', this.filters.searchText, matchOptions) ||
          TextMatcher.matches(qso.remark || '', this.filters.searchText, matchOptions) ||
          TextMatcher.matches(qso.notes || '', this.filters.searchText, matchOptions)
        );
      }

      // Band filter
      if (this.filters.selectedBand) {
        filtered = filtered.filter(qso => qso.band === this.filters.selectedBand);
      }

      // Mode filter
      if (this.filters.selectedMode) {
        filtered = filtered.filter(qso => qso.mode === this.filters.selectedMode);
      }

      // Date range filter
      if (this.filters.dateFrom) {
        const fromDate = new Date(this.filters.dateFrom);
        filtered = filtered.filter(qso => new Date(qso.datetime) >= fromDate);
      }

      if (this.filters.dateTo) {
        const toDate = new Date(this.filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        filtered = filtered.filter(qso => new Date(qso.datetime) <= toDate);
      }

      return filtered;
    },
    uniqueBands() {
      const bands = [...new Set(this.currentSession.map(qso => qso.band).filter(Boolean))];
      return bands.sort();
    },
    uniqueModes() {
      const modes = [...new Set(this.currentSession.map(qso => qso.mode).filter(Boolean))];
      return modes.sort();
    },
    filteredCount() {
      return this.filteredCurrentSession.length;
    },
  },
  data() {
    return {
      sortKey: 'datetime',
      sortOrder: 'desc',
      selectedQso: null,
      showEditDialog: false,
      filters: {
        searchText: '',
        selectedBand: '',
        selectedMode: '',
        dateFrom: '',
        dateTo: '',
        useRegex: false,
        useWildcard: false,
        caseSensitive: false,
      },
      regexError: false,
    };
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
      return [...this.filteredCurrentSession].sort((a, b) => {
        const aVal = a[this.sortKey];
        const bVal = b[this.sortKey];
        const modifier = this.sortOrder === 'asc' ? 1 : -1;

        if (aVal < bVal) return -1 * modifier;
        if (aVal > bVal) return 1 * modifier;
        return 0;
      });
    },
    clearFilters() {
      this.filters = {
        searchText: '',
        selectedBand: '',
        selectedMode: '',
        dateFrom: '',
        dateTo: '',
        useRegex: false,
        useWildcard: false,
        caseSensitive: false,
      };
      this.regexError = false;
    },
  },
};
</script>

<template>
  <main class="log-container">
    <div class="log-header">
      <h2 class="section-title">Log Area</h2>
      <div class="qso-count">
        <span>This session: {{ sessionCount }} QSO</span>
        <span v-if="filteredCount !== sessionCount" class="filtered-count">
          ({{ filteredCount }} filtered)
        </span>
        <span>All: {{ totalCount }} QSO</span>
        <button class="tab-btn active">New session</button>
      </div>
    </div>

    <!-- Filters Panel -->
    <div class="filters-panel">
      <div class="filters-row">
        <div class="filter-group search-group">
          <label>Search:</label>
          <div class="search-container">
            <input 
              v-model="filters.searchText" 
              type="text" 
              placeholder="Callsign, remark, notes..."
              class="filter-input search-input"
              :class="{ 'regex-error': regexError }"
            />
            <div class="search-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="filters.useWildcard" :disabled="filters.useRegex" />
                *?
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="filters.useRegex" :disabled="filters.useWildcard" />
                Regex
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="filters.caseSensitive" />
                Aa
              </label>
            </div>
          </div>
          <div v-if="regexError" class="regex-error-message">
            Invalid regex pattern
          </div>
        </div>
        
        <div class="filter-group">
          <label>Band:</label>
          <select v-model="filters.selectedBand" class="filter-select">
            <option value="">All</option>
            <option v-for="band in uniqueBands" :key="band" :value="band">
              {{ band }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Mode:</label>
          <select v-model="filters.selectedMode" class="filter-select">
            <option value="">All</option>
            <option v-for="mode in uniqueModes" :key="mode" :value="mode">
              {{ mode }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>From:</label>
          <input 
            v-model="filters.dateFrom" 
            type="date" 
            class="filter-input date-input"
          />
        </div>
        
        <div class="filter-group">
          <label>To:</label>
          <input 
            v-model="filters.dateTo" 
            type="date" 
            class="filter-input date-input"
          />
        </div>
        
        <div class="filter-group">
          <button @click="clearFilters" class="clear-btn">
            Clear
          </button>
        </div>
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
          <tr
            v-for="entry in getSortedQsos()"
            :key="entry.callsign + entry.datetime"
            @click="
              selectedQso = entry;
              showEditDialog = true;
            "
          >
            <td>{{ DateHelper.formatUTCDate(new Date(entry.datetime)) }}</td>
            <td>{{ DateHelper.formatUTCTime(new Date(entry.datetime)) }}</td>
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
            <td>{{ entry.rstr }}</td>
            <td>{{ entry.rstt }}</td>
            <td>{{ entry.remark }}</td>
            <td>{{ entry.notes }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <QsoDetailDialog
      v-if="selectedQso"
      :qso="selectedQso"
      :show="showEditDialog"
      @close="showEditDialog = false"
    />
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
  cursor: pointer;
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
}

.filtered-count {
  color: var(--main-color);
  font-weight: bold;
}

.log-actions {
  margin-left: auto;
}


.filters-panel {
  background: #2b2b2b;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.filters-row {
  display: flex;
  gap: 1rem;
  align-items: end;
  flex-wrap: nowrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 100px;
}

.search-group {
  flex: 1;
  min-width: 300px;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
}

.date-input {
  width: 140px;
}

.filter-group label {
  font-size: 0.85rem;
  color: var(--gray-color);
  font-weight: bold;
}

.filter-input,
.filter-select {
  padding: 0.5rem;
  background: #333;
  border: 1px solid #555;
  border-radius: 3px;
  color: #fff;
  font-size: 0.9rem;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--main-color);
}

.clear-btn {
  background: #e74c3c;
  border: none;
  padding: 0.5rem 1rem;
  color: #fff;
  cursor: pointer;
  border-radius: 3px;
  font-size: 0.9rem;
  height: fit-content;
}

.clear-btn:hover {
  background: #c0392b;
}

.search-options {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.75rem;
  color: var(--gray-color);
  cursor: pointer;
  white-space: nowrap;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-input.regex-error {
  border-color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.regex-error-message {
  color: #e74c3c;
  font-size: 0.75rem;
  margin-top: 0.25rem;
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
