<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { accessLogService } from '@/services/access-log.service'
import type { AccessLog } from '@/types'

const logs = ref<AccessLog[]>([])
const loading = ref(false)
const filtroAccion = ref('')
const filtroEmail = ref('')

const accionLabels: Record<string, string> = {
  LOGIN: 'Inicio de sesión', LOGIN_FAILED: 'Intento fallido', LOGOUT: 'Cierre de sesión', ACCESS_BLOCKED: 'Acceso bloqueado',
}

const accionSeverity: Record<string, 'success' | 'danger' | 'warn' | 'contrast'> = {
  LOGIN: 'success', LOGIN_FAILED: 'danger', LOGOUT: 'warn', ACCESS_BLOCKED: 'contrast',
}

const resultadoLabels: Record<string, string> = { EXITOSO: 'Exitoso', FALLIDO: 'Fallido', BLOQUEADO: 'Bloqueado' }
const resultadoSeverity: Record<string, 'success' | 'danger' | 'contrast'> = { EXITOSO: 'success', FALLIDO: 'danger', BLOQUEADO: 'contrast' }

async function loadLogs() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filtroAccion.value) params.accion = filtroAccion.value
    if (filtroEmail.value) params.email = filtroEmail.value
    logs.value = await accessLogService.findAll(params)
  } catch { /* handled */ }
  finally { loading.value = false }
}

onMounted(loadLogs)
</script>

<template>
  <div class="access-log-view">
    <div class="page-header">
      <div>
        <span class="text-small">Fase 7</span>
        <h1 class="text-title">Registro de Accesos</h1>
        <p class="text-body">Auditoría de intentos de inicio de sesión y accesos al sistema</p>
      </div>
    </div>

    <div class="filters-bar">
      <span class="p-input-icon-left">
        <i class="fa-solid fa-search" />
        <InputText v-model="filtroEmail" placeholder="Buscar por email..." @update:model-value="loadLogs" />
      </span>
      <Select v-model="filtroAccion" :options="['', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'ACCESS_BLOCKED']" placeholder="Todas las acciones" class="filter-select" @update:model-value="loadLogs">
        <template #value>
          <span v-if="filtroAccion">{{ accionLabels[filtroAccion] }}</span>
          <span v-else class="text-secondary">Todas las acciones</span>
        </template>
      </Select>
    </div>

    <div class="data-card">
      <DataTable :value="logs" :loading="loading" paginator :rows="25" striped-rows sort-field="createdAt" :sort-order="-1">
        <Column field="createdAt" header="Fecha" sortable>
          <template #body="{ data }">{{ new Date(data.createdAt).toLocaleString('es-EC') }}</template>
        </Column>
        <Column field="email" header="Email" sortable />
        <Column header="Acción">
          <template #body="{ data }">
            <Tag :severity="accionSeverity[data.accion] || 'info'">{{ accionLabels[data.accion] || data.accion }}</Tag>
          </template>
        </Column>
        <Column header="Resultado">
          <template #body="{ data }">
            <Tag :severity="resultadoSeverity[data.resultado] || 'info'">{{ resultadoLabels[data.resultado] || data.resultado }}</Tag>
          </template>
        </Column>
        <Column field="ip" header="IP" />
      </DataTable>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.access-log-view { display: flex; flex-direction: column; gap: 1.5rem; }

.page-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
  h1 { margin: 0 0 0.25rem 0; }
  .text-body { margin: 0; font-size: 0.875rem; color: $text-secondary; }
}

.filters-bar {
  display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;
  .filter-select { min-width: 200px; }
}

.data-card {
  background-color: $bg-surface; border: 1px solid $border-color;
  border-radius: 1rem; padding: 1rem; overflow: hidden;
}
</style>
