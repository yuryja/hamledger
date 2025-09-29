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
  background: var(--color-bg-secondary, #2a2a2a);
  border-radius: 8px;
  overflow: hidden;
}

.dx-cluster-header {
  padding: 1rem;
  background: var(--color-bg-tertiary, #1a1a1a);
  border-bottom: 1px solid var(--color-border, #444);
}

.dx-cluster-header h3 {
  margin: 0;
  color: var(--color-text-primary, #fff);
  font-size: 1.1rem;
}

.dx-cluster-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}
</style>
