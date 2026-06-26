<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import type { Juez, Juzgado, UnidadJudicial, Cliente } from '@/types'
import { catalogService } from '@/services/catalog.service'
import { useConfirm } from '@/composables/useConfirm'

type TabKey = 'jueces' | 'juzgados' | 'unidades-judiciales' | 'clientes'

const activeTab = ref<TabKey>('jueces')
const loading = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const errorMessage = ref('')

const jueces = ref<Juez[]>([])
const juzgados = ref<Juzgado[]>([])
const unidades = ref<UnidadJudicial[]>([])
const clientes = ref<Cliente[]>([])

const juezForm = ref({ nombres: '', apellidos: '', email: '', telefono: '' })
const juzgadoForm = ref({ nombre: '', direccion: '', ciudad: '', zona: 'OTRO' as Juzgado['zona'] })
const unidadForm = ref({ nombre: '', juzgadoId: '', direccion: '', ciudad: '', zona: 'OTRO' as UnidadJudicial['zona'] })
const clienteForm = ref({ nombre: '', ruc: '', direccion: '', tipo: 'EMPRESA' as Cliente['tipo'] })

const editingId = ref('')

const zonaOptions = [
  { label: 'Centro', value: 'CENTRO' },
  { label: 'Norte', value: 'NORTE' },
  { label: 'Sur', value: 'SUR' },
  { label: 'Otro', value: 'OTRO' },
]

const tipoOptions = [
  { label: 'Banco', value: 'BANCO' },
  { label: 'Empresa', value: 'EMPRESA' },
  { label: 'Particular', value: 'PARTICULAR' },
]

async function loadData() {
  loading.value = true
  try {
    const [j, jz, u, c] = await Promise.all([
      catalogService.findAll('jueces'),
      catalogService.findAll('juzgados'),
      catalogService.findAll('unidades-judiciales'),
      catalogService.findAll('clientes'),
    ])
    jueces.value = j
    juzgados.value = jz
    unidades.value = u
    clientes.value = c
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEditing.value = false
  editingId.value = ''
  errorMessage.value = ''
  juezForm.value = { nombres: '', apellidos: '', email: '', telefono: '' }
  juzgadoForm.value = { nombre: '', direccion: '', ciudad: '', zona: 'OTRO' }
  unidadForm.value = { nombre: '', juzgadoId: '', direccion: '', ciudad: '', zona: 'OTRO' }
  clienteForm.value = { nombre: '', ruc: '', direccion: '', tipo: 'EMPRESA' }
  dialogVisible.value = true
}

function openEditJuez(item: Juez) {
  isEditing.value = true
  editingId.value = item._id
  juezForm.value = { nombres: item.nombres, apellidos: item.apellidos, email: item.email || '', telefono: item.telefono || '' }
  dialogVisible.value = true
}

function openEditJuzgado(item: Juzgado) {
  isEditing.value = true
  editingId.value = item._id
  juzgadoForm.value = { nombre: item.nombre, direccion: item.direccion || '', ciudad: item.ciudad || '', zona: item.zona || 'OTRO' }
  dialogVisible.value = true
}

function openEditUnidad(item: UnidadJudicial) {
  isEditing.value = true
  editingId.value = item._id
  unidadForm.value = { nombre: item.nombre, juzgadoId: item.juzgadoId || '', direccion: item.direccion || '', ciudad: item.ciudad || '', zona: item.zona || 'OTRO' }
  dialogVisible.value = true
}

function openEditCliente(item: Cliente) {
  isEditing.value = true
  editingId.value = item._id
  clienteForm.value = { nombre: item.nombre, ruc: item.ruc || '', direccion: item.direccion || '', tipo: item.tipo || 'EMPRESA' }
  dialogVisible.value = true
}

async function save() {
  errorMessage.value = ''
  try {
    if (activeTab.value === 'jueces') {
      if (isEditing.value) await catalogService.update('jueces', editingId.value, juezForm.value)
      else await catalogService.create('jueces', juezForm.value)
    } else if (activeTab.value === 'juzgados') {
      if (isEditing.value) await catalogService.update('juzgados', editingId.value, juzgadoForm.value)
      else await catalogService.create('juzgados', juzgadoForm.value)
    } else if (activeTab.value === 'unidades-judiciales') {
      if (isEditing.value) await catalogService.update('unidades-judiciales', editingId.value, unidadForm.value)
      else await catalogService.create('unidades-judiciales', unidadForm.value)
    } else if (activeTab.value === 'clientes') {
      if (isEditing.value) await catalogService.update('clientes', editingId.value, clienteForm.value)
      else await catalogService.create('clientes', clienteForm.value)
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
  const ok = await confirmDelete({ message: '¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.' })
  if (!ok) return
  try {
    await catalogService.remove(activeTab.value, id)
    await loadData()
  } catch (error) {
    console.error(error)
  }
}

onMounted(loadData)
</script>

<template>
  <div class="catalogos-view">
    <div class="page-header">
      <div>
        <span class="text-small">Catálogos</span>
        <h1 class="text-title">Catálogos del sistema</h1>
      </div>
      <Button label="Nuevo registro" icon="fa-solid fa-plus" @click="openCreate" />
    </div>

    <div class="data-card">
      <Tabs v-model:value="activeTab" scrollable>
        <TabList>
          <Tab value="jueces">Jueces</Tab>
          <Tab value="juzgados">Juzgados</Tab>
          <Tab value="unidades-judiciales">Unidades judiciales</Tab>
          <Tab value="clientes">Clientes</Tab>
        </TabList>

        <TabPanels>
          <TabPanel value="jueces">
            <DataTable :value="jueces" :loading="loading" paginator :rows="10" striped-rows>
              <Column field="nombres" header="Nombres" sortable />
              <Column field="apellidos" header="Apellidos" sortable />
              <Column field="email" header="Email" />
              <Column field="telefono" header="Teléfono" />
              <Column header="Acciones">
                <template #body="{ data }">
                  <div class="actions">
                    <Button icon="fa-solid fa-pen" text rounded @click="openEditJuez(data)" />
                    <Button icon="fa-solid fa-trash" text rounded severity="danger" @click="removeItem(data._id)" />
                  </div>
                </template>
              </Column>
            </DataTable>
          </TabPanel>

          <TabPanel value="juzgados">
            <DataTable :value="juzgados" :loading="loading" paginator :rows="10" striped-rows>
              <Column field="nombre" header="Nombre" sortable />
              <Column field="ciudad" header="Ciudad" />
              <Column field="zona" header="Zona" />
              <Column header="Acciones">
                <template #body="{ data }">
                  <div class="actions">
                    <Button icon="fa-solid fa-pen" text rounded @click="openEditJuzgado(data)" />
                    <Button icon="fa-solid fa-trash" text rounded severity="danger" @click="removeItem(data._id)" />
                  </div>
                </template>
              </Column>
            </DataTable>
          </TabPanel>

          <TabPanel value="unidades-judiciales">
            <DataTable :value="unidades" :loading="loading" paginator :rows="10" striped-rows>
              <Column field="nombre" header="Nombre" sortable />
              <Column field="ciudad" header="Ciudad" />
              <Column field="zona" header="Zona" />
              <Column header="Acciones">
                <template #body="{ data }">
                  <div class="actions">
                    <Button icon="fa-solid fa-pen" text rounded @click="openEditUnidad(data)" />
                    <Button icon="fa-solid fa-trash" text rounded severity="danger" @click="removeItem(data._id)" />
                  </div>
                </template>
              </Column>
            </DataTable>
          </TabPanel>

          <TabPanel value="clientes">
            <DataTable :value="clientes" :loading="loading" paginator :rows="10" striped-rows>
              <Column field="nombre" header="Nombre" sortable />
              <Column field="ruc" header="RUC" />
              <Column field="tipo" header="Tipo" />
              <Column header="Acciones">
                <template #body="{ data }">
                  <div class="actions">
                    <Button icon="fa-solid fa-pen" text rounded @click="openEditCliente(data)" />
                    <Button icon="fa-solid fa-trash" text rounded severity="danger" @click="removeItem(data._id)" />
                  </div>
                </template>
              </Column>
            </DataTable>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      :header="isEditing ? 'Editar registro' : 'Nuevo registro'"
      modal
      :style="{ width: '28rem' }"
    >
      <div class="form-grid">
        <Message v-if="errorMessage" severity="error" class="w-full">{{ errorMessage }}</Message>

        <template v-if="activeTab === 'jueces'">
          <div class="field"><label>Nombres</label><InputText v-model="juezForm.nombres" fluid /></div>
          <div class="field"><label>Apellidos</label><InputText v-model="juezForm.apellidos" fluid /></div>
          <div class="field"><label>Email</label><InputText v-model="juezForm.email" fluid /></div>
          <div class="field"><label>Teléfono</label><InputText v-model="juezForm.telefono" fluid /></div>
        </template>

        <template v-if="activeTab === 'juzgados'">
          <div class="field full"><label>Nombre</label><InputText v-model="juzgadoForm.nombre" fluid /></div>
          <div class="field"><label>Ciudad</label><InputText v-model="juzgadoForm.ciudad" fluid /></div>
          <div class="field"><label>Zona</label><Dropdown v-model="juzgadoForm.zona" :options="zonaOptions" option-label="label" option-value="value" fluid /></div>
          <div class="field full"><label>Dirección</label><InputText v-model="juzgadoForm.direccion" fluid /></div>
        </template>

        <template v-if="activeTab === 'unidades-judiciales'">
          <div class="field full"><label>Nombre</label><InputText v-model="unidadForm.nombre" fluid /></div>
          <div class="field full">
            <label>Juzgado al que pertenece</label>
            <Dropdown v-model="unidadForm.juzgadoId" :options="juzgados" option-label="nombre" option-value="_id" :filter="true" placeholder="Seleccionar juzgado..." fluid show-clear>
              <template #value="slotProps">
                <span v-if="slotProps.value">{{ juzgados.find(j => j._id === slotProps.value)?.nombre || 'Seleccionar juzgado...' }}</span>
                <span v-else class="placeholder-text">Seleccionar juzgado...</span>
              </template>
              <template #option="slotProps">
                <span>{{ slotProps.option.nombre }} <template v-if="slotProps.option.ciudad">— {{ slotProps.option.ciudad }}</template></span>
              </template>
            </Dropdown>
          </div>
          <div class="field"><label>Ciudad</label><InputText v-model="unidadForm.ciudad" fluid /></div>
          <div class="field"><label>Zona</label><Dropdown v-model="unidadForm.zona" :options="zonaOptions" option-label="label" option-value="value" fluid /></div>
          <div class="field full"><label>Dirección</label><InputText v-model="unidadForm.direccion" fluid /></div>
        </template>

        <template v-if="activeTab === 'clientes'">
          <div class="field full"><label>Nombre</label><InputText v-model="clienteForm.nombre" fluid /></div>
          <div class="field"><label>RUC</label><InputText v-model="clienteForm.ruc" fluid /></div>
          <div class="field"><label>Tipo</label><Dropdown v-model="clienteForm.tipo" :options="tipoOptions" option-label="label" option-value="value" fluid /></div>
          <div class="field full"><label>Dirección</label><InputText v-model="clienteForm.direccion" fluid /></div>
        </template>
      </div>

      <template #footer>
        <Button label="Cancelar" text @click="dialogVisible = false" />
        <Button label="Guardar" @click="save" />
      </template>
    </Dialog>
  </div>
</template>

<style lang="scss" scoped>
.catalogos-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;

  h1 {
    margin: 0;
  }
}

.data-card {
  background-color: $bg-surface;
  border: 1px solid $border-color;
  border-radius: 1rem;
  padding: 1rem;
  overflow: hidden;
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

    &.full {
      grid-column: 1 / -1;
    }

    label {
      font-size: 0.875rem;
      font-weight: 600;
      color: $text-primary;
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
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
