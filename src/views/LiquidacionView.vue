<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import DatePicker from '@/components/DatePicker.vue'
import { liquidacionService, type CreateLiquidacionPayload } from '@/services/liquidacion.service'
import { peritoService } from '@/services/perito.service'
import { useConfirm } from '@/composables/useConfirm'
import type { Liquidacion, Perito, LiquidacionEstado } from '@/types'

const liquidaciones = ref<Liquidacion[]>([])
const peritos = ref<Perito[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const stats = ref({ totalPendiente: 0, liquidado: 0, peritosActivos: 0 })

const hasLiquidaciones = computed(() => liquidaciones.value.length > 0)

const estados: LiquidacionEstado[] = ['PENDIENTE', 'APROBADA', 'PAGADA', 'RECHAZADA']

function defaultPeriodo(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function monthRange(periodo: string): { inicio: string; fin: string } {
  const parts = periodo.split('-').map(Number)
  const y = parts[0] || new Date().getFullYear()
  const m = (parts[1] || 1) - 1
  const inicio = new Date(y, m, 1).toISOString().split('T')[0] || ''
  const fin = new Date(y, m + 1, 0).toISOString().split('T')[0] || ''
  return { inicio, fin }
}

const form = ref<CreateLiquidacionPayload & { _id?: string }>({
  peritoId: '',
  periodo: defaultPeriodo(),
  fechaInicio: '',
  fechaFin: '',
  detalle: [],
  totalHonorarios: 0,
  totalDescuentos: 0,
  totalAPagar: 0,
  estado: 'PENDIENTE',
  observaciones: '',
})

const selectedPerito = computed({
  get: () => peritos.value.find((p) => p._id === form.value.peritoId) || null,
  set: (val: Perito | null) => {
    form.value.peritoId = val?._id || ''
  },
})

function peritoLabel(p: Perito): string {
  return `${p.nombres} ${p.apellidos} — ${p.ruc}`
}

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`
}

function calcTotal() {
  form.value.totalAPagar = form.value.totalHonorarios - form.value.totalDescuentos
}

function onPeriodoChange() {
  const range = monthRange(form.value.periodo)
  form.value.fechaInicio = range.inicio
  form.value.fechaFin = range.fin
}

async function loadData() {
  loading.value = true
  try {
    const [l, p, s] = await Promise.all([
      liquidacionService.findAll(),
      peritoService.findAll(),
      liquidacionService.getStats(),
    ])
    liquidaciones.value = l
    peritos.value = p
    stats.value = s
  } catch {
    liquidaciones.value = []
    peritos.value = []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEditing.value = false
  errorMessage.value = ''
  successMessage.value = ''
  form.value = {
    peritoId: '',
    periodo: defaultPeriodo(),
    fechaInicio: '',
    fechaFin: '',
    detalle: [],
    totalHonorarios: 0,
    totalDescuentos: 0,
    totalAPagar: 0,
    estado: 'PENDIENTE',
    observaciones: '',
  }
  dialogVisible.value = true
}

function openEdit(l: Liquidacion) {
  isEditing.value = true
  errorMessage.value = ''
  successMessage.value = ''
  form.value = {
    _id: l._id,
    peritoId: typeof l.peritoId === 'object' ? l.peritoId._id : l.peritoId,
    periodo: l.periodo,
    fechaInicio: (l.fechaInicio || '').split('T')[0] || '',
    fechaFin: (l.fechaFin || '').split('T')[0] || '',
    detalle: l.detalle || [],
    totalHonorarios: l.totalHonorarios,
    totalDescuentos: l.totalDescuentos,
    totalAPagar: l.totalAPagar,
    estado: l.estado,
    observaciones: l.observaciones || '',
  }
  dialogVisible.value = true
}

async function save() {
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (!form.value.fechaInicio) onPeriodoChange()

    if (isEditing.value && form.value._id) {
      await liquidacionService.update(form.value._id, form.value)
      successMessage.value = 'Liquidación actualizada correctamente'
    } else {
      await liquidacionService.create(form.value)
      successMessage.value = 'Liquidación creada correctamente'
    }
    dialogVisible.value = false
    await loadData()
  } catch (error: unknown) {
    const apiError = error as { message?: string; data?: { message?: string } }
    errorMessage.value = apiError.data?.message || apiError.message || 'Error al guardar'
  }
}

const { confirm: confirmDelete } = useConfirm()

async function removeLiquidacion(id: string) {
  const ok = await confirmDelete({ message: '¿Estás seguro de eliminar esta liquidación? Esta acción no se puede deshacer.' })
  if (!ok) return
  try {
    await liquidacionService.remove(id)
    await loadData()
  } catch (error) {
    console.error(error)
  }
}

const estadoSeverity: Record<string, 'warn' | 'success' | 'info' | 'danger'> = {
  PENDIENTE: 'warn',
  APROBADA: 'success',
  PAGADA: 'info',
  RECHAZADA: 'danger',
}

const estadoLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  PAGADA: 'Pagada',
  RECHAZADA: 'Rechazada',
}

onMounted(loadData)
</script>

<template>
  <div class="liquidacion-view">
    <div class="page-header">
      <div>
        <span class="text-small">Contabilidad</span>
        <h1 class="text-title">Liquidaciones</h1>
        <p class="text-body">{{ liquidaciones.length }} liquidaciones registradas</p>
      </div>
      <div class="header-actions">
        <Button label="Nueva liquidación" icon="fa-solid fa-plus" size="large" @click="openCreate" />
      </div>
    </div>

    <Message v-if="successMessage" severity="success" closable>{{ successMessage }}</Message>

    <div class="stats-grid">
      <div class="stat-card">
        <i class="fa-solid fa-clock stat-icon pending"></i>
        <div class="stat-info">
          <span class="stat-value">{{ formatCurrency(stats.totalPendiente) }}</span>
          <span class="stat-label">Total Pendiente</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="fa-solid fa-check-circle stat-icon done"></i>
        <div class="stat-info">
          <span class="stat-value">{{ formatCurrency(stats.liquidado) }}</span>
          <span class="stat-label">Liquidado</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="fa-solid fa-user-tie stat-icon peritos"></i>
        <div class="stat-info">
          <span class="stat-value">{{ stats.peritosActivos }}</span>
          <span class="stat-label">Peritos Activos</span>
        </div>
      </div>
    </div>

    <div v-if="!hasLiquidaciones && !loading" class="empty-state">
      <div class="empty-icon">
        <i class="fa-solid fa-coins"></i>
      </div>
      <h2 class="empty-title">No hay liquidaciones registradas</h2>
      <p class="empty-text">
        Crea tu primera liquidación para gestionar los pagos y honorarios de los peritos.
      </p>
      <Button label="Crear primera liquidación" icon="fa-solid fa-plus" size="large" class="empty-cta" @click="openCreate" />
    </div>

    <div v-if="hasLiquidaciones" class="data-card">
      <DataTable :value="liquidaciones" :loading="loading" paginator :rows="10" striped-rows>
        <Column header="Perito">
          <template #body="{ data }">
            <span>{{ typeof data.peritoId === 'object' ? `${data.peritoId.nombres} ${data.peritoId.apellidos}` : data.peritoId }}</span>
          </template>
        </Column>
        <Column field="periodo" header="Período" sortable />
        <Column header="Honorarios">
          <template #body="{ data }">
            <span>{{ formatCurrency(data.totalHonorarios) }}</span>
          </template>
        </Column>
        <Column header="Descuentos">
          <template #body="{ data }">
            <span>{{ formatCurrency(data.totalDescuentos) }}</span>
          </template>
        </Column>
        <Column header="Total a Pagar">
          <template #body="{ data }">
            <span class="total-cell">{{ formatCurrency(data.totalAPagar) }}</span>
          </template>
        </Column>
        <Column header="Estado">
          <template #body="{ data }">
            <Tag :severity="estadoSeverity[data.estado] || 'info'" :value="estadoLabels[data.estado] || data.estado" />
          </template>
        </Column>
        <Column header="Acciones">
          <template #body="{ data }">
            <div class="actions">
              <Button icon="fa-solid fa-pen" text rounded @click="openEdit(data)" />
              <Button icon="fa-solid fa-trash" text rounded severity="danger" @click="removeLiquidacion(data._id)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="dialogVisible" :header="isEditing ? 'Editar liquidación' : 'Nueva liquidación'" modal :style="{ width: '34rem' }">
      <div class="form-grid">
        <Message v-if="errorMessage" severity="error" class="w-full">{{ errorMessage }}</Message>

        <div class="field full">
          <label>Perito</label>
          <Select v-model="selectedPerito" :options="peritos" filter placeholder="Seleccionar perito..." fluid>
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
          <label>Período</label>
          <InputText v-model="form.periodo" placeholder="YYYY-MM" fluid @update:model-value="onPeriodoChange" />
        </div>
        <div class="field">
          <label>Estado</label>
          <Select v-model="form.estado" :options="estados" placeholder="Seleccionar" fluid />
        </div>
        <div class="field">
          <label>Fecha Inicio</label>
          <DatePicker v-model="form.fechaInicio" />
        </div>
        <div class="field">
          <label>Fecha Fin</label>
          <DatePicker v-model="form.fechaFin" />
        </div>
        <div class="field">
          <label>Total Honorarios</label>
          <InputNumber v-model="form.totalHonorarios" :min="0" :min-fraction-digits="2" fluid @input="calcTotal" />
        </div>
        <div class="field">
          <label>Total Descuentos</label>
          <InputNumber v-model="form.totalDescuentos" :min="0" :min-fraction-digits="2" fluid @input="calcTotal" />
        </div>
        <div class="field full">
          <label>Total a Pagar</label>
          <InputNumber v-model="form.totalAPagar" :min="0" :min-fraction-digits="2" fluid disabled />
        </div>
        <div class="field full">
          <label>Observaciones</label>
          <Textarea v-model="form.observaciones" rows="2" fluid />
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
.liquidacion-view {
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
  .text-body { margin: 0.25rem 0 0 0; font-size: 0.875rem; color: $text-secondary; }
}

.header-actions { display: flex; align-items: center; gap: 0.75rem; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }

.stat-card {
  background-color: $bg-surface;
  border: 1px solid $border-color;
  border-radius: 0.875rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;

  .stat-icon {
    font-size: 1.5rem;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.75rem;

    &.pending { background-color: rgba(#f59e0b, 0.1); color: #f59e0b; }
    &.done { background-color: rgba(#10b981, 0.1); color: #10b981; }
    &.peritos { background-color: rgba(#6366f1, 0.1); color: #6366f1; }
  }

  .stat-info { display: flex; flex-direction: column; }
  .stat-value { font-size: 1.5rem; font-weight: 700; color: $text-primary; line-height: 1; }
  .stat-label { font-size: 0.8125rem; color: $text-secondary; margin-top: 0.25rem; }
}

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 4rem 2rem; background-color: $bg-surface;
  border: 1px dashed $border-color; border-radius: 1.25rem; min-height: 360px;
}

.empty-icon {
  width: 80px; height: 80px; display: flex; align-items: center; justify-content: center;
  background-color: rgba($primary, 0.06); border: 1px solid rgba($primary, 0.12);
  border-radius: 1.25rem; margin-bottom: 1.5rem;
  i { font-size: 2rem; color: $primary; }
}

.empty-title { font-size: 1.25rem; font-weight: 600; color: $text-primary; margin: 0 0 0.5rem 0; }
.empty-text { font-size: 0.9375rem; color: $text-secondary; margin: 0 0 1.5rem 0; max-width: 400px; line-height: 1.6; }
.empty-cta { min-width: 200px; }

.data-card { background-color: $bg-surface; border: 1px solid $border-color; border-radius: 1rem; padding: 1rem; overflow: hidden; }
.actions { display: flex; gap: 0.25rem; }

.total-cell { font-weight: 700; color: $text-primary; }

.form-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;

  .field {
    display: flex; flex-direction: column; gap: 0.5rem;

    label { font-size: 0.875rem; font-weight: 600; color: $text-primary; }
    &.full { grid-column: 1 / -1; }
  }
}

.w-full { grid-column: 1 / -1; }
.placeholder-text { color: #9ca3af; }

@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
