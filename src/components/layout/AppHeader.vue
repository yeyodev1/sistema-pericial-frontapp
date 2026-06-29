<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Avatar from 'primevue/avatar'
import Select from 'primevue/select'
import { useUserStore } from '@/stores/user'
import { usePeritoWorkspaceStore } from '@/stores/peritoWorkspace'
import { useSidebar } from '@/composables/useSidebar'

const route = useRoute()
const userStore = useUserStore()
const peritoWorkspace = usePeritoWorkspaceStore()
const { toggle: toggleSidebar } = useSidebar()

peritoWorkspace.hydrate()

const pageTitles: Record<string, string> = {
  Dashboard: 'Panel de Control',
  Sorteos: 'Sorteos',
  Peritos: 'Peritos',
  Catalogos: 'Catálogos',
  Facturacion: 'Facturación Electrónica',
  AgendaCampo: 'Agenda de Campo',
  Liquidacion: 'Liquidación',
  Configuracion: 'Configuración',
}

const pageTitle = ref(pageTitles[route.name as string] || 'Panel de Control')

watch(
  () => route.name,
  (name) => {
    pageTitle.value = pageTitles[name as string] || 'Panel de Control'
  }
)

function optionFilter(option: { nombres: string; apellidos: string; ruc: string }, query: string) {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    option.nombres.toLowerCase().includes(q) ||
    option.apellidos.toLowerCase().includes(q) ||
    option.ruc.includes(q)
  )
}

import { onMounted } from 'vue'
onMounted(() => {
  if (peritoWorkspace.peritos.length === 0) {
    peritoWorkspace.loadPeritos()
  }
})
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <button class="menu-toggle" aria-label="Menú" @click="toggleSidebar">
        <i class="fa-solid fa-bars"></i>
      </button>
      <span class="page-title">{{ pageTitle }}</span>
    </div>

    <div class="header-right">
      <div v-if="userStore.role !== 'PERITO'" class="perito-selector">
        <div class="perito-selector-inner">
          <Select
            v-model="peritoWorkspace.selected"
            :options="peritoWorkspace.peritos"
            option-label="nombres"
            placeholder="Seleccionar perito..."
            filter
            :filter-function="optionFilter"
            :loading="peritoWorkspace.loading"
            class="perito-dropdown"
            @update:model-value="peritoWorkspace.select"
            show-clear
          >
            <template #value="slotProps">
              <div v-if="slotProps.value" class="selected-option">
                <Avatar
                  :label="(slotProps.value.nombres?.charAt(0) || '') + (slotProps.value.apellidos?.charAt(0) || '')"
                  size="small"
                  shape="circle"
                  class="perito-avatar"
                />
                <div class="selected-info">
                  <span class="selected-name">{{ slotProps.value.nombres }} {{ slotProps.value.apellidos }}</span>
                  <span class="selected-ruc">{{ slotProps.value.ruc }}</span>
                </div>
              </div>
              <div v-else class="selected-option placeholder">
                <i class="fa-solid fa-user-tie"></i>
                <span class="selected-name placeholder-text">Seleccionar perito...</span>
              </div>
            </template>
            <template #option="slotProps">
              <div class="option-item">
                <Avatar
                  :label="(slotProps.option.nombres?.charAt(0) || '') + (slotProps.option.apellidos?.charAt(0) || '')"
                  size="small"
                  shape="circle"
                  class="option-avatar"
                />
                <div class="option-info">
                  <span class="option-name">{{ slotProps.option.nombres }} {{ slotProps.option.apellidos }}</span>
                  <span class="option-ruc">{{ slotProps.option.ruc }}</span>
                </div>
              </div>
            </template>
            <template #header>
              <div class="dropdown-header">
                <i class="fa-solid fa-user-tie"></i>
                <span>Peritos activos</span>
              </div>
            </template>
            <template #empty>
              <div class="dropdown-empty">
                <i class="fa-solid fa-users-slash"></i>
                <span>No hay peritos disponibles</span>
              </div>
            </template>
          </Select>
        </div>
      </div>

      <div class="user-menu">
        <Avatar
          :label="userStore.name?.charAt(0) || 'U'"
          shape="circle"
          class="user-avatar"
        />
        <div class="user-info">
          <span class="user-name">{{ userStore.name || 'Usuario' }}</span>
          <span class="user-role">{{ userStore.role || 'Sin rol' }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  height: 72px;
  background-color: $bg-surface;
  border-bottom: 1px solid $border-color;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.menu-toggle {
  display: none;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid $border-color;
  border-radius: 0.625rem;
  background: none;
  color: $text-primary;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background-color: $bg-surface-secondary;
  }

  &:active {
    transform: scale(0.95);
  }
}

.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  letter-spacing: -0.01em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.perito-selector {
  .perito-selector-inner {
    display: flex;
    align-items: center;
    gap: 0;
  }

  :deep(.perito-dropdown) {
    width: 280px;

    .p-select-dropdown {
      color: $text-muted;
    }

    .p-select-label {
      padding: 0.5rem 0.75rem;
    }

    &.p-select-open .p-select-dropdown {
      color: $primary;
    }
  }

  :deep(.p-select-overlay) {
    border-radius: 0.875rem;
    margin-top: 0.375rem;
    box-shadow:
      0 10px 40px rgba(0, 0, 0, 0.08),
      0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid $border-color;
    overflow: hidden;
  }

  :deep(.p-select-filter-container) {
    padding: 0.5rem;
    border-bottom: 1px solid $border-color;

    .p-inputtext {
      border-radius: 0.5rem;
      font-size: 0.875rem;

      &:focus {
        box-shadow: none;
        border-color: $primary;
      }
    }
  }

  :deep(.p-select-list) {
    padding: 0.25rem;
  }

  :deep(.p-select-option) {
    border-radius: 0.5rem;
    padding: 0.5rem;
    margin: 0.125rem 0;
    transition: background-color 0.12s ease;

    &.p-select-option-selected {
      background-color: rgba($primary, 0.08);
      color: $text-primary;
    }

    &:hover:not(.p-select-option-selected) {
      background-color: $bg-surface-secondary;
    }
  }
}

.selected-option {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;

  &.placeholder {
    gap: 0.5rem;
    color: $text-muted;

    i {
      font-size: 0.9375rem;
      color: $text-muted;
    }
  }

  .perito-avatar {
    flex-shrink: 0;
  }

  :deep(.perito-avatar) {
    background-color: $primary !important;
    color: $white !important;
    font-weight: 600;
    font-size: 0.75rem;
    width: 32px;
    height: 32px;
  }

  .selected-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.2;
  }

  .selected-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &.placeholder-text {
      font-weight: 400;
      color: $text-muted;
      font-size: 0.875rem;
    }
  }

  .selected-ruc {
    font-size: 0.6875rem;
    color: $text-muted;
    font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
    letter-spacing: 0.02em;
  }
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;

  .option-avatar {
    flex-shrink: 0;
    background-color: $primary !important;
    color: $white !important;
    font-weight: 600;
    font-size: 0.75rem;
    width: 32px;
    height: 32px;
  }

  .option-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.2;
  }

  .option-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .option-ruc {
    font-size: 0.6875rem;
    color: $text-muted;
    font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
    letter-spacing: 0.02em;
  }
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $text-muted;
  border-bottom: 1px solid $border-color;
  background-color: $bg-surface;

  i {
    font-size: 0.75rem;
  }
}

.dropdown-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: $text-muted;
  font-size: 0.875rem;

  i {
    font-size: 1.5rem;
    color: $gray-300;
  }
}

:deep(.p-select-clear-icon) {
  font-size: 0.75rem;
  color: $text-muted;

  &:hover {
    color: $text-primary;
  }
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

:deep(.user-avatar) {
  background-color: $primary !important;
  color: $white !important;
  font-weight: 600;
}

.user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.25;

  .user-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: $text-primary;
  }

  .user-role {
    font-size: 0.75rem;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 1rem;
    height: 64px;
  }

  .menu-toggle {
    display: flex;
  }

  .perito-selector {
    :deep(.perito-dropdown) {
      width: 160px;
    }
  }

  .user-info {
    display: none;
  }

  .selected-option {
    .selected-name {
      font-size: 0.8125rem;
    }
    .selected-ruc {
      display: none;
    }
  }

  .option-item {
    .option-ruc {
      display: none;
    }
  }
}

@media (max-width: 480px) {
  .perito-selector {
    :deep(.perito-dropdown) {
      width: 120px;
    }

    .selected-option .selected-name {
      font-size: 0.75rem;
    }
  }
}
</style>
