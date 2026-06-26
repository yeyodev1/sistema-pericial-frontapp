<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import DatePicker from '@/components/DatePicker.vue'
import { cajaService } from '@/services/caja.service'
import { useConfirm } from '@/composables/useConfirm'
import type { CajaMovimiento, CajaResumen } from '@/types'

const movimientos = ref<CajaMovimiento[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref('')
const errorMessage = ref('')
const filtroTipo = ref('')
const filtroMes = ref('')

const resumen = ref<CajaResumen>({ ingresos: 0, egresos: 0, balance: 0 })
const hasMovimientos = computed(() => movimientos.value.length > 0)

const tiposMovimiento = ['INGRESO', 'EGRESO']
const formasPago = ['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA']

const tipoLabels: Record<string, string> = { INGRESO: 'Ingreso', EGRESO: 'Egreso' }
const tipoSeverity: Record<string, 'success' | 'danger'> = { INGRESO: 'success', EGRESO: 'danger' }
const formaPagoLabels: Record<string, string> = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', CHEQUE: 'Cheque', TARJETA: 'Tarjeta' }

const now = new Date().toISOString().split('T')[0] || ''

const form = ref({
  fecha: now,
  tipoMovimiento: '',
  monto: 0,
  concepto: '',
  formaPago: 'EFECTIVO',
  referencia: '',
  peritoId: '',
  sorteoId: '',
  observaciones: '',
})

function formatMonto(n: number): string {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}

async function loadMovimientos() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filtroTipo.value) params.tipoMovimiento = filtroTipo.value
    if (filtroMes.value) {
      const [year, month] = filtroMes.value.split('-')
      const m = month || '01'
      params.desde = `${year || '2024'}-${m}-01`
      const d = new Date(parseInt(year || '2024'), parseInt(m), 0)
      params.hasta = d.toISOString().split('T')[0] || ''
    }
    const data = await cajaService.findAll(params)
    movimientos.value = data
    const r = await cajaService.getResumen()
    resumen.value = r
  } catch { /* handled */ }
  finally { loading.value = false }
}

onMounted(loadMovimientos)

function openCreate() {
  isEditing.value = false
  form.value = { fecha: now, tipoMovimiento: '', monto: 0, concepto: '', formaPago: 'EFECTIVO', referencia: '', peritoId: '', sorteoId: '', observaciones: '' }
  dialogVisible.value = true
}

function openEdit(m: CajaMovimiento) {
  isEditing.value = true
  editingId.value = m._id
  form.value = {
    fecha: m.fecha.slice(0, 10),
    tipoMovimiento: m.tipoMovimiento,
    monto: m.monto,
    concepto: m.concepto,
    formaPago: m.formaPago,
    referencia: m.referencia,
    peritoId: typeof m.peritoId === 'object' ? m.peritoId._id : m.peritoId || '',
    sorteoId: typeof m.sorteoId === 'object' ? m.sorteoId._id : m.sorteoId || '',
    observaciones: m.observaciones,
  }
  dialogVisible.value = true
}

async function save() {
  errorMessage.value = ''
  if (!form.value.tipoMovimiento || !form.value.monto || !form.value.concepto) {
    errorMessage.value = 'Completa los campos obligatorios: tipo, monto y concepto'
    return
  }
  try {
    const payload = {
      fecha: form.value.fecha,
      tipoMovimiento: form.value.tipoMovimiento as 'INGRESO' | 'EGRESO',
      monto: form.value.monto,
      concepto: form.value.concepto,
      formaPago: form.value.formaPago,
      referencia: form.value.referencia || undefined,
      peritoId: form.value.peritoId || undefined,
      sorteoId: form.value.sorteoId || undefined,
      observaciones: form.value.observaciones || undefined,
    }
    if (isEditing.value) {
      await cajaService.update(editingId.value, payload)
    } else {
      await cajaService.create(payload)
    }
    dialogVisible.value = false
    await loadMovimientos()
  } catch { /* handled */ }
}

const { confirm: confirmDelete } = useConfirm()

async function removeMovimiento(id: string) {
  const ok = await confirmDelete({ message: '¿Estás seguro de eliminar este movimiento?' })
  if (!ok) return
  try {
    await cajaService.remove(id)
    await loadMovimientos()
  } catch { /* handled */ }
}
</script>

<template>
  <div class="caja-view">
    <div class="page-header">
      <div>
        <span class="text-small">Fase 6</span>
        <h1 class="text-title">Caja</h1>
        <p class="text-body">Control de ingresos y egresos de la oficina</p>
      </div>
      <div class="header-actions">
        <Button label="Nuevo movimiento" icon="fa-solid fa-plus" severity="warn" size="large" @click="openCreate" />
      </div>
    </div>

    <div class="resumen-grid">
      <div class="resumen-card ingresos">
        <div class="resumen-icon"><i class="fa-solid fa-arrow-down"></i></div>
        <div class="resumen-info">
          <span class="resumen-label">Ingresos</span>
          <span class="resumen-value">{{ formatMonto(resumen.ingresos) }}</span>
        </div>
      </div>
      <div class="resumen-card egresos">
        <div class="resumen-icon"><i class="fa-solid fa-arrow-up"></i></div>
        <div class="resumen-info">
          <span class="resumen-label">Egresos</span>
          <span class="resumen-value">{{ formatMonto(resumen.egresos) }}</span>
        </div>
      </div>
      <div class="resumen-card balance" :class="{ positivo: resumen.balance >= 0, negativo: resumen.balance < 0 }">
        <div class="resumen-icon"><i class="fa-solid fa-scale-balanced"></i></div>
        <div class="resumen-info">
          <span class="resumen-label">Balance</span>
          <span class="resumen-value">{{ formatMonto(resumen.balance) }}</span>
        </div>
      </div>
    </div>

    <div class="filters-bar">
      <Select v-model="filtroTipo" :options="['', ...tiposMovimiento]" placeholder="Todos los tipos" class="filter-select" @update:model-value="loadMovimientos">
        <template #value>
          <span v-if="filtroTipo">{{ tipoLabels[filtroTipo] }}</span>
          <span v-else class="text-secondary">Todos los tipos</span>
        </template>
      </Select>
      <Select v-model="filtroMes" :options="[]" placeholder="Seleccionar mes" class="filter-select" @update:model-value="loadMovimientos" />
    </div>

    <div v-if="!hasMovimientos && !loading" class="empty-state">
      <div class="empty-icon"><i class="fa-solid fa-cash-register"></i></div>
      <h2 class="empty-title">No hay movimientos registrados</h2>
      <p class="empty-text">Registra los ingresos y egresos para llevar el control financiero de la oficina.</p>
      <Button label="Registrar primer movimiento" icon="fa-solid fa-plus" severity="warn" size="large" class="empty-cta" @click="openCreate" />
    </div>

    <div v-if="hasMovimientos" class="data-card">
      <DataTable :value="movimientos" :loading="loading" paginator :rows="15" striped-rows sort-field="fecha" :sort-order="-1">
        <Column field="fecha" header="Fecha" sortable>
          <template #body="{ data }">{{ new Date(data.fecha).toLocaleDateString('es-EC') }}</template>
        </Column>
        <Column header="Tipo">
          <template #body="{ data }">
            <Tag :severity="tipoSeverity[data.tipoMovimiento] || 'info'">{{ tipoLabels[data.tipoMovimiento] || data.tipoMovimiento }}</Tag>
          </template>
        </Column>
        <Column field="concepto" header="Concepto" />
        <Column field="monto" header="Monto" sortable>
          <template #body="{ data }">
            <span :class="{ 'text-success': data.tipoMovimiento === 'INGRESO', 'text-danger': data.tipoMovimiento === 'EGRESO' }">
              {{ formatMonto(data.monto) }}
            </span>
          </template>
        </Column>
        <Column field="formaPago" header="Forma de Pago">
          <template #body="{ data }">{{ formaPagoLabels[data.formaPago] || data.formaPago }}</template>
        </Column>
        <Column field="referencia" header="Referencia" />
        <Column header="Acciones">
          <template #body="{ data }">
            <div class="actions">
              <Button icon="fa-solid fa-pen" text rounded @click="openEdit(data)" />
              <Button icon="fa-solid fa-trash" text rounded severity="danger" @click="removeMovimiento(data._id)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="dialogVisible" :header="isEditing ? 'Editar movimiento' : 'Nuevo movimiento'" modal :style="{ width: '36rem' }">
      <div class="form-grid">
        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

        <div class="field">
          <label>Tipo <span class="required">*</span></label>
          <Select v-model="form.tipoMovimiento" :options="tiposMovimiento" placeholder="Seleccionar" fluid>
            <template #value>
              <span v-if="form.tipoMovimiento">{{ tipoLabels[form.tipoMovimiento] }}</span>
              <span v-else class="text-secondary">Seleccionar</span>
            </template>
          </Select>
        </div>
        <div class="field">
          <label>Forma de Pago</label>
          <Select v-model="form.formaPago" :options="formasPago" fluid>
            <template #value>
              <span v-if="form.formaPago">{{ formaPagoLabels[form.formaPago] }}</span>
              <span v-else class="text-secondary">Seleccionar</span>
            </template>
          </Select>
        </div>
        <div class="field full-width">
          <label>Monto <span class="required">*</span></label>
          <InputNumber v-model="form.monto" :min="0" :step="0.01" placeholder="0.00" fluid />
        </div>
        <div class="field full-width">
          <label>Concepto <span class="required">*</span></label>
          <InputText v-model="form.concepto" placeholder="Descripción del movimiento" fluid />
        </div>
        <div class="field full-width">
          <label>Fecha</label>
          <DatePicker v-model="form.fecha" />
        </div>
        <div class="field full-width">
          <label>Referencia (comprobante, factura, etc.)</label>
          <InputText v-model="form.referencia" placeholder="Número de referencia" fluid />
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
.caja-view { display: flex; flex-direction: column; gap: 1.5rem; }

.page-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
  h1 { margin: 0 0 0.25rem 0; }
  .text-body { margin: 0; font-size: 0.875rem; color: $text-secondary; }
}

.header-actions { display: flex; gap: 0.5rem; }

.resumen-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;
}

.resumen-card {
  background-color: $bg-surface; border: 1px solid $border-color;
  border-radius: 0.875rem; padding: 1.25rem; display: flex; align-items: center; gap: 1rem;

  .resumen-icon {
    width: 3rem; height: 3rem; display: flex; align-items: center; justify-content: center;
    border-radius: 0.75rem; font-size: 1.5rem;
  }

  .resumen-info { display: flex; flex-direction: column; }
  .resumen-label { font-size: 0.8125rem; color: $text-secondary; }
  .resumen-value { font-size: 1.5rem; font-weight: 700; line-height: 1; }

  &.ingresos .resumen-icon { background-color: rgba(#10b981, 0.1); color: #10b981; }
  &.ingresos .resumen-value { color: #10b981; }
  &.egresos .resumen-icon { background-color: rgba(#ef4444, 0.1); color: #ef4444; }
  &.egresos .resumen-value { color: #ef4444; }
  &.balance.positivo .resumen-icon { background-color: rgba(#10b981, 0.1); color: #10b981; }
  &.balance.positivo .resumen-value { color: #10b981; }
  &.balance.negativo .resumen-icon { background-color: rgba(#ef4444, 0.1); color: #ef4444; }
  &.balance.negativo .resumen-value { color: #ef4444; }
}

.filters-bar {
  display: flex; gap: 0.75rem; flex-wrap: wrap;
  .filter-select { min-width: 200px; }
}

.data-card {
  background-color: $bg-surface; border: 1px solid $border-color;
  border-radius: 1rem; padding: 1rem; overflow: hidden;
}

.actions { display: flex; gap: 0.25rem; }

.text-success { color: #10b981; font-weight: 600; }
.text-danger { color: #ef4444; font-weight: 600; }

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
  .resumen-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
