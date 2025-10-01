<script lang="ts">
import SideBar from './components/SideBar.vue';
import MainContent from './components/MainContent.vue';
import SetupWizard from './components/SetupWizard.vue';
import { useQsoStore } from './store/qso';
import { configHelper } from './utils/configHelper';

export default {
  name: 'App',
  components: {
    SideBar,
    MainContent,
    SetupWizard,
  },
  data() {
    return {
      showSetupWizard: false,
      isInitialized: false,
    };
  },
  async mounted() {
    await this.checkInitialSetup();

    if (!this.showSetupWizard) {
      const qsoStore = useQsoStore();
      await qsoStore.init();
    }

    this.isInitialized = true;
  },
  methods: {
    async checkInitialSetup() {
      try {
        await configHelper.initSettings();
        // If we get here without error, settings exist
        this.showSetupWizard = false;
      } catch {
        // Settings don't exist or failed to load, show wizard
        console.log('No settings found, showing setup wizard');
        this.showSetupWizard = true;
      }
    },
    async onSetupComplete() {
      this.showSetupWizard = false;

      // Initialize config helper with new settings
      await configHelper.initSettings();

      // Initialize QSO store
      const qsoStore = useQsoStore();
      await qsoStore.init();
    },
  },
};
</script>

<template>
  <div class="app-container">
    <template v-if="isInitialized">
      <SideBar
        v-if="!showSetupWizard"
        ##AI! Property 'handleViewChange' does not exist on type '{}'.
        @view-change="view => $refs.mainContent?.handleViewChange(view)"
      />
      <MainContent v-if="!showSetupWizard" ref="mainContent" />
      <SetupWizard v-if="showSetupWizard" @complete="onSetupComplete" />
    </template>
    <div v-else class="loading-container">
      <p>Loading...</p>
    </div>
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

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: var(--gray-color);
  font-size: 1.2rem;
}
</style>
