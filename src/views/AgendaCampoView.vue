<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { agendaCampoService } from '@/services/agenda-campo.service'
import { sorteoService } from '@/services/sorteo.service'
import { useConfirm } from '@/composables/useConfirm'
import type { AgendaCampo, Sorteo } from '@/types'

const diligencias = ref<AgendaCampo[]>([])
const sorteos = ref<Sorteo[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref('')
const errorMessage = ref('')
const filtroEstado = ref('')

const hasDiligencias = computed(() => diligencias.value.length > 0)

const stats = ref({ PROGRAMADA: 0, REALIZADA: 0, CANCELADA: 0, EN_CURSO: 0 })

const tiposDiligencia = ['NOTIFICACION', 'INSPECCION', 'RECEPCION', 'ENTREGA_INFORME', 'COBRO']
const estadosDiligencia = ['PROGRAMADA', 'EN_CURSO', 'REALIZADA', 'CANCELADA']

const tipoLabels: Record<string, string> = {
  NOTIFICACION: 'Notificación',
  INSPECCION: 'Inspección',
  RECEPCION: 'Recepción',
  ENTREGA_INFORME: 'Entrega de Informe',
  COBRO: 'Cobro',
}

const tipoSeverity: Record<string, 'info' | 'warn' | 'success' | 'danger' | 'contrast'> = {
  NOTIFICACION: 'info',
  INSPECCION: 'warn',
  RECEPCION: 'success',
  ENTREGA_INFORME: 'contrast',
  COBRO: 'danger',
}

const estadoLabels: Record<string, string> = {
  PROGRAMADA: 'Programada',
  EN_CURSO: 'En Curso',
  REALIZADA: 'Realizada',
  CANCELADA: 'Cancelada',
}

const estadoSeverity: Record<string, 'info' | 'success' | 'warn' | 'danger'> = {
  PROGRAMADA: 'info',
  EN_CURSO: 'warn',
  REALIZADA: 'success',
  CANCELADA: 'danger',
}

const now = new Date()
const today = now.toISOString().split('T')[0] || ''
const timeNow = now.toTimeString().split(' ')[0]?.slice(0, 5) || '08:00'

const form = ref({
  sorteoId: '',
  peritoId: '',
  fechaHora: `${today}T${timeNow}`,
  tipoDiligencia: '',
  direccion: '',
  estado: 'PROGRAMADA',
  observaciones: '',
})

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
}

function sorteoLabel(s: Sorteo): string {
  return `${s.numeroJuicio} — ${s.actor} vs ${s.demandado}`
}


async function loadDiligencias() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filtroEstado.value) params.estado = filtroEstado.value
    const data = await agendaCampoService.findAll(params)
    diligencias.value = data
    const s = { PROGRAMADA: 0, EN_CURSO: 0, REALIZADA: 0, CANCELADA: 0 }
    data.forEach((d) => { if (d.estado in s) s[d.estado as keyof typeof s]++ })
    stats.value = s
  } catch { /* handled by httpBase */ }
  finally { loading.value = false }
}

async function loadSorteos() {
  try {
    const data = await sorteoService.findAll()
    sorteos.value = data.filter((s) => s.activo !== false)
  } catch { /* handled */ }
}

onMounted(async () => {
  await Promise.all([loadDiligencias(), loadSorteos()])
})

function openCreate() {
  isEditing.value = false
  form.value = {
    sorteoId: '',
    peritoId: '',
    fechaHora: `${today}T${timeNow}`,
    tipoDiligencia: '',
    direccion: '',
    estado: 'PROGRAMADA',
    observaciones: '',
  }
  dialogVisible.value = true
}

function openEdit(d: AgendaCampo) {
  isEditing.value = true
  editingId.value = d._id
  const sorteoId = typeof d.sorteoId === 'object' ? d.sorteoId._id : d.sorteoId
  const peritoId = typeof d.peritoId === 'object' ? d.peritoId._id : d.peritoId
  const fechaHora = d.fechaHora.slice(0, 16)
  form.value = {
    sorteoId: sorteoId || '',
    peritoId: peritoId || '',
    fechaHora,
    tipoDiligencia: d.tipoDiligencia,
    direccion: d.direccion,
    estado: d.estado,
    observaciones: d.observaciones,
  }
  dialogVisible.value = true
}

async function save() {
  errorMessage.value = ''
  if (!form.value.sorteoId || !form.value.tipoDiligencia || !form.value.direccion) {
    errorMessage.value = 'Completa los campos obligatorios: sorteo, tipo y dirección'
    return
  }
  try {
    if (isEditing.value) {
      await agendaCampoService.update(editingId.value, form.value)
    } else {
      await agendaCampoService.create(form.value)
    }
    dialogVisible.value = false
    await loadDiligencias()
  } catch { /* handled */ }
}

const { confirm: confirmDelete } = useConfirm()

async function removeDiligencia(id: string) {
  const ok = await confirmDelete({ message: '¿Estás seguro de eliminar esta diligencia?' })
  if (!ok) return
  try {
    await agendaCampoService.remove(id)
    await loadDiligencias()
  } catch { /* handled */ }
}

function changeEstado(d: AgendaCampo, nuevoEstado: string) {
  agendaCampoService.update(d._id, { estado: nuevoEstado }).then(() => loadDiligencias())
}
</script>

<template>
  <div class="agenda-view">
    <div class="page-header">
      <div>
        <span class="text-small">Campo</span>
        <h1 class="text-title">Agenda de Campo</h1>
        <p class="text-body">Programación y seguimiento de diligencias judiciales en territorio</p>
      </div>
      <div class="header-actions">
        <Button label="Nueva diligencia" icon="fa-solid fa-plus" severity="warn" size="large" @click="openCreate" />
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <i class="fa-solid fa-calendar-check stat-icon scheduled"></i>
        <div class="stat-info">
          <span class="stat-value">{{ stats.PROGRAMADA }}</span>
          <span class="stat-label">Programadas</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="fa-solid fa-play stat-icon inprogress"></i>
        <div class="stat-info">
          <span class="stat-value">{{ stats.EN_CURSO }}</span>
          <span class="stat-label">En Curso</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="fa-solid fa-check-circle stat-icon done"></i>
        <div class="stat-info">
          <span class="stat-value">{{ stats.REALIZADA }}</span>
          <span class="stat-label">Realizadas</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="fa-solid fa-ban stat-icon cancelled"></i>
        <div class="stat-info">
          <span class="stat-value">{{ stats.CANCELADA }}</span>
          <span class="stat-label">Canceladas</span>
        </div>
      </div>
    </div>

    <div v-if="!hasDiligencias && !loading" class="empty-state">
      <div class="empty-icon">
        <i class="fa-solid fa-map-location-dot"></i>
      </div>
      <h2 class="empty-title">Aún no hay diligencias programadas</h2>
      <p class="empty-text">
        Programa tu primera diligencia de campo para comenzar a gestionar las actividades de los peritos en territorio.
      </p>
      <Button label="Programar primera diligencia" icon="fa-solid fa-plus" severity="warn" size="large" class="empty-cta" @click="openCreate" />
    </div>

    <div v-if="hasDiligencias" class="filters-bar">
      <span class="p-input-icon-left">
        <i class="fa-solid fa-filter" />
        <Select v-model="filtroEstado" :options="['', ...estadosDiligencia]" placeholder="Todos los estados" class="filter-select" @update:model-value="loadDiligencias">
          <template #value>
            <span v-if="filtroEstado">{{ estadoLabels[filtroEstado] || filtroEstado }}</span>
            <span v-else class="text-secondary">Todos los estados</span>
          </template>
        </Select>
      </span>
    </div>

    <div v-if="hasDiligencias" class="data-card">
      <DataTable :value="diligencias" :loading="loading" paginator :rows="15" striped-rows sort-field="fechaHora" :sort-order="-1">
        <Column field="fechaHora" header="Fecha" sortable>
          <template #body="{ data }">
            <div class="date-cell">
              <span class="date-main">{{ formatFecha(data.fechaHora) }}</span>
              <span class="date-sub">{{ formatHora(data.fechaHora) }}</span>
            </div>
          </template>
        </Column>
        <Column header="Tipo" sortable field="tipoDiligencia">
          <template #body="{ data }">
            <Tag :severity="tipoSeverity[data.tipoDiligencia] || 'info'">{{ tipoLabels[data.tipoDiligencia] || data.tipoDiligencia }}</Tag>
          </template>
        </Column>
        <Column header="Sorteo" field="sorteoId">
          <template #body="{ data }">
            <span v-if="typeof data.sorteoId === 'object'">{{ data.sorteoId.numeroJuicio }}</span>
            <span v-else>{{ data.sorteoId }}</span>
          </template>
        </Column>
        <Column field="direccion" header="Dirección" />
        <Column header="Estado">
          <template #body="{ data }">
            <Tag :severity="estadoSeverity[data.estado] || 'info'">{{ estadoLabels[data.estado] || data.estado }}</Tag>
          </template>
        </Column>
        <Column header="Acciones" style="min-width: 140px">
          <template #body="{ data }">
            <div class="actions">
              <Select v-if="data.estado !== 'CANCELADA'" v-model="data.estado" :options="['PROGRAMADA', 'EN_CURSO', 'REALIZADA', 'CANCELADA']" class="estado-select" @update:model-value="(v: string) => changeEstado(data, v)" />
              <Button icon="fa-solid fa-pen" text rounded @click="openEdit(data)" />
              <Button icon="fa-solid fa-trash" text rounded severity="danger" @click="removeDiligencia(data._id)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="dialogVisible" :header="isEditing ? 'Editar diligencia' : 'Nueva diligencia'" modal :style="{ width: '36rem' }">
      <div class="form-grid">
        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

        <div class="field full-width">
          <label>Sorteo <span class="required">*</span></label>
          <Select v-model="form.sorteoId" :options="sorteos" option-value="_id" :option-label="sorteoLabel" placeholder="Seleccionar sorteo" filter fluid />
        </div>
        <div class="field">
          <label>Tipo de diligencia <span class="required">*</span></label>
          <Select v-model="form.tipoDiligencia" :options="tiposDiligencia" placeholder="Seleccionar" fluid>
            <template #value>
              <span v-if="form.tipoDiligencia">{{ tipoLabels[form.tipoDiligencia] }}</span>
              <span v-else class="text-secondary">Seleccionar</span>
            </template>
          </Select>
        </div>
        <div class="field">
          <label>Estado</label>
          <Select v-model="form.estado" :options="estadosDiligencia" fluid>
            <template #value>
              <span v-if="form.estado">{{ estadoLabels[form.estado] }}</span>
              <span v-else class="text-secondary">Seleccionar</span>
            </template>
          </Select>
        </div>
        <div class="field full-width">
          <label>Dirección <span class="required">*</span></label>
          <InputText v-model="form.direccion" placeholder="Dirección completa de la diligencia" fluid />
        </div>
        <div class="field full-width">
          <label>Fecha y Hora</label>
          <input v-model="form.fechaHora" type="datetime-local" class="p-inputtext p-component p-inputfluid" />
        </div>
        <div class="field full-width">
          <label>Observaciones</label>
          <Textarea v-model="form.observaciones" rows="3" fluid />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text @click="dialogVisible = false" />
        <Button label="Guardar" @click="save" />
      </template>
    </Dialog>
  </div>
</template>

<style lang="scss" scoped>
.agenda-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  h1 { margin: 0 0 0.25rem 0; }
  .text-body { margin: 0; font-size: 0.875rem; color: $text-secondary; }
}

.header-actions { display: flex; gap: 0.5rem; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-card {
  background-color: $bg-surface;
  border: 1px solid $border-color;
  border-radius: 0.875rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;

  .stat-icon {
    font-size: 1.5rem; width: 2.5rem; height: 2.5rem;
    display: flex; align-items: center; justify-content: center;
    border-radius: 0.75rem;

    &.scheduled { background-color: rgba(#3b82f6, 0.1); color: #3b82f6; }
    &.inprogress { background-color: rgba(#f59e0b, 0.1); color: #f59e0b; }
    &.done { background-color: rgba(#10b981, 0.1); color: #10b981; }
    &.cancelled { background-color: rgba(#ef4444, 0.1); color: #ef4444; }
  }

  .stat-info { display: flex; flex-direction: column; }
  .stat-value { font-size: 1.5rem; font-weight: 700; color: $text-primary; line-height: 1; }
  .stat-label { font-size: 0.8125rem; color: $text-secondary; margin-top: 0.25rem; }
}

.filters-bar {
  .filter-select { min-width: 200px; }
}

.data-card {
  background-color: $bg-surface;
  border: 1px solid $border-color;
  border-radius: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.date-cell {
  display: flex; flex-direction: column;
  .date-main { font-weight: 600; font-size: 0.875rem; }
  .date-sub { font-size: 0.75rem; color: $text-secondary; }
}

.actions {
  display: flex; gap: 0.25rem; align-items: center;
  .estado-select { min-width: 120px; }
}

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 4rem 2rem;
  background-color: $bg-surface; border: 1px dashed $border-color;
  border-radius: 1.25rem; min-height: 360px;

  .empty-icon {
    width: 80px; height: 80px; display: flex; align-items: center; justify-content: center;
    background-color: rgba($primary, 0.06); border: 1px solid rgba($primary, 0.12);
    border-radius: 1.25rem; margin-bottom: 1.5rem;
    i { font-size: 2rem; color: $primary; }
  }

  .empty-title { font-size: 1.25rem; font-weight: 600; color: $text-primary; margin: 0 0 0.5rem 0; }
  .empty-text { font-size: 0.9375rem; color: $text-secondary; margin: 0 0 1.5rem 0; max-width: 400px; line-height: 1.6; }
  .empty-cta { min-width: 200px; }
}

.form-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;
  .field {
    display: flex; flex-direction: column; gap: 0.5rem;
    label { font-size: 0.875rem; font-weight: 600; color: $text-primary; }
    .required { color: #ef4444; }
    &.full-width { grid-column: 1 / -1; }
  }
}

.error-msg {
  grid-column: 1 / -1; color: #ef4444; font-size: 0.875rem; margin: 0;
  padding: 0.75rem; background-color: rgba(#ef4444, 0.08); border-radius: 0.5rem;
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
