<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import DatePicker from '@/components/DatePicker.vue'
import { sorteoService } from '@/services/sorteo.service'
import { peritoService } from '@/services/perito.service'
import { useConfirm } from '@/composables/useConfirm'
import type { Sorteo, Perito, PeritoRef, SorteoEstado } from '@/types'

const sorteos = ref<Sorteo[]>([])
const peritos = ref<Perito[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const errorMessage = ref('')
const searchQuery = ref('')
const activeFilter = ref<SorteoEstado | null>(null)

const stats = ref({
  total: 0,
  asignados: 0,
  enProceso: 0,
  cerrados: 0,
})

const hasSorteos = computed(() => sorteos.value.length > 0)

const estados: SorteoEstado[] = [
  'ASIGNADO',
  'EN_PROCESO',
  'DILIGENCIA_PROGRAMADA',
  'INFORME_ENTREGADO',
  'FACTURADO',
  'CERRADO',
]

const materias = [
  'CIVIL',
  'FAMILIA',
  'INQUILINATO',
  'LABORAL',
  'PENAL',
  'TRANSITO',
  'CONTENCIOSO',
]

const today = new Date().toISOString().split('T')[0] || ''
const form = ref<Record<string, string>>({
  numeroJuicio: '',
  actor: '',
  demandado: '',
  tipoMateria: '',
  estado: 'ASIGNADO',
  fechaAsignacion: today,
  juzgado: '',
  juez: '',
  peritoId: '',
  observaciones: '',
})

const selectedPerito = computed({
  get: () => {
    const id = form.value.peritoId
    if (!id) return null
    return peritos.value.find((p) => p._id === id) || null
  },
  set: (val: Perito | null) => {
    form.value.peritoId = val?._id || ''
  },
})

function peritoLabel(p: Perito): string {
  return `${p.nombres} ${p.apellidos} — ${p.ruc}`
}

function peritoDisplay(pid: string | PeritoRef | null | undefined): string {
  if (!pid) return '—'
  if (typeof pid === 'object') return `${pid.nombres} ${pid.apellidos}`
  return pid
}

const filteredSorteos = computed(() => {
  let result = sorteos.value

  if (activeFilter.value) {
    result = result.filter((s) => s.estado === activeFilter.value)
  }

  const q = searchQuery.value.toLowerCase()
  if (q) {
    result = result.filter(
      (s) =>
        s.numeroJuicio.toLowerCase().includes(q) ||
        s.actor.toLowerCase().includes(q) ||
        s.demandado.toLowerCase().includes(q)
    )
  }

  return result
})

function setFilter(estado: SorteoEstado | null) {
  activeFilter.value = activeFilter.value === estado ? null : estado
}

async function loadStats() {
  try {
    stats.value = await sorteoService.getStats()
  } catch {
    // stats stay at 0
  }
}

async function loadSorteos() {
  loading.value = true
  try {
    const data = await sorteoService.findAll()
    sorteos.value = data
    await loadStats()
  } catch {
    sorteos.value = []
  } finally {
    loading.value = false
  }
}

async function loadPeritos() {
  try {
    peritos.value = await peritoService.findAll()
  } catch {
    peritos.value = []
  }
}

function openCreate() {
  isEditing.value = false
  form.value = {
    numeroJuicio: '',
    actor: '',
    demandado: '',
    tipoMateria: '',
    estado: 'ASIGNADO',
    fechaAsignacion: today,
    juzgado: '',
    juez: '',
    peritoId: '',
    observaciones: '',
  }
  dialogVisible.value = true
}

function openEdit(sorteo: Sorteo) {
  isEditing.value = true
  const raw = { ...sorteo } as Record<string, unknown>
  const f: Record<string, string> = {}
  for (const key of ['numeroJuicio', 'actor', 'demandado', 'tipoMateria', 'estado', 'fechaAsignacion', 'juzgado', 'juez', 'observaciones', '_id', 'peritoId'] as const) {
    const v = raw[key]
    if (key === 'peritoId' && v && typeof v === 'object') {
      f.peritoId = (v as PeritoRef)._id
    } else {
      f[key] = typeof v === 'string' ? v : ''
    }
  }
  form.value = f
  dialogVisible.value = true
}

async function saveSorteo() {
  errorMessage.value = ''
  try {
    const payload: Record<string, string> = {}
    for (const key of Object.keys(form.value)) {
      if (key !== '_id' && form.value[key]) {
        payload[key] = form.value[key]
      }
    }

    if (isEditing.value && form.value._id) {
      await sorteoService.update(form.value._id, payload)
    } else {
      await sorteoService.create(payload as unknown as Omit<Sorteo, '_id'>)
    }
    dialogVisible.value = false
    await loadSorteos()
  } catch (error: unknown) {
    const apiError = error as { message?: string; data?: { message?: string } }
    errorMessage.value = apiError.data?.message || apiError.message || 'Error al guardar'
  }
}

const { confirm: confirmDelete } = useConfirm()

async function removeSorteo(id: string) {
  const ok = await confirmDelete({ message: '¿Estás seguro de eliminar este sorteo? Esta acción no se puede deshacer.' })
  if (!ok) return
  try {
    await sorteoService.remove(id)
    await loadSorteos()
  } catch (error) {
    console.error(error)
  }
}

const estadoSeverity: Record<string, 'info' | 'warn' | 'success' | 'danger' | 'secondary' | 'contrast'> = {
  ASIGNADO: 'info',
  EN_PROCESO: 'warn',
  DILIGENCIA_PROGRAMADA: 'info',
  INFORME_ENTREGADO: 'success',
  FACTURADO: 'success',
  CERRADO: 'secondary',
}

const estadoLabels: Record<string, string> = {
  ASIGNADO: 'Asignado',
  EN_PROCESO: 'En Proceso',
  DILIGENCIA_PROGRAMADA: 'Diligencia Programada',
  INFORME_ENTREGADO: 'Informe Entregado',
  FACTURADO: 'Facturado',
  CERRADO: 'Cerrado',
}

const statsConfig = [
  { key: null as SorteoEstado | null, icon: 'fa-solid fa-gavel', class: 'total', label: 'Total', valueKey: 'total' as const },
  { key: 'EN_PROCESO' as SorteoEstado, icon: 'fa-solid fa-spinner', class: 'active', label: 'En Proceso', valueKey: 'enProceso' as const },
  { key: 'DILIGENCIA_PROGRAMADA' as SorteoEstado, icon: 'fa-solid fa-calendar-check', class: 'scheduled', label: 'Diligencia Programada', valueKey: 'enProceso' as const },
  { key: 'INFORME_ENTREGADO' as SorteoEstado, icon: 'fa-solid fa-file-lines', class: 'reported', label: 'Informe Entregado', valueKey: 'enProceso' as const },
  { key: 'CERRADO' as SorteoEstado, icon: 'fa-solid fa-check-circle', class: 'done', label: 'Cerrados', valueKey: 'cerrados' as const },
  { key: 'ASIGNADO' as SorteoEstado, icon: 'fa-solid fa-file-invoice-dollar', class: 'billing', label: 'Asignados', valueKey: 'asignados' as const },
]

onMounted(async () => {
  await Promise.all([loadSorteos(), loadPeritos()])
})
</script>

<template>
  <div class="sorteos-view">
    <div class="page-header">
      <div>
        <span class="text-small">Gestión</span>
        <h1 class="text-title">Sorteos</h1>
        <p class="text-body">{{ stats.total }} sorteos registrados</p>
      </div>
      <div class="header-actions">
        <span class="p-input-icon-left search-input">
          <i class="fa-solid fa-search" />
          <InputText v-model="searchQuery" placeholder="Buscar sorteo..." />
        </span>
        <Button label="Nuevo sorteo" icon="fa-solid fa-plus" size="large" @click="openCreate" />
      </div>
    </div>

    <div class="stats-grid">
      <button
        v-for="sc in statsConfig"
        :key="sc.label"
        class="stat-card"
        :class="{ active: activeFilter === sc.key }"
        @click="setFilter(sc.key)"
      >
        <i class="stat-icon" :class="[sc.icon, sc.class]"></i>
        <div class="stat-info">
          <span class="stat-value">{{ stats[sc.valueKey] }}</span>
          <span class="stat-label">{{ sc.label }}</span>
        </div>
      </button>
    </div>

    <div v-if="!hasSorteos && !loading" class="empty-state">
      <div class="empty-icon">
        <i class="fa-solid fa-gavel"></i>
      </div>
      <h2 class="empty-title">Aún no hay sorteos registrados</h2>
      <p class="empty-text">
        Crea tu primer sorteo para comenzar a gestionar las asignaciones judiciales.
        Lleva el control completo del ciclo de vida: desde la asignación hasta el cierre.
      </p>
      <Button
        label="Crear primer sorteo"
        icon="fa-solid fa-plus"
        size="large"
        class="empty-cta"
        @click="openCreate"
      />
    </div>

    <div v-if="hasSorteos" class="data-card">
      <DataTable :value="filteredSorteos" :loading="loading" paginator :rows="10" striped-rows :global-filter-fields="['numeroJuicio', 'actor', 'demandado']">
        <Column field="numeroJuicio" header="N. Juicio" sortable />
        <Column field="actor" header="Actor" sortable />
        <Column field="demandado" header="Demandado" sortable />
        <Column field="tipoMateria" header="Materia" sortable />
        <Column header="Perito Asignado">
          <template #body="{ data }">
            <span>{{ peritoDisplay(data.peritoId) }}</span>
          </template>
        </Column>
        <Column header="Estado">
          <template #body="{ data }">
            <div class="estado-cell">
              <span class="estado-dot" :class="'dot-' + (estadoSeverity[data.estado] || 'info')"></span>
              <Tag :severity="estadoSeverity[data.estado] || 'info'" :value="estadoLabels[data.estado] || data.estado" />
            </div>
          </template>
        </Column>
        <Column field="fechaAsignacion" header="Fecha" sortable />
        <Column header="Acciones">
          <template #body="{ data }">
            <div class="actions">
              <Button icon="fa-solid fa-pen" text rounded @click="openEdit(data)" />
              <Button icon="fa-solid fa-trash" text rounded severity="danger" @click="removeSorteo(data._id!)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="dialogVisible" :header="isEditing ? 'Editar sorteo' : 'Nuevo sorteo'" modal :style="{ width: '36rem' }">
      <div class="form-grid">
        <Message v-if="errorMessage" severity="error" class="w-full">{{ errorMessage }}</Message>

        <div class="field">
          <label>Número de Juicio</label>
          <InputText v-model="form.numeroJuicio" fluid />
        </div>
        <div class="field">
          <label>Tipo de Materia</label>
          <Select :value="form.tipoMateria" @update:model-value="(v) => { if (typeof v === 'string') form.tipoMateria = v }" :options="materias" placeholder="Seleccionar" fluid />
        </div>
        <div class="field">
          <label>Actor</label>
          <InputText v-model="form.actor" fluid />
        </div>
        <div class="field">
          <label>Demandado</label>
          <InputText v-model="form.demandado" fluid />
        </div>
        <div class="field">
          <label>Juzgado</label>
          <InputText v-model="form.juzgado" fluid />
        </div>
        <div class="field">
          <label>Juez</label>
          <InputText v-model="form.juez" fluid />
        </div>
        <div class="field">
          <label>Perito Asignado</label>
          <Select v-model="selectedPerito" :options="peritos" option-label="nombres" placeholder="Seleccionar perito..." filter fluid>
            <template #value="slotProps">
              <span v-if="slotProps.value">{{ peritoLabel(slotProps.value) }}</span>
              <span v-else class="placeholder-text">Seleccionar perito...</span>
            </template>
            <template #option="slotProps">
              <span>{{ peritoLabel(slotProps.option) }}</span>
            </template>
          </Select>
        </div>
        <div class="field">
          <label>Fecha de Asignación</label>
          <DatePicker v-model="form.fechaAsignacion" />
        </div>
        <div class="field">
          <label>Estado</label>
          <Select :value="form.estado" @update:model-value="(v) => { if (typeof v === 'string') form.estado = v }" :options="estados" placeholder="Seleccionar" fluid />
        </div>
        <div class="field full-width">
          <label>Observaciones</label>
          <Textarea v-model="form.observaciones" rows="3" fluid />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text @click="dialogVisible = false" />
        <Button label="Guardar" @click="saveSorteo" />
      </template>
    </Dialog>
  </div>
</template>

<style lang="scss" scoped>
.sorteos-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;

  h1 { margin: 0; }

  .text-body {
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
    color: $text-secondary;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.search-input {
  :deep(input) {
    width: 220px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
}

.stat-card {
  all: unset;
  box-sizing: border-box;
  background-color: $bg-surface;
  border: 1px solid $border-color;
  border-radius: 0.875rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: rgba($primary, 0.3);
  }

  &.active {
    border-color: $primary;
    box-shadow: 0 0 0 1px $primary;
    background-color: rgba($primary, 0.03);
  }

  .stat-icon {
    font-size: 1.5rem;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.75rem;

    &.total {
      background-color: rgba($primary, 0.1);
      color: $primary;
    }
    &.active {
      background-color: rgba(#f59e0b, 0.1);
      color: #f59e0b;
    }
    &.scheduled {
      background-color: rgba(#8b5cf6, 0.1);
      color: #8b5cf6;
    }
    &.reported {
      background-color: rgba(#06b6d4, 0.1);
      color: #06b6d4;
    }
    &.done {
      background-color: rgba(#10b981, 0.1);
      color: #10b981;
    }
    &.billing {
      background-color: rgba(#6366f1, 0.1);
      color: #6366f1;
    }
  }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: $text-primary;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.8125rem;
    color: $text-secondary;
    margin-top: 0.25rem;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  background-color: $bg-surface;
  border: 1px dashed $border-color;
  border-radius: 1.25rem;
  min-height: 360px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba($primary, 0.06);
  border: 1px solid rgba($primary, 0.12);
  border-radius: 1.25rem;
  margin-bottom: 1.5rem;

  i {
    font-size: 2rem;
    color: $primary;
  }
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 0.5rem 0;
}

.empty-text {
  font-size: 0.9375rem;
  color: $text-secondary;
  margin: 0 0 1.5rem 0;
  max-width: 400px;
  line-height: 1.6;
}

.empty-cta {
  min-width: 200px;
}

.data-card {
  background-color: $bg-surface;
  border: 1px solid $border-color;
  border-radius: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.estado-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.estado-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  flex-shrink: 0;

  &.dot-info { background-color: var(--p-info-color, #3b82f6); }
  &.dot-warn { background-color: var(--p-warn-color, #f59e0b); }
  &.dot-success { background-color: var(--p-success-color, #10b981); }
  &.dot-danger { background-color: var(--p-danger-color, #ef4444); }
  &.dot-secondary { background-color: #6b7280; }
}

.actions {
  display: flex;
  gap: 0.25rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-size: 0.875rem;
      font-weight: 600;
      color: $text-primary;
    }

    &.full-width {
      grid-column: 1 / -1;
    }
  }
}

.w-full {
  grid-column: 1 / -1;
}

.placeholder-text {
  color: #9ca3af;
}

@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
  .search-input :deep(input) { width: 100%; }
  .header-actions { flex-wrap: wrap; }
}
</style>
