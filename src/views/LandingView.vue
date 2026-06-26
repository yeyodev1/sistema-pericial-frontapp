<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const router = useRouter()

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="landing-view">
    <!-- Sección 1: Hero -->
    <section class="landing-section hero-section">
      <div class="section-content">
        <span class="text-small hero-tag">Plataforma interna</span>
        <h1 class="text-display hero-title">
          Sistema Pericial
        </h1>
        <p class="text-body hero-description">
          Gestión integral y contabilidad especializada para administradoras de
          peritos judiciales en Ecuador.
        </p>
        <Button
          label="Ingresar al sistema"
          icon="fa-solid fa-arrow-right"
          icon-pos="right"
          class="hero-button"
          @click="goToLogin"
        />
      </div>

      <div class="scroll-hint">
        <span class="text-small">Desplázate</span>
        <i class="fa-solid fa-arrow-down"></i>
      </div>
    </section>

    <!-- Sección 2: Acceso -->
    <section class="landing-section access-section">
      <div class="section-content">
        <span class="text-small access-tag">Acceso restringido</span>
        <h2 class="text-display access-title">
          Operación unificada
        </h2>
        <p class="text-body access-description">
          Sorteos judiciales, facturación electrónica multi-RUC, agendas de
          campo, escritos, bitácoras de cobro y liquidación de comisiones en un
          solo lugar.
        </p>
        <Button
          label="Iniciar sesión"
          icon="fa-solid fa-lock"
          icon-pos="left"
          outlined
          class="access-button"
          @click="goToLogin"
        />
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.landing-view {
  display: flex;
  flex-direction: column;
}

.landing-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
}

.section-content {
  max-width: 720px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.hero-section {
  background-color: $bg-body;
  color: $text-primary;
}

.hero-tag {
  color: $text-secondary;
}

.hero-title {
  margin: 0;
  color: $text-primary;
}

.hero-description {
  max-width: 520px;
  font-size: 1.25rem;
  margin: 0;
}

.hero-button {
  background-color: $primary !important;
  border-color: $primary !important;
  color: $white !important;
  font-weight: 600 !important;
  border-radius: 0.625rem !important;
  padding: 0.875rem 1.75rem !important;

  &:hover {
    background-color: $primary-dark !important;
    border-color: $primary-dark !important;
  }
}

.scroll-hint {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: $text-muted;
  animation: bounce 2s infinite;

  i {
    font-size: 0.875rem;
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  40% {
    transform: translateX(-50%) translateY(-8px);
  }
  60% {
    transform: translateX(-50%) translateY(-4px);
  }
}

.access-section {
  background-color: $bg-surface;
  color: $text-primary;
  border-top: 1px solid $border-color;
}

.access-tag {
  color: $text-secondary;
}

.access-title {
  margin: 0;
  color: $text-primary;
}

.access-description {
  max-width: 560px;
  font-size: 1.125rem;
  margin: 0;
}

.access-button {
  border-color: $text-primary !important;
  color: $text-primary !important;
  font-weight: 600 !important;
  border-radius: 0.625rem !important;
  padding: 0.875rem 1.75rem !important;

  &:hover {
    background-color: $primary !important;
    border-color: $primary !important;
    color: $white !important;
  }
}

@media (max-width: 768px) {
  .landing-section {
    padding: 1.5rem;
  }

  .section-content {
    gap: 1.25rem;
  }
}
</style>
