<script lang="ts">
export default {
  name: 'AwardsPage',
};
</script>

<template>
  <main class="awards-container">
    <div class="awards-header">
      <h2 class="section-title">Awards and Statistics</h2>
    </div>
    <div class="awards-content">
      <div class="not-available-message">Not yet available</div>
    </div>
  </main>
</template>

<style scoped>
.awards-container {
  background: #333;
  border-radius: 5px;
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.awards-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.awards-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.not-available-message {
  color: var(--gray-color);
  font-size: 1.2rem;
  text-align: center;
}
</style>
