<script setup lang="ts">
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
</script>

<template>
  <div class="main-layout">
    <AppSidebar />
    <ConfirmDialog />

    <div class="layout-content">
      <AppHeader />

      <main class="page-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main-layout {
  display: flex;
  min-height: 100vh;
  background-color: $bg-body;
}

.layout-content {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.page-content {
  flex: 1;
  padding: 1.5rem;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .layout-content {
    margin-left: 0;
  }

  .page-content {
    padding: 1rem;
  }
}
</style>
