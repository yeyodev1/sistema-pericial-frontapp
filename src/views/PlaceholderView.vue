<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const title = String(route.name || 'Módulo')
</script>

<template>
  <div class="placeholder-view">
    <div class="placeholder-card">
      <i class="fa-solid fa-screwdriver-wrench"></i>
      <h1 class="text-title">{{ title }}</h1>
      <p class="text-body">
        Este módulo está en desarrollo. Próximamente estará disponible.
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.placeholder-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.placeholder-card {
  background-color: $bg-surface;
  border: 1px solid $border-color;
  border-radius: 1rem;
  padding: 3rem;
  text-align: center;
  max-width: 420px;

  i {
    font-size: 2.5rem;
    color: $text-muted;
    margin-bottom: 1rem;
  }

  h1 {
    margin: 0 0 0.5rem 0;
  }

  p {
    margin: 0;
  }
}
</style>
