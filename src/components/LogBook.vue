<script lang="ts">
import { useQsoStore } from '../store/qso';
import { getCountryCodeForCallsign } from '../utils/callsign';
import { DateHelper } from '../utils/dateHelper';
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
    };
  },
  computed: {
    allQsos() {
      return this.qsoStore.allQsos;
    },
    totalCount() {
      return this.qsoStore.totalCount;
    },
    sortedQsos() {
      return [...this.allQsos].sort((a, b) => {
        const aVal = a[this.sortKey];
        const bVal = b[this.sortKey];
        const modifier = this.sortOrder === 'asc' ? 1 : -1;

        if (aVal < bVal) return -1 * modifier;
        if (aVal > bVal) return 1 * modifier;
        return 0;
      });
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
      const result = await this.qsoStore.importAdif();
      if (!result.success) {
        console.error('ADIF import failed:', result.error);
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
  },
};
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
}
</style>
