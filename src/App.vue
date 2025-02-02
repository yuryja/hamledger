<script lang="ts">
import SideBar from './components/SideBar.vue'
import MainContent from './components/MainContent.vue'
import { useQsoStore } from './store/qso'

export default {
  name: 'App',
  components: {
    SideBar,
    MainContent
  },
  async mounted() {
    const qsoStore = useQsoStore()
    await qsoStore.init()
  }
}
</script>

<template>
  <div class="app-container">
    <SideBar @view-change="(view) => $refs.mainContent?.handleViewChange(view)" />
    <MainContent ref="mainContent" />
  </div>
</template>

<style>
@import './assets/styles.css';

.app-container {
  display: flex;
  height: 100vh;
  padding: 1rem;
  box-sizing: border-box;
}
</style>
