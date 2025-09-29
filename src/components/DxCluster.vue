<script lang="ts">
export default {
  name: 'DxCluster'
}
</script>

<template>
  <div class="dx-cluster">
    <h2 class="section-title">DX Cluster</h2>
    <div class="dx-cluster-content">
      <!-- DX Cluster content will go here -->
    </div>
  </div>
</template>

<style scoped>
.dx-cluster {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-lighter);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
  padding: 1rem
}


.dx-cluster-content {
  flex: 1;
  padding: var(--spacing-md);
  overflow-y: auto;
  color: var(--text-primary);
}
</style>
