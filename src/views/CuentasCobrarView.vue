<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import type { Cliente } from '@/types'
import { catalogService } from '@/services/catalog.service'
import { useConfirm } from '@/composables/useConfirm'

const loading = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const errorMessage = ref('')
const searchQuery = ref('')

const clientes = ref<Cliente[]>([])

const form = ref({ nombre: '', ruc: '', direccion: '', tipo: 'EMPRESA' as Cliente['tipo'] })
const editingId = ref('')

const tipoOptions = [
  { label: 'Banco', value: 'BANCO' },
  { label: 'Empresa', value: 'EMPRESA' },
  { label: 'Particular', value: 'PARTICULAR' },
]

const filteredClientes = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return clientes.value
  return clientes.value.filter((cliente) =>
    [cliente.nombre, cliente.ruc, cliente.direccion, cliente.tipo].filter(Boolean).some((value) => String(value).toLowerCase().includes(q))
  )
})

async function loadData() {
  loading.value = true
  try {
    clientes.value = await catalogService.findAll('clientes')
  } catch {
    clientes.value = []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEditing.value = false
  editingId.value = ''
  errorMessage.value = ''
  form.value = { nombre: '', ruc: '', direccion: '', tipo: 'EMPRESA' }
  dialogVisible.value = true
}

function openEdit(item: Cliente) {
  isEditing.value = true
  editingId.value = item._id
  errorMessage.value = ''
  form.value = { nombre: item.nombre, ruc: item.ruc || '', direccion: item.direccion || '', tipo: item.tipo || 'EMPRESA' }
  dialogVisible.value = true
}

async function save() {
  errorMessage.value = ''
  try {
    if (isEditing.value) {
      await catalogService.update('clientes', editingId.value, form.value)
    } else {
      await catalogService.create('clientes', form.value)
    }
    dialogVisible.value = false
    await loadData()
  } catch (error: unknown) {
    const apiError = error as { message?: string; data?: { message?: string } }
    errorMessage.value = apiError.data?.message || apiError.message || 'Error al guardar'
  }
}

const { confirm: confirmDelete } = useConfirm()

async function removeItem(id: string) {
  const ok = await confirmDelete({ message: '¿Eliminar este cliente de CxC? Esta acción no se puede deshacer.' })
  if (!ok) return
  try {
    await catalogService.remove('clientes', id)
    await loadData()
  } catch {
    // handled silently
  }
}

onMounted(loadData)
</script>

<template>
  <div class="cxc-view">
    <div class="page-header">
      <div>
        <span class="text-small">Cuentas por Cobrar</span>
        <h1 class="text-title">Clientes</h1>
        <p class="text-body">Maestro de clientes usado por facturación y cobranza</p>
      </div>
      <div class="header-actions">
        <span class="p-input-icon-left search-input">
          <i class="fa-solid fa-search" />
          <InputText v-model="searchQuery" placeholder="Buscar cliente..." />
        </span>
        <Button label="Nuevo cliente" icon="fa-solid fa-plus" size="large" @click="openCreate" />
      </div>
    </div>

    <div class="info-banner">
      <i class="fa-solid fa-circle-info"></i>
      <p>Los clientes de facturación y cobranza deben registrarse aquí para que luego puedan prellenarse en la pre-factura.</p>
    </div>

    <div class="data-card">
      <DataTable :value="filteredClientes" :loading="loading" paginator :rows="10" striped-rows>
        <Column field="nombre" header="Nombre" sortable />
        <Column field="ruc" header="RUC" />
        <Column header="Tipo">
          <template #body="{ data }">
            <Tag :value="data.tipo || 'EMPRESA'" />
          </template>
        </Column>
        <Column field="direccion" header="Dirección" />
        <Column header="Acciones">
          <template #body="{ data }">
            <div class="actions">
              <Button icon="fa-solid fa-pen" text rounded @click="openEdit(data)" />
              <Button icon="fa-solid fa-trash" text rounded severity="danger" @click="removeItem(data._id)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="dialogVisible" :header="isEditing ? 'Editar cliente' : 'Nuevo cliente'" modal :style="{ width: '40rem' }">
      <Message v-if="errorMessage" severity="error" class="dialog-error">{{ errorMessage }}</Message>
      <div class="form-grid">
        <div class="field full-width"><label>Nombre / Razón Social</label><InputText v-model="form.nombre" fluid /></div>
        <div class="field"><label>RUC / Cédula</label><InputText v-model="form.ruc" fluid /></div>
        <div class="field"><label>Tipo</label><Dropdown v-model="form.tipo" :options="tipoOptions" option-label="label" option-value="value" fluid /></div>
        <div class="field full-width"><label>Dirección</label><InputText v-model="form.direccion" fluid /></div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="dialogVisible = false" />
        <Button label="Guardar" @click="save" />
      </template>
    </Dialog>
  </div>
</template>

<style lang="scss" scoped>
.cxc-view { display: flex; flex-direction: column; gap: 1.5rem; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; flex-wrap: wrap; h1 { margin: 0; } .text-body { margin: 0.25rem 0 0 0; font-size: 0.875rem; color: $text-secondary; } }
.header-actions { display: flex; align-items: center; gap: 0.75rem; }
.search-input :deep(input) { width: 220px; }
.info-banner { display: flex; align-items: flex-start; gap: 0.85rem; padding: 1rem 1.25rem; border: 1px solid rgba($primary, 0.12); border-radius: 1rem; background: rgba($primary, 0.05); color: $text-primary; i { color: $primary; margin-top: 0.15rem; } p { margin: 0; line-height: 1.5; } }
.data-card { background-color: $bg-surface; border: 1px solid $border-color; border-radius: 1rem; padding: 1rem; overflow: hidden; }
.actions { display: flex; gap: 0.25rem; }
.dialog-error { margin-bottom: 1rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; .field { display: flex; flex-direction: column; gap: 0.5rem; label { font-size: 0.875rem; font-weight: 600; color: $text-primary; } } .full-width { grid-column: 1 / -1; } }
@media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } }
</style>
