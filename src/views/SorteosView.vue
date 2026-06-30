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
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import DatePicker from '@/components/DatePicker.vue'
import { sorteoService } from '@/services/sorteo.service'
import { peritoService } from '@/services/perito.service'
import { catalogService } from '@/services/catalog.service'
import { useConfirm } from '@/composables/useConfirm'
import type { Juez, Juzgado, Perito, Sorteo, SorteoEstado, UnidadJudicial } from '@/types'

type SorteoForm = Omit<Sorteo, '_id'> & { _id?: string }

const today = new Date().toISOString().split('T')[0] || ''

const emptyForm = (): SorteoForm => ({
  numeroJuicio: '',
  actor: '',
  demandado: '',
  tipoMateria: '',
  estado: 'ASIGNADO',
  fechaAsignacion: today,
  fechaDesignacion: today,
  dependencia: '',
  ciudad: '',
  juzgado: '',
  juez: '',
  peritoId: '',
  proceso: '',
  tipoDesignacion: 'SORTEO',
  accionInfraccion: '',
  fechas: {},
  especialidad: {},
  informacionDemandado: {},
  prefactura: {},
  cobranza: {},
  contacto: {},
  impugnacion: {},
  observaciones: '',
})

const sorteos = ref<Sorteo[]>([])
const peritos = ref<Perito[]>([])
const juzgados = ref<Juzgado[]>([])
const unidades = ref<UnidadJudicial[]>([])
const jueces = ref<Juez[]>([])
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

const form = ref<SorteoForm>(emptyForm())

const estados: SorteoEstado[] = [
  'ASIGNADO',
  'EN_PROCESO',
  'DILIGENCIA_PROGRAMADA',
  'INFORME_ENTREGADO',
  'FACTURADO',
  'CERRADO',
]

const designaciones = ['SORTEO', 'DESIGNACION DIRECTA', 'REASIGNACION']

const hasSorteos = computed(() => sorteos.value.length > 0)

const peritoOptions = computed(() => peritos.value.map((p) => ({ label: peritoLabel(p), value: p._id })))
const juzgadoOptions = computed(() => juzgados.value.map((j) => ({ label: j.ciudad ? `${j.nombre} — ${j.ciudad}` : j.nombre, value: j.nombre })))
const unidadOptions = computed(() => unidades.value.map((u) => ({ label: u.ciudad ? `${u.nombre} — ${u.ciudad}` : u.nombre, value: u.nombre })))
const juezOptions = computed(() => jueces.value.map((j) => ({ label: `${j.nombres} ${j.apellidos}`, value: `${j.nombres} ${j.apellidos}` })))

const filteredSorteos = computed(() => {
  let result = sorteos.value
  if (activeFilter.value) {
    result = result.filter((s) => s.estado === activeFilter.value)
  }
  const q = searchQuery.value.toLowerCase()
  if (q) {
    result = result.filter((s) => {
      const perito = s.peritoId && typeof s.peritoId === 'object' ? `${s.peritoId.nombres} ${s.peritoId.apellidos}` : ''
      return [s.numeroJuicio, s.actor, s.demandado, s.dependencia, s.juzgado, s.ciudad, perito]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    })
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
    // keep defaults
  }
}

async function loadData() {
  loading.value = true
  try {
    const [s, p, jz, u, j] = await Promise.all([
      sorteoService.findAll(),
      peritoService.findAll(),
      catalogService.findAll('juzgados'),
      catalogService.findAll('unidades-judiciales'),
      catalogService.findAll('jueces'),
    ])
    sorteos.value = s
    peritos.value = p
    juzgados.value = jz
    unidades.value = u
    jueces.value = j
    await loadStats()
  } catch {
    sorteos.value = []
  } finally {
    loading.value = false
  }
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-EC').format(date)
}

function peritoLabel(p: Perito): string {
  return `${p.codigoRegistro} — ${p.nombres} ${p.apellidos}`
}

function peritoDisplay(pid: string | { _id: string; nombres: string; apellidos: string; ruc: string; codigoRegistro?: string } | null | undefined): string {
  if (!pid) return '—'
  if (typeof pid === 'object') return `${pid.codigoRegistro ? `${pid.codigoRegistro} — ` : ''}${pid.nombres} ${pid.apellidos}`
  return pid
}

function openCreate() {
  isEditing.value = false
  errorMessage.value = ''
  form.value = emptyForm()
  dialogVisible.value = true
}

function openEdit(sorteo: Sorteo) {
  isEditing.value = true
  errorMessage.value = ''
  form.value = {
    ...emptyForm(),
    ...JSON.parse(JSON.stringify(sorteo)),
    _id: sorteo._id,
    fechas: { ...emptyForm().fechas, ...(sorteo.fechas || {}) },
    especialidad: { ...emptyForm().especialidad, ...(sorteo.especialidad || {}) },
    informacionDemandado: { ...emptyForm().informacionDemandado, ...(sorteo.informacionDemandado || {}) },
    prefactura: { ...emptyForm().prefactura, ...(sorteo.prefactura || {}) },
    cobranza: { ...emptyForm().cobranza, ...(sorteo.cobranza || {}) },
    contacto: { ...emptyForm().contacto, ...(sorteo.contacto || {}) },
    impugnacion: { ...emptyForm().impugnacion, ...(sorteo.impugnacion || {}) },
  }
  dialogVisible.value = true
}

async function saveSorteo() {
  errorMessage.value = ''
  try {
    const payload = JSON.parse(JSON.stringify(form.value)) as SorteoForm
    if (isEditing.value && form.value._id) {
      delete payload._id
      await sorteoService.update(form.value._id, payload)
    } else {
      delete payload._id
      await sorteoService.create(payload)
    }
    dialogVisible.value = false
    await loadData()
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
    await loadData()
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
  { key: 'DILIGENCIA_PROGRAMADA' as SorteoEstado, icon: 'fa-solid fa-calendar-check', class: 'scheduled', label: 'Programados', valueKey: 'enProceso' as const },
  { key: 'CERRADO' as SorteoEstado, icon: 'fa-solid fa-check-circle', class: 'done', label: 'Cerrados', valueKey: 'cerrados' as const },
  { key: 'ASIGNADO' as SorteoEstado, icon: 'fa-solid fa-file-invoice-dollar', class: 'billing', label: 'Asignados', valueKey: 'asignados' as const },
]

onMounted(loadData)
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
      <div class="empty-icon"><i class="fa-solid fa-gavel"></i></div>
      <h2 class="empty-title">Aún no hay sorteos registrados</h2>
      <p class="empty-text">Crea tu primer sorteo y deja listo el flujo completo: perito, fechas, pre-factura y contacto.</p>
      <Button label="Crear primer sorteo" icon="fa-solid fa-plus" size="large" class="empty-cta" @click="openCreate" />
    </div>

    <div v-if="hasSorteos" class="data-card">
      <DataTable :value="filteredSorteos" :loading="loading" paginator :rows="10" striped-rows>
        <Column field="numeroJuicio" header="N. Juicio" sortable />
        <Column field="dependencia" header="Dependencia" sortable />
        <Column field="ciudad" header="Ciudad" sortable />
        <Column header="Perito Asignado">
          <template #body="{ data }">
            <span>{{ peritoDisplay(data.peritoId) }}</span>
          </template>
        </Column>
        <Column field="fechaDesignacion" header="Fecha" sortable>
          <template #body="{ data }">
            <span>{{ formatDate(data.fechaDesignacion || data.fechaAsignacion) }}</span>
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
              <Button icon="fa-solid fa-trash" text rounded severity="danger" @click="removeSorteo(data._id!)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="dialogVisible" :header="isEditing ? 'Editar sorteo' : 'Nuevo sorteo'" modal :style="{ width: '74rem' }">
      <Message v-if="errorMessage" severity="error" class="dialog-error">{{ errorMessage }}</Message>

      <Tabs value="datos" scrollable>
        <TabList>
          <Tab value="datos">Datos</Tab>
          <Tab value="fechas">Fechas</Tab>
          <Tab value="especialidad">Especialidad</Tab>
          <Tab value="demandado">Demandado</Tab>
          <Tab value="prefactura">Pre-factura</Tab>
          <Tab value="contacto">Contacto</Tab>
          <Tab value="impugnacion">Impugnación</Tab>
        </TabList>

        <TabPanels>
          <TabPanel value="datos">
            <div class="form-grid">
              <div class="field"><label>Número de Juicio</label><InputText v-model="form.numeroJuicio" fluid /></div>
              <div class="field"><label>Materia</label><Select v-model="form.tipoMateria" :options="['CIVIL', 'FAMILIA', 'INQUILINATO', 'LABORAL', 'PENAL', 'TRANSITO', 'CONTENCIOSO']" fluid /></div>
              <div class="field"><label>Estado</label><Select v-model="form.estado" :options="estados" fluid /></div>
              <div class="field"><label>Fecha Designación</label><DatePicker v-model="form.fechaDesignacion" /></div>
              <div class="field"><label>Fecha Asignación</label><DatePicker v-model="form.fechaAsignacion" /></div>
              <div class="field"><label>Tipo Designación</label><Select v-model="form.tipoDesignacion" :options="designaciones" fluid /></div>
              <div class="field"><label>Proceso</label><InputText v-model="form.proceso" fluid /></div>
              <div class="field"><label>Dependencia Judicial</label><Select v-model="form.dependencia" :options="unidadOptions" option-label="label" option-value="value" filter fluid /></div>
              <div class="field"><label>Juzgado</label><Select v-model="form.juzgado" :options="juzgadoOptions" option-label="label" option-value="value" filter fluid /></div>
              <div class="field"><label>Ciudad</label><InputText v-model="form.ciudad" fluid /></div>
              <div class="field"><label>Juez</label><Select v-model="form.juez" :options="juezOptions" option-label="label" option-value="value" filter fluid /></div>
              <div class="field full-width"><label>Perito Asignado</label><Select v-model="form.peritoId" :options="peritoOptions" option-label="label" option-value="value" filter fluid /></div>
              <div class="field full-width"><label>Actor(es) / Ofendido(s)</label><InputText v-model="form.actor" fluid /></div>
              <div class="field full-width"><label>Demandado(s) / Procesado(s)</label><InputText v-model="form.demandado" fluid /></div>
              <div class="field full-width"><label>Acción / Infracción</label><InputText v-model="form.accionInfraccion" fluid /></div>
              <div class="field full-width"><label>Observaciones</label><Textarea v-model="form.observaciones" rows="3" fluid /></div>
            </div>
          </TabPanel>

          <TabPanel value="fechas">
            <div class="form-grid two-col">
              <div class="field"><label>Fecha Notificación</label><DatePicker v-model="form.fechas!.fechaNotificacion" /></div>
              <div class="field"><label>Fecha Vencimiento</label><DatePicker v-model="form.fechas!.fechaVencimiento" /></div>
              <div class="field"><label>Fecha Posesión</label><DatePicker v-model="form.fechas!.fechaPosesion" /></div>
              <div class="field"><label>Fecha Revisión</label><DatePicker v-model="form.fechas!.fechaRevision" /></div>
              <div class="field"><label>Fecha Entrega</label><DatePicker v-model="form.fechas!.fechaEntrega" /></div>
            </div>
          </TabPanel>

          <TabPanel value="especialidad">
            <div class="form-grid two-col">
              <div class="field"><label>Profesión</label><InputText v-model="form.especialidad!.profesion" fluid /></div>
              <div class="field"><label>Especialidad</label><InputText v-model="form.especialidad!.especialidad" fluid /></div>
            </div>
          </TabPanel>

          <TabPanel value="demandado">
            <div class="form-grid two-col">
              <div class="field"><label>Tipo Identificación</label><InputText v-model="form.informacionDemandado!.tipoIdentificacion" fluid /></div>
              <div class="field"><label>Identificación</label><InputText v-model="form.informacionDemandado!.identificacion" fluid /></div>
              <div class="field"><label>Op. Anterior / Tarjeta</label><InputText v-model="form.informacionDemandado!.opAnteriorTarjeta" fluid /></div>
              <div class="field"><label>Op. Actual / Tarjeta</label><InputText v-model="form.informacionDemandado!.opActualTarjeta" fluid /></div>
              <div class="field full-width"><label>Observación</label><Textarea v-model="form.informacionDemandado!.observacion" rows="4" fluid /></div>
            </div>
          </TabPanel>

          <TabPanel value="prefactura">
            <div class="section-note">Este bloque queda listo para confirmar en Facturación.</div>
            <div class="form-grid two-col">
              <div class="field full-width"><label>Cliente / Razón Social</label><InputText v-model="form.prefactura!.clienteNombre" fluid /></div>
              <div class="field"><label>RUC / Cédula</label><InputText v-model="form.prefactura!.clienteRuc" fluid /></div>
              <div class="field"><label>Correo</label><InputText v-model="form.prefactura!.correo" fluid /></div>
              <div class="field full-width"><label>Item</label><InputText v-model="form.prefactura!.item" fluid /></div>
              <div class="field"><label>Base imponible</label><InputNumber v-model="form.prefactura!.valorBaseImponible" :min="0" :min-fraction-digits="2" fluid /></div>
              <div class="field"><label>IVA</label><InputNumber v-model="form.prefactura!.iva" :min="0" :min-fraction-digits="2" fluid /></div>
              <div class="field"><label>Total</label><InputNumber v-model="form.prefactura!.total" :min="0" :min-fraction-digits="2" fluid /></div>
              <div class="field"><label>Retención IVA</label><InputNumber v-model="form.prefactura!.retencionIva" :min="0" :min-fraction-digits="2" fluid /></div>
              <div class="field"><label>Retención fuente</label><InputNumber v-model="form.prefactura!.retencionFuente" :min="0" :min-fraction-digits="2" fluid /></div>
              <div class="field"><label>Factura No.</label><InputText v-model="form.prefactura!.facturaNo" fluid /></div>
              <div class="field"><label>Fecha Emisión</label><DatePicker v-model="form.prefactura!.fechaEmisionFactura" /></div>
              <div class="field"><label>Retención No.</label><InputText v-model="form.prefactura!.retencionNo" fluid /></div>
              <div class="field"><label>Serie</label><InputText v-model="form.prefactura!.serie" fluid /></div>
            </div>
            <div class="form-grid two-col cobranza-box">
              <div class="field"><label>Total cobranza</label><InputNumber v-model="form.cobranza!.totalCobranza" :min="0" :min-fraction-digits="2" fluid /></div>
              <div class="field"><label>Estado cobranza</label><InputText v-model="form.cobranza!.estadoCobranza" fluid /></div>
              <div class="field"><label>Movilización</label><InputNumber v-model="form.cobranza!.movilidad" :min="0" :min-fraction-digits="2" fluid /></div>
              <div class="field"><label>Adicional</label><InputNumber v-model="form.cobranza!.adicional" :min="0" :min-fraction-digits="2" fluid /></div>
              <div class="field"><label>Medio de pago</label><InputText v-model="form.cobranza!.medioPago" fluid /></div>
              <div class="field"><label>Cuenta bancaria</label><InputText v-model="form.cobranza!.cuentaBancaria" fluid /></div>
              <div class="field"><label>Fecha liquidación</label><DatePicker v-model="form.cobranza!.fechaLiquidacion" /></div>
              <div class="field"><label>Fecha cancelación</label><DatePicker v-model="form.cobranza!.fechaCancelacion" /></div>
              <div class="field full-width"><label>Observación</label><Textarea v-model="form.cobranza!.observacion" rows="3" fluid /></div>
            </div>
          </TabPanel>

          <TabPanel value="contacto">
            <div class="form-grid two-col">
              <div class="field"><label>Estudio Jurídico</label><InputText v-model="form.contacto!.estudioJuridico" fluid /></div>
              <div class="field"><label>Cliente</label><InputText v-model="form.contacto!.cliente" fluid /></div>
              <div class="field"><label>Nombre</label><InputText v-model="form.contacto!.nombre" fluid /></div>
              <div class="field"><label>Teléfono</label><InputText v-model="form.contacto!.telefono" fluid /></div>
              <div class="field full-width"><label>Dirección</label><InputText v-model="form.contacto!.direccion" fluid /></div>
              <div class="field"><label>Correo</label><InputText v-model="form.contacto!.correo" fluid /></div>
              <div class="field full-width"><label>Observación</label><Textarea v-model="form.contacto!.observacion" rows="4" fluid /></div>
            </div>
          </TabPanel>

          <TabPanel value="impugnacion">
            <div class="form-grid two-col">
              <div class="field"><label>Estado</label><InputText v-model="form.impugnacion!.estado" fluid /></div>
              <div class="field"><label>Fecha</label><DatePicker v-model="form.impugnacion!.fecha" /></div>
              <div class="field full-width"><label>Observación</label><Textarea v-model="form.impugnacion!.observacion" rows="4" fluid /></div>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <template #footer>
        <Button label="Cancelar" text @click="dialogVisible = false" />
        <Button label="Guardar" @click="saveSorteo" />
      </template>
    </Dialog>
  </div>
</template>

<style lang="scss" scoped>
.sorteos-view { display: flex; flex-direction: column; gap: 1.5rem; }

.page-header {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
  h1 { margin: 0; }
  .text-body { margin: 0.25rem 0 0 0; font-size: 0.875rem; color: $text-secondary; }
}

.header-actions { display: flex; align-items: center; gap: 0.75rem; }
.search-input :deep(input) { width: 220px; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
.stat-card {
  background-color: $bg-surface; border: 1px solid $border-color; border-radius: 0.875rem; padding: 1.25rem;
  display: flex; align-items: center; gap: 1rem; text-align: left;
  .stat-icon { font-size: 1.5rem; width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; border-radius: 0.75rem;
    &.total { background-color: rgba($primary, 0.1); color: $primary; }
    &.active { background-color: rgba(#f59e0b, 0.1); color: #f59e0b; }
    &.scheduled { background-color: rgba(#3b82f6, 0.1); color: #3b82f6; }
    &.done { background-color: rgba(#10b981, 0.1); color: #10b981; }
    &.billing { background-color: rgba(#8b5cf6, 0.1); color: #8b5cf6; }
  }
  .stat-info { display: flex; flex-direction: column; }
  .stat-value { font-size: 1.5rem; font-weight: 700; color: $text-primary; line-height: 1; }
  .stat-label { font-size: 0.8125rem; color: $text-secondary; margin-top: 0.25rem; }
  &.active { border-color: rgba($primary, 0.35); box-shadow: 0 0 0 1px rgba($primary, 0.12) inset; }
}

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
  padding: 4rem 2rem; background-color: $bg-surface; border: 1px dashed $border-color; border-radius: 1.25rem; min-height: 360px;
}
.empty-icon { width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; background-color: rgba($primary, 0.06); border: 1px solid rgba($primary, 0.12); border-radius: 1.25rem; margin-bottom: 1.5rem; i { font-size: 2rem; color: $primary; } }
.empty-title { font-size: 1.25rem; font-weight: 600; color: $text-primary; margin: 0 0 0.5rem 0; }
.empty-text { font-size: 0.9375rem; color: $text-secondary; margin: 0 0 1.5rem 0; max-width: 420px; line-height: 1.6; }
.empty-cta { min-width: 200px; }

.data-card { background-color: $bg-surface; border: 1px solid $border-color; border-radius: 1rem; padding: 1rem; overflow: hidden; }
.actions { display: flex; gap: 0.25rem; }
.dialog-error { margin-bottom: 1rem; }
.section-note { margin-bottom: 1rem; padding: 0.75rem 1rem; border-radius: 0.75rem; background: rgba($primary, 0.06); color: $text-primary; }
.cobranza-box { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid $border-color; }

.form-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;
  .field { display: flex; flex-direction: column; gap: 0.5rem; label { font-size: 0.875rem; font-weight: 600; color: $text-primary; } }
  .full-width { grid-column: 1 / -1; }
}
.two-col { grid-template-columns: repeat(2, 1fr); }

@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
  .two-col { grid-template-columns: 1fr; }
  .empty-state { padding: 2.5rem 1.5rem; min-height: 280px; }
}
</style>
