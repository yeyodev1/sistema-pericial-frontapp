<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputSwitch from 'primevue/inputswitch'
import Select from 'primevue/select'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import DatePicker from '@/components/DatePicker.vue'

import type { Perito } from '@/types'
import { peritoService, type CreatePeritoPayload } from '@/services/perito.service'
import { useConfirm } from '@/composables/useConfirm'

const peritos = ref<Perito[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const searchQuery = ref('')

const filteredPeritos = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return peritos.value
  return peritos.value.filter(
    (p) =>
      p.nombres.toLowerCase().includes(q) ||
      p.apellidos.toLowerCase().includes(q) ||
      p.ruc.toLowerCase().includes(q) ||
      (p.email && p.email.toLowerCase().includes(q))
  )
})

const form = ref<CreatePeritoPayload & { _id?: string }>({
  nombres: '',
  apellidos: '',
  ruc: '',
  direccion: '',
  telefono: '',
  email: '',
  cuentasBancarias: [],
  fechaVigenciaCalificacion: '',
  fechaVencimientoFirma: '',
  password: '',
  sendNotification: true,
})

const hasPeritos = computed(() => peritos.value.length > 0)
const passwordAuto = computed(() => !form.value.password)

function addCuenta() {
  form.value.cuentasBancarias!.push({ banco: '', tipoCuenta: 'AHORROS', numeroCuenta: '' })
}

function removeCuenta(index: number) {
  form.value.cuentasBancarias!.splice(index, 1)
}

async function loadPeritos() {
  loading.value = true
  try {
    peritos.value = await peritoService.findAll()
  } catch {
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
    nombres: '',
    apellidos: '',
    ruc: '',
    direccion: '',
    telefono: '',
    email: '',
    cuentasBancarias: [],
    fechaVigenciaCalificacion: '',
    fechaVencimientoFirma: '',
    password: '',
    sendNotification: true,
  }
  dialogVisible.value = true
}

function openEdit(perito: Perito) {
  isEditing.value = true
  errorMessage.value = ''
  successMessage.value = ''
  form.value = {
    ...perito,
    cuentasBancarias: perito.cuentasBancarias ? JSON.parse(JSON.stringify(perito.cuentasBancarias)) : [],
    sendNotification: false,
    password: '',
  }
  dialogVisible.value = true
}

async function savePerito() {
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (isEditing.value && form.value._id) {
      const { sendNotification: _, password, ...updateData } = form.value
      await peritoService.update(form.value._id, updateData)
      dialogVisible.value = false
      await loadPeritos()
    } else {
      const result = await peritoService.create(form.value as CreatePeritoPayload)
      dialogVisible.value = false
      await loadPeritos()

      if (result.notificationSent) {
        successMessage.value = result.passwordGenerated
          ? 'Perito creado. Se generó una contraseña automática y se enviaron las credenciales por correo.'
          : 'Perito creado. Se enviaron las credenciales por correo.'
      } else if (form.value.sendNotification && !form.value.email) {
        successMessage.value = 'Perito creado. No se envió notificación porque no se registró un correo electrónico.'
      } else if (form.value.sendNotification) {
        successMessage.value = 'Perito creado. No se pudo enviar la notificación (verifica la configuración de correo).'
      } else {
        successMessage.value = 'Perito creado correctamente.'
      }
    }
  } catch (error: unknown) {
    const apiError = error as { message?: string; data?: { message?: string } }
    errorMessage.value = apiError.data?.message || apiError.message || 'Error al guardar'
  }
}

const { confirm: confirmDelete } = useConfirm()

async function removePerito(id: string) {
  const ok = await confirmDelete({ message: '¿Estás seguro de eliminar este perito? Los datos no podrán recuperarse.' })
  if (!ok) return
  try {
    await peritoService.remove(id)
    await loadPeritos()
  } catch (error) {
    console.error(error)
  }
}

const firmaDialogVisible = ref(false)
const firmaPeritoId = ref('')
const firmaFile = ref<File | null>(null)
const firmaPassword = ref('')
const uploadingFirma = ref(false)
const firmaError = ref('')
const firmaSuccess = ref('')

function openFirmaUpload(peritoId: string) {
  firmaPeritoId.value = peritoId
  firmaFile.value = null
  firmaPassword.value = ''
  firmaError.value = ''
  firmaSuccess.value = ''
  firmaDialogVisible.value = true
}

function onFirmaFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    firmaFile.value = target.files[0]
  }
}

async function uploadFirma() {
  firmaError.value = ''
  firmaSuccess.value = ''

  if (!firmaFile.value) {
    firmaError.value = 'Selecciona un archivo de firma electrónica (.p12)'
    return
  }
  if (!firmaPassword.value) {
    firmaError.value = 'Ingresa la contraseña de la firma electrónica'
    return
  }

  uploadingFirma.value = true
  try {
    const formData = new FormData()
    formData.append('firma', firmaFile.value)
    formData.append('password', firmaPassword.value)
    await peritoService.uploadFirma(firmaPeritoId.value, formData)
    firmaSuccess.value = 'Firma electrónica subida correctamente'
    setTimeout(() => { firmaDialogVisible.value = false }, 1500)
  } catch (error: unknown) {
    const apiError = error as { message?: string; data?: { message?: string } }
    firmaError.value = apiError.data?.message || apiError.message || 'Error al subir la firma'
  } finally {
    uploadingFirma.value = false
  }
}

onMounted(loadPeritos)
</script>

<template>
  <div class="peritos-view">
    <div class="page-header">
      <div>
        <span class="text-small">Catálogos</span>
        <h1 class="text-title">Peritos</h1>
        <p class="text-body">{{ peritos.length }} peritos registrados</p>
      </div>
      <div class="header-actions">
        <span class="p-input-icon-left search-input">
          <i class="fa-solid fa-search" />
          <InputText v-model="searchQuery" placeholder="Buscar perito..." />
        </span>
        <Button label="Nuevo perito" icon="fa-solid fa-plus" size="large" @click="openCreate" />
      </div>
    </div>

    <Message v-if="successMessage" severity="success" closable>{{ successMessage }}</Message>

    <div v-if="!hasPeritos && !loading" class="empty-state">
      <div class="empty-icon">
        <i class="fa-solid fa-user-tie"></i>
      </div>
      <h2 class="empty-title">Aún no hay peritos registrados</h2>
      <p class="empty-text">
        Crea tu primer perito para comenzar a gestionar sorteos y asignaciones.
        El sistema notificará automáticamente al perito con sus credenciales de acceso.
      </p>
      <Button
        label="Crear primer perito"
        icon="fa-solid fa-plus"
        size="large"
        class="empty-cta"
        @click="openCreate"
      />
    </div>

    <div v-if="hasPeritos" class="data-card">
      <DataTable :value="filteredPeritos" :loading="loading" paginator :rows="10" striped-rows>
        <Column field="nombres" header="Nombres" sortable />
        <Column field="apellidos" header="Apellidos" sortable />
        <Column field="ruc" header="RUC" sortable />
        <Column field="email" header="Email" />
        <Column field="telefono" header="Teléfono" />
        <Column header="Estado">
          <template #body="{ data }">
            <Tag v-if="data.email" severity="success" value="Notificado" />
            <Tag v-else severity="warn" value="Sin correo" />
          </template>
        </Column>
        <Column header="Acciones">
          <template #body="{ data }">
            <div class="actions">
              <Button icon="fa-solid fa-pen" text rounded @click="openEdit(data)" />
              <Button icon="fa-solid fa-file-circle-plus" text rounded @click="openFirmaUpload(data._id)" />
              <Button icon="fa-solid fa-trash" text rounded severity="danger" @click="removePerito(data._id)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Firma Upload Dialog -->
    <Dialog v-model:visible="firmaDialogVisible" header="Subir Firma Electrónica" modal :style="{ width: '28rem' }">
      <div class="firma-form">
        <Message v-if="firmaError" severity="error" closable @close="firmaError = ''">{{ firmaError }}</Message>
        <Message v-if="firmaSuccess" severity="success" closable>{{ firmaSuccess }}</Message>

        <div class="field">
          <label>Archivo .p12 / .pfx</label>
          <input type="file" accept=".p12,.pfx" @change="onFirmaFileChange" class="file-input" />
          <span v-if="firmaFile" class="file-name">{{ firmaFile.name }}</span>
        </div>
        <div class="field">
          <label>Contraseña de la firma</label>
          <InputText v-model="firmaPassword" type="password" placeholder="Contraseña del archivo .p12" fluid />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="firmaDialogVisible = false" />
        <Button label="Subir firma" icon="fa-solid fa-upload" :loading="uploadingFirma" @click="uploadFirma" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="dialogVisible"
      :header="isEditing ? 'Editar perito' : 'Nuevo perito'"
      modal
      :style="{ width: '38rem' }"
    >
      <div class="form-grid">
        <Message v-if="errorMessage" severity="error" class="w-full">{{ errorMessage }}</Message>

        <div class="field">
          <label>Nombres <span class="required">*</span></label>
          <InputText v-model="form.nombres" fluid />
        </div>
        <div class="field">
          <label>Apellidos <span class="required">*</span></label>
          <InputText v-model="form.apellidos" fluid />
        </div>
        <div class="field">
          <label>RUC (13 dígitos) <span class="required">*</span></label>
          <InputText v-model="form.ruc" maxlength="13" fluid />
        </div>
        <div class="field">
          <label>Email</label>
          <InputText v-model="form.email" type="email" fluid />
        </div>
        <div class="field">
          <label>Teléfono</label>
          <InputText v-model="form.telefono" fluid />
        </div>
        <div class="field">
          <label>Dirección</label>
          <InputText v-model="form.direccion" fluid />
        </div>
        <div class="field">
          <label>Vigencia calificación</label>
          <DatePicker v-model="form.fechaVigenciaCalificacion" />
        </div>
        <div class="field">
          <label>Vencimiento firma electrónica</label>
          <DatePicker v-model="form.fechaVencimientoFirma" />
        </div>

        <div class="field full-width section-divider">
          <hr />
        </div>

        <div class="field full-width">
          <div class="section-header">
            <label>Cuentas Bancarias</label>
            <Button icon="fa-solid fa-plus" size="small" text @click="addCuenta" />
          </div>
          <div v-for="(cuenta, index) in form.cuentasBancarias" :key="index" class="cuenta-row">
            <InputText v-model="cuenta.banco" placeholder="Banco" fluid />
            <Select v-model="cuenta.tipoCuenta" :options="['AHORROS', 'CORRIENTE']" placeholder="Tipo" fluid />
            <InputText v-model="cuenta.numeroCuenta" placeholder="N. Cuenta" fluid />
            <Button icon="fa-solid fa-trash" text rounded severity="danger" @click="removeCuenta(index)" />
          </div>
          <div v-if="form.cuentasBancarias!.length === 0" class="empty-cuentas">
            <i class="fa-solid fa-building-columns"></i>
            <span>Sin cuentas bancarias registradas</span>
          </div>
        </div>

        <template v-if="!isEditing">
          <div class="field full-width section-divider">
            <hr />
          </div>

          <div class="field full-width">
            <div class="notify-toggle">
              <div class="notify-info">
                <i class="fa-solid fa-envelope"></i>
                <div>
                  <span class="notify-label">Notificar al perito por correo</span>
                  <span class="notify-desc">Se enviarán las credenciales de acceso al sistema</span>
                </div>
              </div>
              <InputSwitch v-model="form.sendNotification" />
            </div>
          </div>

          <div v-if="form.sendNotification" class="field full-width password-field">
            <label>Contraseña <span v-if="passwordAuto" class="badge-auto">auto-generada</span></label>
            <InputText v-model="form.password" type="text" placeholder="Dejar vacío para generar automáticamente" fluid />
          </div>
        </template>
      </div>

      <template #footer>
        <Button label="Cancelar" text @click="dialogVisible = false" />
        <Button label="Guardar" @click="savePerito" />
      </template>
    </Dialog>
  </div>
</template>

<style lang="scss" scoped>
.peritos-view {
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

  .required {
    color: #ef4444;
  }

  .section-divider {
    hr {
      border: none;
      border-top: 1px solid $border-color;
      margin: 0;
    }
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: $text-primary;
  }
}

.cuenta-row {
  display: grid;
  grid-template-columns: 1fr 140px 1fr auto;
  gap: 0.5rem;
  align-items: end;
  padding: 0.75rem;
  background-color: rgba($primary, 0.03);
  border: 1px solid $border-color;
  border-radius: 0.625rem;
}

.empty-cuentas {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  color: $text-muted;
  font-size: 0.875rem;

  i {
    font-size: 1.25rem;
  }
}

.notify-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background-color: rgba($primary, 0.04);
  border: 1px solid rgba($primary, 0.1);
  border-radius: 0.75rem;
  gap: 1rem;
}

.notify-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  i {
    font-size: 1.125rem;
    color: $primary;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba($primary, 0.08);
    border-radius: 0.5rem;
    flex-shrink: 0;
  }
}

.notify-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: $text-primary;
  display: block;
}

.notify-desc {
  font-size: 0.75rem;
  color: $text-muted;
}

.password-field {
  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .badge-auto {
    display: inline-block;
    font-size: 0.6875rem;
    font-weight: 600;
    color: #f59e0b;
    background-color: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.2);
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
}

.w-full {
  grid-column: 1 / -1;
}

.firma-form {
  display: flex;
  flex-direction: column;
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
  }
}

.file-input {
  padding: 0.5rem;
  border: 1px solid $border-color;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background-color: $bg-surface;
  color: $text-primary;
  width: 100%;
  box-sizing: border-box;
}

.file-name {
  font-size: 0.8125rem;
  color: $text-secondary;
  padding: 0.25rem 0.5rem;
  background-color: rgba($primary, 0.05);
  border-radius: 0.375rem;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .cuenta-row {
    grid-template-columns: 1fr;
  }

  .empty-state {
    padding: 2.5rem 1.5rem;
    min-height: 280px;
  }
}
</style>
