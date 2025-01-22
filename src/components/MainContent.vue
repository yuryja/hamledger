<script lang="ts">
import AppHeader from './AppHeader.vue'
import QsoPanel from './QsoPanel.vue'
import LogArea from './LogArea.vue'

export default {
  name: 'MainContent',
  components: {
    AppHeader,
    QsoPanel,
    LogArea
  }
}
</script>

<template>
  <div class="main-content">
    <AppHeader />
    <QsoPanel />
    <LogArea />
  </div>
</template>
