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
  name: 'LogBook',
  setup() {
    const qsoStore = useQsoStore();
    return { qsoStore };
  },
  data() {
    return {
      DateHelper,
      sortKey: 'datetime',
      sortOrder: 'desc',
      selectedQso: null,
      showEditDialog: false,
      visibleStartIndex: 0,
      visibleCount: 50,
      scrollTop: 0,
      itemHeight: 40,
      containerHeight: 0,
      importStatus: {
        isImporting: false,
        importedCount: 0,
        totalCount: 0,
        error: null as string | null,
        success: false,
      },
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
      showFilters: false,
      regexError: false,
    };
  },
  computed: {
    allQsos() {
      return this.qsoStore.allQsos;
    },
    totalCount() {
      return this.qsoStore.totalCount;
    },
    filteredQsos() {
      let filtered = [...this.allQsos];

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
    sortedQsos() {
      return [...this.filteredQsos].sort((a, b) => {
        const aVal = a[this.sortKey];
        const bVal = b[this.sortKey];
        const modifier = this.sortOrder === 'asc' ? 1 : -1;

        if (aVal < bVal) return -1 * modifier;
        if (aVal > bVal) return 1 * modifier;
        return 0;
      });
    },
    uniqueBands() {
      const bands = [...new Set(this.allQsos.map(qso => qso.band).filter(Boolean))];
      return bands.sort();
    },
    uniqueModes() {
      const modes = [...new Set(this.allQsos.map(qso => qso.mode).filter(Boolean))];
      return modes.sort();
    },
    filteredCount() {
      return this.filteredQsos.length;
    },
    visibleQsos() {
      const start = this.visibleStartIndex;
      const end = Math.min(start + this.visibleCount, this.sortedQsos.length);
      return this.sortedQsos.slice(start, end);
    },
    totalHeight() {
      return this.sortedQsos.length * this.itemHeight;
    },
    offsetY() {
      return this.visibleStartIndex * this.itemHeight;
    },
  },
  mounted() {
    this.updateContainerHeight();
    window.addEventListener('resize', this.updateContainerHeight);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateContainerHeight);
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
      this.updateVisibleRange();
    },
    updateContainerHeight() {
      const container = this.$refs.tableWrapper as HTMLElement;
      if (container) {
        this.containerHeight = container.clientHeight;
        this.visibleCount = Math.ceil(this.containerHeight / this.itemHeight) + 5; // Buffer
        this.updateVisibleRange();
      }
    },
    updateVisibleRange() {
      const scrollTop = this.scrollTop;
      const startIndex = Math.floor(scrollTop / this.itemHeight);
      this.visibleStartIndex = Math.max(0, startIndex - 2); // Small buffer
    },
    onScroll(event: Event) {
      const target = event.target as HTMLElement;
      this.scrollTop = target.scrollTop;
      this.updateVisibleRange();
    },
    async handleImportAdif() {
      this.importStatus.isImporting = true;
      this.importStatus.error = null;
      this.importStatus.success = false;
      this.importStatus.importedCount = 0;
      this.importStatus.totalCount = 0;

      try {
        // First, let user select the file
        const fileResult = await window.electronAPI.selectAdifFile();
        if (!fileResult.success || !fileResult.filePath) {
          this.importStatus.isImporting = false;
          return;
        }

        // Parse the file to get total count
        const parseResult = await window.electronAPI.parseAdifFile(fileResult.filePath);
        if (!parseResult.success) {
          this.importStatus.error = parseResult.error || 'Failed to parse ADIF file';
          this.importStatus.isImporting = false;
          return;
        }

        this.importStatus.totalCount = parseResult.totalCount || 0;

        // Listen for progress updates BEFORE starting import
        window.electronAPI.onAdifImportProgress((progress) => {
          this.importStatus.importedCount = progress.imported;
        });

        // Import with progress updates
        const importResult = await window.electronAPI.importAdifWithProgress(fileResult.filePath);

        if (importResult.success) {
          this.importStatus.success = true;
          this.importStatus.importedCount = importResult.count || 0;
          console.log(`Successfully imported ${importResult.count} QSOs from ADIF file`);
          
          // Refresh the QSO store to show new data
          await this.qsoStore.initializeStore();
        } else {
          this.importStatus.error = importResult.error || 'Import failed';
        }
      } catch (error) {
        console.error('Error importing ADIF:', error);
        this.importStatus.error = 'An unexpected error occurred during import';
      } finally {
        this.importStatus.isImporting = false;
      }
    },
    closeEditDialog() {
      this.showEditDialog = false;
      this.selectedQso = null;
    },
    onQsoUpdated(updatedQso) {
      // Update the selected QSO with the new data
      this.selectedQso = updatedQso;
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
      this.updateVisibleRange();
    },
    toggleFilters() {
      this.showFilters = !this.showFilters;
    },
  },
};
</script>

<template>
  <main class="log-container">
    <div class="log-header">
      <h2 class="section-title">LogBook</h2>
      <div class="qso-count">
        <span>Total QSOs: {{ totalCount }}</span>
        <span v-if="filteredCount !== totalCount" class="filtered-count">
          ({{ filteredCount }} filtered)
        </span>
      </div>
      <div class="log-actions">
        <button 
          class="filter-btn" 
          @click="toggleFilters"
          :class="{ active: showFilters }"
        >
          🔍 Filters
        </button>
        <button 
          class="action-btn" 
          @click="handleImportAdif"
          :disabled="importStatus.isImporting"
        >
          <span v-if="!importStatus.isImporting">Import ADIF</span>
          <span v-else class="loading-text">
            <span class="spinner"></span>
            Importing...
          </span>
        </button>
      </div>
    </div>

    <!-- Filters Panel -->
    <div v-if="showFilters" class="filters-panel">
      <div class="filters-row">
        <div class="filter-group">
          <label>Search:</label>
          <input 
            v-model="filters.searchText" 
            type="text" 
            placeholder="Callsign, remark, notes..."
            class="filter-input"
            :class="{ 'regex-error': regexError }"
          />
          <div class="search-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="filters.useWildcard" :disabled="filters.useRegex" />
              Wildcard (* ?)
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="filters.useRegex" :disabled="filters.useWildcard" />
              Regex
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="filters.caseSensitive" />
              Case sensitive
            </label>
          </div>
          <div v-if="regexError" class="regex-error-message">
            Invalid regex pattern
          </div>
        </div>
        
        <div class="filter-group">
          <label>Band:</label>
          <select v-model="filters.selectedBand" class="filter-select">
            <option value="">All Bands</option>
            <option v-for="band in uniqueBands" :key="band" :value="band">
              {{ band }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Mode:</label>
          <select v-model="filters.selectedMode" class="filter-select">
            <option value="">All Modes</option>
            <option v-for="mode in uniqueModes" :key="mode" :value="mode">
              {{ mode }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="filters-row">
        <div class="filter-group">
          <label>Date From:</label>
          <input 
            v-model="filters.dateFrom" 
            type="date" 
            class="filter-input"
          />
        </div>
        
        <div class="filter-group">
          <label>Date To:</label>
          <input 
            v-model="filters.dateTo" 
            type="date" 
            class="filter-input"
          />
        </div>
        
        <div class="filter-group">
          <button @click="clearFilters" class="clear-btn">
            Clear All
          </button>
        </div>
      </div>
    </div>

    <!-- Import Progress -->
    <div v-if="importStatus.isImporting" class="import-progress">
      <div class="progress-info">
        <span class="progress-text">
          Imported {{ importStatus.importedCount }} 
          <span v-if="importStatus.totalCount > 0">of {{ importStatus.totalCount }}</span>
          QSOs
        </span>
      </div>
      <div class="progress-bar-container">
        <div 
          class="progress-bar-fill" 
          :style="{ 
            width: importStatus.totalCount > 0 
              ? `${(importStatus.importedCount / importStatus.totalCount) * 100}%` 
              : '0%' 
          }"
        ></div>
      </div>
    </div>

    <!-- Import Success -->
    <div v-if="importStatus.success && !importStatus.isImporting" class="success-message">
      ✅ Successfully imported {{ importStatus.importedCount }} QSOs!
    </div>

    <!-- Import Error -->
    <div v-if="importStatus.error && !importStatus.isImporting" class="error-message">
      ❌ Import failed: {{ importStatus.error }}
    </div>

    <div class="table-wrapper" ref="tableWrapper" @scroll="onScroll">
      <div class="virtual-scroll-container" :style="{ height: totalHeight + 'px' }">
        <table class="qso-table" :style="{ transform: `translateY(${offsetY}px)` }">
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
              <th>RSTt</th>
              <th>Remark</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(entry, index) in visibleQsos"
              :key="entry._id || entry.datetime + entry.callsign || index"
              :style="{ height: itemHeight + 'px' }"
              @click="
                selectedQso = entry;
                showEditDialog = true;
              "
            >
              <td>{{ this.DateHelper.formatUTCDate(new Date(entry.datetime)) }}</td>
              <td>{{ this.DateHelper.formatUTCTime(new Date(entry.datetime)) }}</td>
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
    </div>

    <QsoDetailDialog
      v-if="selectedQso"
      :qso="selectedQso"
      :show="showEditDialog"
      @close="closeEditDialog"
      @qso-updated="onQsoUpdated"
    />
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
  position: relative;
}

.virtual-scroll-container {
  position: relative;
}

.qso-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  position: relative;
}

.qso-table tbody tr {
  height: 40px;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filtered-count {
  color: var(--main-color);
  font-weight: bold;
}

.filter-btn {
  background: #555;
  border: 1px solid #777;
  padding: 0.5rem 1rem;
  color: #fff;
  cursor: pointer;
  border-radius: 3px;
  margin-right: 0.5rem;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #666;
}

.filter-btn.active {
  background: var(--main-color);
  color: #000;
  font-weight: bold;
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
  margin-bottom: 0.5rem;
}

.filters-row:last-child {
  margin-bottom: 0;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 150px;
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
  gap: 0.75rem;
  margin-top: 0.25rem;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: var(--gray-color);
  cursor: pointer;
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

.loading-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.import-progress {
  margin: 1rem 0;
  padding: 1rem;
  background: #2b2b2b;
  border: 1px solid #444;
  border-radius: 4px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-text {
  color: var(--main-color);
  font-weight: bold;
  font-size: 0.9rem;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: #444;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--main-color);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.success-message {
  color: #27ae60;
  font-size: 0.9rem;
  margin: 1rem 0;
  padding: 0.75rem;
  background: rgba(39, 174, 96, 0.1);
  border: 1px solid rgba(39, 174, 96, 0.3);
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9rem;
  margin: 1rem 0;
  padding: 0.75rem;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
