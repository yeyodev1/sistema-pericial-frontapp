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
import { facturacionService, type CreateFacturaPayload } from '@/services/facturacion.service'
import { peritoService } from '@/services/perito.service'
import { useConfirm } from '@/composables/useConfirm'
import type { Factura, Perito, FacturaEstado } from '@/types'

const facturas = ref<Factura[]>([])
const peritos = ref<Perito[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const stats = ref({ porFacturar: 0, autorizadas: 0, rechazadas: 0 })

const hasFacturas = computed(() => facturas.value.length > 0)

const estados: FacturaEstado[] = ['POR_FACTURAR', 'EMITIDA', 'AUTORIZADA', 'RECHAZADA']

const form = ref<CreateFacturaPayload & { _id?: string }>({
  numeroFactura: '',
  peritoId: '',
  clienteNombre: '',
  clienteRuc: '',
  subtotal: 0,
  iva: 0,
  total: 0,
  estado: 'POR_FACTURAR',
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
  form.value.total = form.value.subtotal + form.value.iva
}

async function loadData() {
  loading.value = true
  try {
    const [f, p, s] = await Promise.all([
      facturacionService.findAll(),
      peritoService.findAll(),
      facturacionService.getStats(),
    ])
    facturas.value = f
    peritos.value = p
    stats.value = s
  } catch {
    facturas.value = []
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
    numeroFactura: '',
    peritoId: '',
    clienteNombre: '',
    clienteRuc: '',
    subtotal: 0,
    iva: 0,
    total: 0,
    estado: 'POR_FACTURAR',
    observaciones: '',
  }
  dialogVisible.value = true
}

function openEdit(f: Factura) {
  isEditing.value = true
  errorMessage.value = ''
  successMessage.value = ''
  form.value = {
    _id: f._id,
    numeroFactura: f.numeroFactura,
    peritoId: typeof f.peritoId === 'object' ? f.peritoId._id : f.peritoId,
    clienteNombre: f.clienteNombre,
    clienteRuc: f.clienteRuc,
    subtotal: f.subtotal,
    iva: f.iva,
    total: f.total,
    estado: f.estado,
    observaciones: f.observaciones || '',
  }
  dialogVisible.value = true
}

async function save() {
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (isEditing.value && form.value._id) {
      await facturacionService.update(form.value._id, form.value)
      successMessage.value = 'Factura actualizada correctamente'
    } else {
      await facturacionService.create(form.value)
      successMessage.value = 'Factura creada correctamente'
    }
    dialogVisible.value = false
    await loadData()
  } catch (error: unknown) {
    const apiError = error as { message?: string; data?: { message?: string } }
    errorMessage.value = apiError.data?.message || apiError.message || 'Error al guardar'
  }
}

const { confirm: confirmDelete } = useConfirm()

async function removeFactura(id: string) {
  const ok = await confirmDelete({ message: '¿Estás seguro de eliminar esta factura? Esta acción no se puede deshacer.' })
  if (!ok) return
  try {
    await facturacionService.remove(id)
    await loadData()
  } catch (error) {
    console.error(error)
  }
}

const estadoSeverity: Record<string, 'warn' | 'info' | 'success' | 'danger'> = {
  POR_FACTURAR: 'warn',
  EMITIDA: 'info',
  AUTORIZADA: 'success',
  RECHAZADA: 'danger',
}

const estadoLabels: Record<string, string> = {
  POR_FACTURAR: 'Por Facturar',
  EMITIDA: 'Emitida',
  AUTORIZADA: 'Autorizada SRI',
  RECHAZADA: 'Rechazada',
}

onMounted(loadData)
</script>

<template>
  <div class="facturacion-view">
    <div class="page-header">
      <div>
        <span class="text-small">Contabilidad</span>
        <h1 class="text-title">Facturación</h1>
        <p class="text-body">{{ facturas.length }} facturas registradas</p>
      </div>
      <div class="header-actions">
        <Button label="Nueva factura" icon="fa-solid fa-plus" size="large" @click="openCreate" />
      </div>
    </div>

    <Message v-if="successMessage" severity="success" closable>{{ successMessage }}</Message>

    <div class="stats-grid">
      <div class="stat-card">
        <i class="fa-solid fa-clock stat-icon pending"></i>
        <div class="stat-info">
          <span class="stat-value">{{ stats.porFacturar }}</span>
          <span class="stat-label">Por Facturar</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="fa-solid fa-check-circle stat-icon done"></i>
        <div class="stat-info">
          <span class="stat-value">{{ stats.autorizadas }}</span>
          <span class="stat-label">Autorizadas SRI</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="fa-solid fa-xmark-circle stat-icon rejected"></i>
        <div class="stat-info">
          <span class="stat-value">{{ stats.rechazadas }}</span>
          <span class="stat-label">Rechazadas</span>
        </div>
      </div>
    </div>

    <div v-if="!hasFacturas && !loading" class="empty-state">
      <div class="empty-icon">
        <i class="fa-solid fa-file-invoice-dollar"></i>
      </div>
      <h2 class="empty-title">No hay facturas registradas</h2>
      <p class="empty-text">
        Crea tu primera factura para comenzar a gestionar la facturación electrónica del sistema.
      </p>
      <Button label="Crear primera factura" icon="fa-solid fa-plus" size="large" class="empty-cta" @click="openCreate" />
    </div>

    <div v-if="hasFacturas" class="data-card">
      <DataTable :value="facturas" :loading="loading" paginator :rows="10" striped-rows>
        <Column field="numeroFactura" header="N. Factura" sortable />
        <Column header="Perito">
          <template #body="{ data }">
            <span>{{ typeof data.peritoId === 'object' ? `${data.peritoId.nombres} ${data.peritoId.apellidos}` : data.peritoId }}</span>
          </template>
        </Column>
        <Column field="clienteNombre" header="Cliente" sortable />
        <Column field="clienteRuc" header="RUC" />
        <Column header="Total">
          <template #body="{ data }">
            <span>{{ formatCurrency(data.total) }}</span>
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
              <Button icon="fa-solid fa-trash" text rounded severity="danger" @click="removeFactura(data._id)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="dialogVisible" :header="isEditing ? 'Editar factura' : 'Nueva factura'" modal :style="{ width: '34rem' }">
      <div class="form-grid">
        <Message v-if="errorMessage" severity="error" class="w-full">{{ errorMessage }}</Message>

        <div class="field full">
          <label>Número de Factura</label>
          <InputText v-model="form.numeroFactura" placeholder="001-001-000000001" fluid />
        </div>
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
          <label>Cliente</label>
          <InputText v-model="form.clienteNombre" placeholder="Nombre del cliente" fluid />
        </div>
        <div class="field">
          <label>RUC Cliente</label>
          <InputText v-model="form.clienteRuc" placeholder="13 dígitos" maxlength="13" fluid />
        </div>
        <div class="field">
          <label>Subtotal</label>
          <InputNumber v-model="form.subtotal" :min="0" :max="9999999" :min-fraction-digits="2" fluid @input="calcTotal" />
        </div>
        <div class="field">
          <label>IVA</label>
          <InputNumber v-model="form.iva" :min="0" :max="9999999" :min-fraction-digits="2" fluid @input="calcTotal" />
        </div>
        <div class="field">
          <label>Total</label>
          <InputNumber v-model="form.total" :min="0" :max="9999999" :min-fraction-digits="2" fluid disabled />
        </div>
        <div class="field">
          <label>Estado</label>
          <Select v-model="form.estado" :options="estados" placeholder="Seleccionar" fluid />
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
.facturacion-view {
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

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }

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
    &.rejected { background-color: rgba(#ef4444, 0.1); color: #ef4444; }
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
