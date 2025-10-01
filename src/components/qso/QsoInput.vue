<script lang="ts">
import { useQsoStore } from '../../store/qso';
import { useRigStore } from '../../store/rig';
import { BAND_RANGES, getBandFromFrequency } from '../../utils/bands';

export default {
  name: 'QsoInput',
  setup() {
    const qsoStore = useQsoStore();
    const rigStore = useRigStore();
    return { qsoStore, rigStore };
  },
  data() {
    return {
      callsignInput: null as HTMLInputElement | null,
      bands: BAND_RANGES.map(band => ({
        value: band.name,
        label: band.name.toUpperCase(),
      })),
    };
  },
  computed: {
    modes() {
      return this.rigStore.modes;
    },
    currentMode: {
      get() {
        return this.rigStore.selectedMode;
      },
      set(newMode: string) {
        this.qsoStore.updateQsoForm('mode', newMode);
      },
    },
    isCallsignValid() {
      return this.qsoStore.isCallsignValid;
    },
  },
  watch: {
    'rigStore.rigState.frequency': {
      handler(newFreq: number) {
        if (newFreq) {
          const band = getBandFromFrequency(newFreq);
          if (band) {
            this.qsoStore.updateQsoForm('band', band.name);
          }
        }
      },
      immediate: true,
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.focusCallsignInput();
      // Start updating UTC time
      this.qsoStore.updateCurrentUTCTime();
      setInterval(() => {
        this.qsoStore.updateCurrentUTCTime();
      }, 1000);
    });
  },
  methods: {
    focusCallsignInput() {
      const input = this.$refs.callsignInput as HTMLInputElement;
      if (input) {
        input.focus();
      }
    },
    handleKeydown(e: KeyboardEvent) {
      const input = this.$refs.callsignInput as HTMLInputElement;
      if (input.value != '' && e.key === 'Enter') {
        e.preventDefault();
        this.qsoStore.addQso();
        // Refocus callsign input after adding QSO
        this.$nextTick(() => {
          this.focusCallsignInput();
        });
      }
    },
    handleAddQSO() {
      const input = this.$refs.callsignInput as HTMLInputElement;
      if (input.value != '') this.qsoStore.addQso();
      // Refocus callsign input after adding QSO
      this.$nextTick(() => {
        this.focusCallsignInput();
      });
    },
  },
};
</script>

<template>
  <section class="qso_input_area panel">
    <h2 class="section-title">QSO Input</h2>
    <div class="qso-input-content">
      <div class="qso-input-group">
        <label for="callsign">Callsign</label>
        <input
          ref="callsignInput"
          type="text"
          id="callsign"
          :value="qsoStore.qsoForm.callsign"
          :class="{ 'invalid-callsign': !isCallsignValid && qsoStore.qsoForm.callsign }"
          @input="e => qsoStore.updateQsoForm('callsign', (e.target as HTMLInputElement).value)"
          @keydown="handleKeydown"
        />
      </div>

      <div class="qso-input-group">
        <label for="band">Band</label>
        <select
          id="band"
          :value="qsoStore.qsoForm.band"
          @change="e => qsoStore.updateQsoForm('band', (e.target as HTMLSelectElement).value)"
        >
          <option v-for="band in bands" :key="band.value" :value="band.value">
            {{ band.label }}
          </option>
        </select>
      </div>

      <div class="qso-input-group small">
        <label for="rstr">RSTr</label>
        <input
          type="text"
          id="rstr"
          :value="qsoStore.qsoForm.rstr"
          @input="e => qsoStore.updateQsoForm('rstr', (e.target as HTMLInputElement).value)"
          placeholder="59"
        />
      </div>

      <div class="qso-input-group small">
        <label for="rstt">RSTt</label>
        <input
          type="text"
          id="rstt"
          :value="qsoStore.qsoForm.rstt"
          @input="e => qsoStore.updateQsoForm('rstt', (e.target as HTMLInputElement).value)"
          placeholder="59"
        />
      </div>

      <div class="qso-input-group small">
        <label for="date">Date</label>
        <input
          type="text"
          id="date"
          :value="qsoStore.qsoForm.date"
          @input="e => qsoStore.updateQsoForm('date', (e.target as HTMLInputElement).value)"
          placeholder="22/12/2022"
        />
      </div>

      <div class="qso-input-group small">
        <label for="utc">UTC</label>
        <input
          type="text"
          id="utc"
          :value="qsoStore.qsoForm.utc"
          @input="e => qsoStore.updateQsoForm('utc', (e.target as HTMLInputElement).value)"
          :placeholder="qsoStore.currentUTCTime"
        />
      </div>

      <div class="qso-input-group">
        <label for="remark">Remark</label>
        <input
          type="text"
          id="remark"
          :value="qsoStore.qsoForm.remark"
          @input="e => qsoStore.updateQsoForm('remark', (e.target as HTMLInputElement).value)"
          placeholder="e.g. CQ Test"
        />
      </div>

      <div class="qso-input-group">
        <label for="notes">Notes</label>
        <textarea
          id="notes"
          :value="qsoStore.qsoForm.notes"
          @input="e => qsoStore.updateQsoForm('notes', (e.target as HTMLTextAreaElement).value)"
          rows="2"
          placeholder="Additional info"
        ></textarea>
      </div>

      <button class="add-qso-btn" @click="handleAddQSO">Add QSO</button>
    </div>
  </section>
</template>

<style scoped>
/* Left: QSO input */
.qso_input_area {
  flex: 1;
  background: #333;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  /* so the title is above the content */
  gap: 0.5rem;
}

.qso-input-content {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

/* QSO inputs */
.qso-input-group {
  display: flex;
  flex-direction: column;
  min-width: 100px;
}

.qso-input-group label {
  font-size: 0.8rem;
  margin-bottom: 0.3rem;
  color: var(--gray-color);
}

.qso-input-group input,
.qso-input-group select,
#notes {
  background: #444;
  border: 1px solid #555;
  padding: 0.3rem;
  color: #fff;
  border-radius: 3px;
}

.qso-input-group input {
  text-transform: uppercase;
  font-weight: 700;
  color: lightgreen;
}

.qso-input-group input.invalid-callsign {
  background-color: rgba(255, 0, 0, 0.1);
  border-color: rgba(255, 0, 0, 0.3);
}

.qso-input-group.small {
  width: 80px;
}

#notes {
  width: 160px;
  resize: vertical;
}

.add-qso-btn {
  background: var(--main-color);
  border: none;
  padding: 0.7rem 1rem;
  color: #000;
  cursor: pointer;
  border-radius: 3px;
  text-transform: uppercase;
  font-weight: bold;
  align-self: flex-end;
}
</style>
