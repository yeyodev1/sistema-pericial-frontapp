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
import { bitacoraCobroService } from '@/services/bitacora-cobro.service'
import { sorteoService } from '@/services/sorteo.service'
import { useConfirm } from '@/composables/useConfirm'
import { useUserStore } from '@/stores/user'
import type { BitacoraCobro, Sorteo } from '@/types'

const registros = ref<BitacoraCobro[]>([])
const sorteos = ref<Sorteo[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref('')
const errorMessage = ref('')
const filtroSorteo = ref('')

const userStore = useUserStore()
const isCollector = computed(() => userStore.role === 'COLLECTOR')
const hasRegistros = computed(() => registros.value.length > 0)

const tiposGestion = ['VISITA', 'LLAMADA', 'CORREO', 'NOTIFICACION_JUDICIAL']
const resultados = ['PENDIENTE', 'CONTACTO_EXITOSO', 'PROMESA_PAGO', 'PAGO_PARCIAL', 'PAGO_TOTAL', 'SIN_RESULTADO']

const tipoLabels: Record<string, string> = {
  VISITA: 'Visita', LLAMADA: 'Llamada', CORREO: 'Correo', NOTIFICACION_JUDICIAL: 'Notificación Judicial',
}

const tipoSeverity: Record<string, 'info' | 'warn' | 'success' | 'danger'> = {
  VISITA: 'info', LLAMADA: 'warn', CORREO: 'success', NOTIFICACION_JUDICIAL: 'danger',
}

const resultadoLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente', CONTACTO_EXITOSO: 'Contacto Exitoso', PROMESA_PAGO: 'Promesa de Pago',
  PAGO_PARCIAL: 'Pago Parcial', PAGO_TOTAL: 'Pago Total', SIN_RESULTADO: 'Sin Resultado',
}

const resultadoSeverity: Record<string, 'info' | 'success' | 'warn' | 'danger' | 'contrast'> = {
  PENDIENTE: 'info', CONTACTO_EXITOSO: 'success', PROMESA_PAGO: 'warn',
  PAGO_PARCIAL: 'contrast', PAGO_TOTAL: 'success', SIN_RESULTADO: 'danger',
}

const now = new Date()
const today = now.toISOString().split('T')[0] || ''

const form = ref({
  sorteoId: '',
  fecha: today,
  tipoGestion: '',
  resultado: 'PENDIENTE',
  proximaAccion: '',
  proximaFecha: '',
  observaciones: '',
})

function sorteoLabel(s: Sorteo): string {
  return `${s.numeroJuicio} — ${s.actor} vs ${s.demandado}`
}

async function loadRegistros() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filtroSorteo.value) params.sorteoId = filtroSorteo.value
    registros.value = await bitacoraCobroService.findAll(params)
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
  await Promise.all([loadRegistros(), loadSorteos()])
})

function openCreate() {
  isEditing.value = false
  form.value = { sorteoId: '', fecha: today, tipoGestion: '', resultado: 'PENDIENTE', proximaAccion: '', proximaFecha: '', observaciones: '' }
  dialogVisible.value = true
}

function openEdit(r: BitacoraCobro) {
  isEditing.value = true
  editingId.value = r._id
  const sorteoId = typeof r.sorteoId === 'object' ? r.sorteoId._id : r.sorteoId
  form.value = {
    sorteoId: sorteoId || '',
    fecha: r.fecha.slice(0, 10),
    tipoGestion: r.tipoGestion,
    resultado: r.resultado,
    proximaAccion: r.proximaAccion,
    proximaFecha: r.proximaFecha ? r.proximaFecha.slice(0, 10) : '',
    observaciones: r.observaciones,
  }
  dialogVisible.value = true
}

async function save() {
  errorMessage.value = ''
  if (!form.value.sorteoId || !form.value.tipoGestion) {
    errorMessage.value = 'Completa los campos obligatorios: sorteo y tipo de gestión'
    return
  }
  try {
    const payload = {
      sorteoId: form.value.sorteoId,
      fecha: form.value.fecha,
      tipoGestion: form.value.tipoGestion,
      resultado: form.value.resultado,
      proximaAccion: form.value.proximaAccion || undefined,
      proximaFecha: form.value.proximaFecha || undefined,
      observaciones: form.value.observaciones || undefined,
    }
    if (isEditing.value) {
      await bitacoraCobroService.update(editingId.value, payload)
    } else {
      await bitacoraCobroService.create(payload)
    }
    dialogVisible.value = false
    await loadRegistros()
  } catch { /* handled */ }
}

const { confirm: confirmDelete } = useConfirm()

async function removeRegistro(id: string) {
  const ok = await confirmDelete({ message: '¿Estás seguro de eliminar este registro?' })
  if (!ok) return
  try {
    await bitacoraCobroService.remove(id)
    await loadRegistros()
  } catch { /* handled */ }
}
</script>

<template>
  <div class="bitacora-view">
    <div class="page-header">
      <div>
        <span class="text-small">Fase 4</span>
        <h1 class="text-title">Bitácora de Cobro</h1>
        <p class="text-body">Registro de gestiones de cobro realizadas para cada causa judicial</p>
      </div>
      <div class="header-actions">
        <Button label="Nueva gestión" icon="fa-solid fa-plus" severity="warn" size="large" @click="openCreate" />
      </div>
    </div>

    <div class="filters-bar">
      <Select v-model="filtroSorteo" :options="sorteos" option-value="_id" :option-label="sorteoLabel" placeholder="Todos los sorteos" class="filter-select" filter show-clear @update:model-value="loadRegistros" />
    </div>

    <div v-if="!hasRegistros && !loading" class="empty-state">
      <div class="empty-icon"><i class="fa-solid fa-hand-holding-dollar"></i></div>
      <h2 class="empty-title">No hay gestiones de cobro registradas</h2>
      <p class="empty-text">Registra cada gestión de cobro realizada — visitas, llamadas, correos — para dar seguimiento a la recuperación de honorarios.</p>
      <Button label="Registrar primera gestión" icon="fa-solid fa-plus" severity="warn" size="large" class="empty-cta" @click="openCreate" />
    </div>

    <div v-if="hasRegistros" class="data-card">
      <DataTable :value="registros" :loading="loading" paginator :rows="15" striped-rows sort-field="fecha" :sort-order="-1">
        <Column header="Sorteo">
          <template #body="{ data }">
            <span v-if="typeof data.sorteoId === 'object'">{{ data.sorteoId.numeroJuicio }}</span>
            <span v-else>{{ data.sorteoId }}</span>
          </template>
        </Column>
        <Column field="fecha" header="Fecha" sortable>
          <template #body="{ data }">{{ new Date(data.fecha).toLocaleDateString('es-EC') }}</template>
        </Column>
        <Column header="Tipo">
          <template #body="{ data }">
            <Tag :severity="tipoSeverity[data.tipoGestion] || 'info'">{{ tipoLabels[data.tipoGestion] || data.tipoGestion }}</Tag>
          </template>
        </Column>
        <Column header="Resultado">
          <template #body="{ data }">
            <Tag :severity="resultadoSeverity[data.resultado] || 'info'">{{ resultadoLabels[data.resultado] || data.resultado }}</Tag>
          </template>
        </Column>
        <Column field="proximaAccion" header="Próxima Acción" />
        <Column header="Cobrador">
          <template #body="{ data }">
            <span v-if="typeof data.cobradorId === 'object'">{{ data.cobradorId.name }}</span>
            <span v-else>—</span>
          </template>
        </Column>
        <Column header="Acciones">
          <template #body="{ data }">
            <div class="actions">
              <Button icon="fa-solid fa-pen" text rounded @click="openEdit(data)" />
              <Button v-if="!isCollector" icon="fa-solid fa-trash" text rounded severity="danger" @click="removeRegistro(data._id)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="dialogVisible" :header="isEditing ? 'Editar gestión' : 'Nueva gestión de cobro'" modal :style="{ width: '36rem' }">
      <div class="form-grid">
        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

        <div class="field full-width">
          <label>Sorteo <span class="required">*</span></label>
          <Select v-model="form.sorteoId" :options="sorteos" option-value="_id" :option-label="sorteoLabel" placeholder="Seleccionar sorteo" filter fluid />
        </div>
        <div class="field">
          <label>Tipo de Gestión <span class="required">*</span></label>
          <Select v-model="form.tipoGestion" :options="tiposGestion" placeholder="Seleccionar" fluid>
            <template #value>
              <span v-if="form.tipoGestion">{{ tipoLabels[form.tipoGestion] }}</span>
              <span v-else class="text-secondary">Seleccionar</span>
            </template>
          </Select>
        </div>
        <div class="field">
          <label>Resultado</label>
          <Select v-model="form.resultado" :options="resultados" fluid>
            <template #value>
              <span v-if="form.resultado">{{ resultadoLabels[form.resultado] }}</span>
              <span v-else class="text-secondary">Seleccionar</span>
            </template>
          </Select>
        </div>
        <div class="field full-width">
          <label>Fecha de Gestión</label>
          <DatePicker v-model="form.fecha" />
        </div>
        <div class="field full-width">
          <label>Próxima Acción</label>
          <InputText v-model="form.proximaAccion" placeholder="Describir la próxima acción a realizar" fluid />
        </div>
        <div class="field full-width">
          <label>Fecha Próxima Gestión</label>
          <DatePicker v-model="form.proximaFecha" />
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
.bitacora-view { display: flex; flex-direction: column; gap: 1.5rem; }

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
