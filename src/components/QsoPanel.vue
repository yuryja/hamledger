<script setup lang="ts">
import { ref } from 'vue'
import QsoInput from './qso/QsoInput.vue'
import RemoteStation from './qso/RemoteStation.vue'
</script>

<template>
  <div class="qso-panel">
    <QsoInput />
    <RemoteStation />
  </div>
</template>
