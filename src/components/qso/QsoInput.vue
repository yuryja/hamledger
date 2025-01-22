<script setup lang="ts">
import { ref } from 'vue'

interface QsoForm {
  callsign: string;
  band: string;
  mode: string;
  rstr: string;
  rstr2: string;
  date: string;
  utc: string;
  remark: string;
  notes: string;
}

const qsoForm = ref<QsoForm>({
  callsign: '',
  band: '40m',
  mode: 'CW',
  rstr: '',
  rstr2: '',
  date: '',
  utc: '',
  remark: '',
  notes: ''
});

const bands = [
  { value: '10m', label: '10 m' },
  { value: '20m', label: '20 m' },
  { value: '40m', label: '40 m' }
];

const modes = [
  { value: 'CW', label: 'CW' },
  { value: 'SSB', label: 'SSB' }
];

const handleAddQso = () => {
  console.log('Adding QSO:', qsoForm.value);
  // Implement QSO addition logic
};
</script>

<template>
  <section class="qso_input_area">
    <h2 class="section-title">QSO Input</h2>
    <div class="qso-input-content">
      <div class="qso-input-group">
        <label for="callsign">Callsign</label>
        <input type="text" id="callsign" v-model="qsoForm.callsign" placeholder="HA5XB" />
      </div>
      
      <div class="qso-input-group">
        <label for="band">Band</label>
        <select id="band" v-model="qsoForm.band">
          <option v-for="band in bands" :key="band.value" :value="band.value">
            {{ band.label }}
          </option>
        </select>
      </div>
      
      <div class="qso-input-group">
        <label for="mode">Mode</label>
        <select id="mode" v-model="qsoForm.mode">
          <option v-for="mode in modes" :key="mode.value" :value="mode.value">
            {{ mode.label }}
          </option>
        </select>
      </div>
      
      <div class="qso-input-group small">
        <label for="rstr">RSTr</label>
        <input type="text" id="rstr" v-model="qsoForm.rstr" placeholder="59" />
      </div>
      
      <div class="qso-input-group small">
        <label for="rstr2">RSTr</label>
        <input type="text" id="rstr2" v-model="qsoForm.rstr2" placeholder="59" />
      </div>
      
      <div class="qso-input-group small">
        <label for="date">Date</label>
        <input type="text" id="date" v-model="qsoForm.date" placeholder="22/12/2022" />
      </div>
      
      <div class="qso-input-group small">
        <label for="utc">UTC</label>
        <input type="text" id="utc" v-model="qsoForm.utc" placeholder="13:33:12" />
      </div>
      
      <div class="qso-input-group">
        <label for="remark">Remark</label>
        <input type="text" id="remark" v-model="qsoForm.remark" placeholder="e.g. CQ Test" />
      </div>
      
      <div class="qso-input-group">
        <label for="notes">Notes</label>
        <textarea id="notes" v-model="qsoForm.notes" rows="2" placeholder="Additional info"></textarea>
      </div>

      <button class="add-qso-btn" @click="handleAddQso">Add QSO</button>
    </div>
  </section>
</template>
