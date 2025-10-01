<script lang="ts">
import { useRigStore } from '../../store/rig';
import type { MajorTick } from '../../types/smeter';
import { smeterHelper } from '../../utils/smeterHelper';

export default {
  name: 'FreqSMeter',
  data() {
    const store = useRigStore();
    return {
      rigStore: store,
      isEditing: false,
      isTxEditing: false,
      unit: 'MHz',
      smeterHelper: smeterHelper,
    };
  },
  computed: {
    majorTicks(): MajorTick[] {
      return this.smeterHelper.getMajorTicks();
    },
    frequency: {
      get() {
        return this.rigStore.currentFrequency;
      },
      set(value: string) {
        this.rigStore.setFrequencyFromString(value);
      },
    },
    txFrequency: {
      get() {
        return this.rigStore.splitFrequency || '0';
      },
      set(value: string) {
        const frequency = parseFloat(value) * 1000000; // Convert MHz to Hz
        this.rigStore.setSplitFrequency(frequency);
      },
    },
    splitActive() {
      return this.rigStore.rigState.split;
    },
    selectedMode: {
      get() {
        return this.rigStore.currentMode;
      },
      set(value: string) {
        this.rigStore.setMode(value);
      },
    },
  },
  methods: {
    async toggleSplit() {
      console.log('FreqSMeter: toggleSplit called');
      console.log('Current split state:', this.rigStore.rigState.split);
      console.log('Is connected:', this.rigStore.isConnected);

      const result = await this.rigStore.toggleSplit();
      console.log('toggleSplit result:', result);
    },
  },
};
</script>

<template>
  <div class="header-center freq-s-meter">
    <div class="freq-s-meter-content">
      <div class="freq-display">
        <button class="split-btn mode-badge" :class="{ active: splitActive }" @click="toggleSplit">
          SPLIT
        </button>
        <div class="rig-frequency" @click="isEditing = true">
          <div class="freq-main">
            <input
              v-if="isEditing"
              type="text"
              v-model="frequency"
              @blur="isEditing = false"
              @keyup.enter="isEditing = false"
              class="freq-input"
            />
            <template v-else>
              <span>{{ frequency }}</span>
              <template v-if="splitActive">
                <span class="tx-freq" @click.stop="isTxEditing = true">
                  <input
                    v-if="isTxEditing"
                    type="text"
                    v-model="txFrequency"
                    @blur="isTxEditing = false"
                    @keyup.enter="isTxEditing = false"
                    style="
                      background: transparent;
                      border: none;
                      color: inherit;
                      font: inherit;
                      width: 60px;
                    "
                  />
                  <span v-else>({{ txFrequency }})</span>
                </span>
              </template>
            </template>
          </div>
          <span class="freq-unit">{{ unit }}</span>
        </div>
      </div>

      <div class="s-meter">
        <div class="s-meter-inner">
          <template v-for="(majorTick, index) in majorTicks" :key="'major-' + index">
            <div class="tick major-tick">
              <div class="tick-label">{{ majorTick.label }}</div>
              <div class="tick-line"></div>
            </div>

            <template
              v-for="(minorTick, minorIndex) in smeterHelper.generateMinorTicks(index)"
              :key="'minor-' + index + '-' + minorIndex"
            >
              <div class="tick minor-tick">
                <div class="tick-box" :style="{ background: minorTick.color }"></div>
              </div>
            </template>
          </template>
        </div>
      </div>

      <div class="rig-mode-badges">
        <template v-for="mode in rigStore.modes" :key="mode.value">
          <input
            type="radio"
            :id="'mode-' + mode.value.toLowerCase()"
            :value="mode.value"
            v-model="selectedMode"
            name="rig-mode"
          />
          <label :for="'mode-' + mode.value.toLowerCase()" class="mode-badge">
            {{ mode.label }}
          </label>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.split-btn {
  background: transparent;
  border: 1px solid var(--gray-color);
  padding: 0.2rem 0.5rem;
  color: var(--gray-color);
  cursor: pointer;
  border-radius: 3px;
}

.split-btn.active {
  background: var(--main-color);
  color: #000;
}

/* Mode badges */
.rig-mode-badges {
  display: inline-flex;
  gap: 0.5rem;
}

.rig-mode-badges input[type='radio'] {
  display: none;
}

.mode-badge {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  background: #444;
  color: var(--gray-color);
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.9rem;
  text-transform: uppercase;
  border: 1px solid var(--main-color);
}

.rig-mode-badges input[type='radio']:checked + .mode-badge {
  background: var(--main-color);
  color: #000;
}

/* Center: freq + s-meter */
.header-center.freq-s-meter {
  display: flex;
  flex-direction: column;
  text-align: center;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
}

/* Additional container below the title if needed */
.freq-s-meter-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.freq-controls {
  display: flex;
  gap: 0.5rem;
  margin: 0.5rem 0;
}

.freq-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.rig-frequency {
  font-size: 3rem;
  font-weight: bold;
  color: #ffffff;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.freq-main {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.tx-freq {
  font-size: 1.5rem;
  color: var(--main-color);
  cursor: pointer;
}

.freq-unit {
  font-size: 2rem;
}

.freq-input {
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  text-align: right;
  width: 140px;
  font-size: 3rem;
  font-weight: bold;
}

/* S-meter */
.s-meter {
  display: inline-block;
  position: relative;
  vertical-align: middle;
}

.s-meter::before,
.s-meter::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: #fff;
}

.s-meter::before {
  top: 4px;
}

.s-meter::after {
  bottom: 5px;
}

.s-meter-inner {
  display: inline-flex;
  align-items: flex-end;
  padding: 4px;
}

.tick {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.tick-label {
  position: absolute;
  top: -15px;
  transform: translateY(-110%);
  font-size: 0.8rem;
  color: #fff;
  white-space: nowrap;
}

.tick-line {
  position: absolute;
  top: -15px;
  width: 1px;
  height: 4px;
  left: 50%;
  background: white;
}

.tick-box {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: gray;
  margin-top: auto;
  margin-right: 1px;
}
</style>
