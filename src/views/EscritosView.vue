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
import DatePicker from '@/components/DatePicker.vue'
import { escritoService } from '@/services/escrito.service'
import { sorteoService } from '@/services/sorteo.service'
import { useConfirm } from '@/composables/useConfirm'
import type { Escrito, Sorteo } from '@/types'

const escritos = ref<Escrito[]>([])
const sorteos = ref<Sorteo[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref('')
const errorMessage = ref('')
const filtroSorteo = ref('')
const filtroEstado = ref('')
const filtroTipo = ref('')

const hasEscritos = computed(() => escritos.value.length > 0)

const tipos = ['DEMANDA', 'CONTESTACION', 'PRUEBA', 'ALEGATO', 'SENTENCIA', 'OTRO']
const estados = ['PRESENTADO', 'NOTIFICADO', 'RESUELTO', 'ARCHIVADO']

const tipoLabels: Record<string, string> = {
  DEMANDA: 'Demanda', CONTESTACION: 'Contestación', PRUEBA: 'Prueba',
  ALEGATO: 'Alegato', SENTENCIA: 'Sentencia', OTRO: 'Otro',
}

const tipoSeverity: Record<string, 'info' | 'warn' | 'success' | 'danger' | 'contrast'> = {
  DEMANDA: 'danger', CONTESTACION: 'warn', PRUEBA: 'info',
  ALEGATO: 'contrast', SENTENCIA: 'success', OTRO: 'info',
}

const estadoLabels: Record<string, string> = {
  PRESENTADO: 'Presentado', NOTIFICADO: 'Notificado', RESUELTO: 'Resuelto', ARCHIVADO: 'Archivado',
}

const estadoSeverity: Record<string, 'info' | 'success' | 'warn' | 'danger'> = {
  PRESENTADO: 'info', NOTIFICADO: 'warn', RESUELTO: 'success', ARCHIVADO: 'danger',
}

const now = new Date().toISOString().split('T')[0] || ''

const form = ref({
  sorteoId: '',
  tipo: '',
  fechaPresentacion: now,
  fechaNotificacion: '',
  estado: 'PRESENTADO',
  archivoUrl: '',
  observaciones: '',
})

function sorteoLabel(s: Sorteo): string {
  return `${s.numeroJuicio} — ${s.actor} vs ${s.demandado}`
}


async function loadEscritos() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filtroSorteo.value) params.sorteoId = filtroSorteo.value
    if (filtroEstado.value) params.estado = filtroEstado.value
    if (filtroTipo.value) params.tipo = filtroTipo.value
    escritos.value = await escritoService.findAll(params)
  } catch { /* handled */ }
  finally { loading.value = false }
}

async function loadSorteos() {
  try {
    const data = await sorteoService.findAll()
    sorteos.value = data.filter((s) => s.activo !== false)
  } catch { /* handled */ }
}

onMounted(async () => {
  await Promise.all([loadEscritos(), loadSorteos()])
})

function openCreate() {
  isEditing.value = false
  form.value = { sorteoId: '', tipo: '', fechaPresentacion: now, fechaNotificacion: '', estado: 'PRESENTADO', archivoUrl: '', observaciones: '' }
  dialogVisible.value = true
}

function openEdit(e: Escrito) {
  isEditing.value = true
  editingId.value = e._id
  const sorteoId = typeof e.sorteoId === 'object' ? e.sorteoId._id : e.sorteoId
  form.value = {
    sorteoId: sorteoId || '',
    tipo: e.tipo,
    fechaPresentacion: e.fechaPresentacion.slice(0, 10),
    fechaNotificacion: e.fechaNotificacion ? e.fechaNotificacion.slice(0, 10) : '',
    estado: e.estado,
    archivoUrl: e.archivoUrl || '',
    observaciones: e.observaciones,
  }
  dialogVisible.value = true
}

async function save() {
  errorMessage.value = ''
  if (!form.value.sorteoId || !form.value.tipo) {
    errorMessage.value = 'Completa los campos obligatorios: sorteo y tipo'
    return
  }
  try {
    const payload = {
      sorteoId: form.value.sorteoId,
      tipo: form.value.tipo,
      fechaPresentacion: form.value.fechaPresentacion,
      fechaNotificacion: form.value.fechaNotificacion || undefined,
      estado: form.value.estado,
      archivoUrl: form.value.archivoUrl || undefined,
      observaciones: form.value.observaciones || undefined,
    }
    if (isEditing.value) {
      await escritoService.update(editingId.value, payload)
    } else {
      await escritoService.create(payload)
    }
    dialogVisible.value = false
    await loadEscritos()
  } catch { /* handled */ }
}

const { confirm: confirmDelete } = useConfirm()

async function removeEscrito(id: string) {
  const ok = await confirmDelete({ message: '¿Estás seguro de eliminar este escrito?' })
  if (!ok) return
  try {
    await escritoService.remove(id)
    await loadEscritos()
  } catch { /* handled */ }
}
</script>

<template>
  <div class="escritos-view">
    <div class="page-header">
      <div>
        <span class="text-small">Fase 4</span>
        <h1 class="text-title">Escritos Judiciales</h1>
        <p class="text-body">Registro y seguimiento de escritos presentados en cada causa</p>
      </div>
      <div class="header-actions">
        <Button label="Nuevo escrito" icon="fa-solid fa-plus" severity="warn" size="large" @click="openCreate" />
      </div>
    </div>

    <div class="filters-bar">
      <Select v-model="filtroSorteo" :options="sorteos" option-value="_id" :option-label="sorteoLabel" placeholder="Todos los sorteos" class="filter-select" filter show-clear @update:model-value="loadEscritos" />
      <Select v-model="filtroTipo" :options="['', ...tipos]" placeholder="Todos los tipos" class="filter-select" @update:model-value="loadEscritos">
        <template #value>
          <span v-if="filtroTipo">{{ tipoLabels[filtroTipo] }}</span>
          <span v-else class="text-secondary">Todos los tipos</span>
        </template>
      </Select>
      <Select v-model="filtroEstado" :options="['', ...estados]" placeholder="Todos los estados" class="filter-select" @update:model-value="loadEscritos">
        <template #value>
          <span v-if="filtroEstado">{{ estadoLabels[filtroEstado] }}</span>
          <span v-else class="text-secondary">Todos los estados</span>
        </template>
      </Select>
    </div>

    <div v-if="!hasEscritos && !loading" class="empty-state">
      <div class="empty-icon"><i class="fa-solid fa-file-lines"></i></div>
      <h2 class="empty-title">No hay escritos registrados</h2>
      <p class="empty-text">Registra los escritos presentados en cada causa judicial para llevar el control del proceso.</p>
      <Button label="Registrar primer escrito" icon="fa-solid fa-plus" severity="warn" size="large" class="empty-cta" @click="openCreate" />
    </div>

    <div v-if="hasEscritos" class="data-card">
      <DataTable :value="escritos" :loading="loading" paginator :rows="15" striped-rows sort-field="fechaPresentacion" :sort-order="-1">
        <Column header="Sorteo">
          <template #body="{ data }">
            <div class="sorteo-info">
              <span v-if="typeof data.sorteoId === 'object'">
                <strong>{{ data.sorteoId.numeroJuicio }}</strong>
                <small>{{ data.sorteoId.materia }}</small>
              </span>
              <span v-else>{{ data.sorteoId }}</span>
            </div>
          </template>
        </Column>
        <Column header="Tipo" sortable field="tipo">
          <template #body="{ data }">
            <Tag :severity="tipoSeverity[data.tipo] || 'info'">{{ tipoLabels[data.tipo] || data.tipo }}</Tag>
          </template>
        </Column>
        <Column field="fechaPresentacion" header="Presentación" sortable>
          <template #body="{ data }">{{ new Date(data.fechaPresentacion).toLocaleDateString('es-EC') }}</template>
        </Column>
        <Column field="fechaNotificacion" header="Notificación">
          <template #body="{ data }">{{ data.fechaNotificacion ? new Date(data.fechaNotificacion).toLocaleDateString('es-EC') : '—' }}</template>
        </Column>
        <Column header="Estado">
          <template #body="{ data }">
            <Tag :severity="estadoSeverity[data.estado] || 'info'">{{ estadoLabels[data.estado] || data.estado }}</Tag>
          </template>
        </Column>
        <Column header="Acciones">
          <template #body="{ data }">
            <div class="actions">
              <Button icon="fa-solid fa-pen" text rounded @click="openEdit(data)" />
              <Button icon="fa-solid fa-trash" text rounded severity="danger" @click="removeEscrito(data._id)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="dialogVisible" :header="isEditing ? 'Editar escrito' : 'Nuevo escrito'" modal :style="{ width: '36rem' }">
      <div class="form-grid">
        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

        <div class="field full-width">
          <label>Sorteo <span class="required">*</span></label>
          <Select v-model="form.sorteoId" :options="sorteos" option-value="_id" :option-label="sorteoLabel" placeholder="Seleccionar sorteo" filter fluid />
        </div>
        <div class="field">
          <label>Tipo <span class="required">*</span></label>
          <Select v-model="form.tipo" :options="tipos" placeholder="Seleccionar" fluid>
            <template #value>
              <span v-if="form.tipo">{{ tipoLabels[form.tipo] }}</span>
              <span v-else class="text-secondary">Seleccionar</span>
            </template>
          </Select>
        </div>
        <div class="field">
          <label>Estado</label>
          <Select v-model="form.estado" :options="estados" fluid>
            <template #value>
              <span v-if="form.estado">{{ estadoLabels[form.estado] }}</span>
              <span v-else class="text-secondary">Seleccionar</span>
            </template>
          </Select>
        </div>
        <div class="field full-width">
          <label>Fecha de Presentación</label>
          <DatePicker v-model="form.fechaPresentacion" />
        </div>
        <div class="field full-width">
          <label>Fecha de Notificación</label>
          <DatePicker v-model="form.fechaNotificacion" />
        </div>
        <div class="field full-width">
          <label>URL del Archivo (Cloudinary)</label>
          <InputText v-model="form.archivoUrl" placeholder="https://res.cloudinary.com/..." fluid />
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
.escritos-view { display: flex; flex-direction: column; gap: 1.5rem; }

.page-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
  h1 { margin: 0 0 0.25rem 0; }
  .text-body { margin: 0; font-size: 0.875rem; color: $text-secondary; }
}

.header-actions { display: flex; gap: 0.5rem; }

.filters-bar {
  display: flex; gap: 0.75rem; flex-wrap: wrap;
  .filter-select { min-width: 200px; }
}

.data-card {
  background-color: $bg-surface; border: 1px solid $border-color;
  border-radius: 1rem; padding: 1rem; overflow: hidden;
}

.sorteo-info {
  display: flex; flex-direction: column;
  small { font-size: 0.75rem; color: $text-secondary; }
}

.actions { display: flex; gap: 0.25rem; }

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

@media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } }
</style>
