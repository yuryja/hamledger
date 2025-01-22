<script setup lang="ts">
import Sidebar from './components/Sidebar.vue'
import MainContent from './components/MainContent.vue'
</script>

<template>
  <div class="app-container">
    <Sidebar />
    <MainContent />
  </div>
</template>

<style>
@import './assets/styles.css';

.app-container {
  display: flex;
  min-height: 100vh;
}
</style>
