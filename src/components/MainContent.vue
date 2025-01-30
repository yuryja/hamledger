<script lang="ts">
import { ref } from 'vue'
import AppHeader from './AppHeader.vue'
import QsoPanel from './QsoPanel.vue'
import LogArea from './LogArea.vue'
import LogBook from './LogBook.vue'
import ConfigView from './ConfigView.vue'

export default {
  name: 'MainContent',
  components: {
    AppHeader,
    QsoPanel,
    LogArea,
    LogBook,
    ConfigView
  },
  setup() {
    const currentView = ref('qso')
    return { currentView }
  },
  methods: {
    handleViewChange(view: string) {
      this.currentView = view;
    }
  }
}
</script>

<template>
  <div class="main-content">
    <template v-if="currentView === 'qso'">
      <div class="qso-layout">
        <AppHeader />
        <QsoPanel />
        <LogArea />
      </div>
    </template>
    <LogBook v-else-if="currentView === 'logbook'" />
    <ConfigView v-else-if="currentView === 'settings'" />
  </div>
</template>

<style scoped>
.main-content {
  margin-left: 60px;
  height: 100vh;
  overflow: hidden;
}

.qso-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.qso-layout :deep(> *:last-child) {
  flex: 1;
  min-height: 0;
}
</style>
