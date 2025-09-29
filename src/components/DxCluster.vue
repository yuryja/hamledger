<script lang="ts">
export default {
  name: 'DxCluster'
}
</script>

<template>
  <div class="dx-cluster">
    <div class="dx-cluster-header">
      <h3>DX Cluster</h3>
    </div>
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
}

.dx-cluster-header {
  padding: var(--spacing-md);
  background: var(--bg-darker);
  border-bottom: 1px solid var(--border-color);
}

.dx-cluster-header h3 {
  margin: 0;
  color: var(--main-color);
  font-size: var(--font-size-lg);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dx-cluster-content {
  flex: 1;
  padding: var(--spacing-md);
  overflow-y: auto;
  color: var(--text-primary);
}
</style>
