<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputSwitch from 'primevue/inputswitch'
import Message from 'primevue/message'
import { configService } from '@/services/config.service'

const horario = ref({
  lunesViernesApertura: '05:00',
  lunesViernesCierre: '20:00',
  sabadoApertura: '05:00',
  sabadoCierre: '14:00',
  domingoCerrado: true,
})

const firmaConfig = ref({
  ruc: '',
  razonSocial: '',
  direccionEstablecimiento: '',
  contribuyenteEspecial: '',
  obligadoContabilidad: true,
})

const emailConfig = ref({
  host: '',
  puerto: '587',
  usuario: '',
  password: '',
})

const activeTab = ref<'general' | 'firma' | 'correo'>('general')
const successMessage = ref('')
const errorMessage = ref('')
const loading = ref(false)
const saving = ref(false)

async function loadConfig() {
  loading.value = true
  try {
    const data = await configService.getAll()
    if (data.business_hours) {
      const bh = data.business_hours
      if (bh.lunesViernesApertura) horario.value.lunesViernesApertura = bh.lunesViernesApertura
      if (bh.lunesViernesCierre) horario.value.lunesViernesCierre = bh.lunesViernesCierre
      if (bh.sabadoApertura) horario.value.sabadoApertura = bh.sabadoApertura
      if (bh.sabadoCierre) horario.value.sabadoCierre = bh.sabadoCierre
      if (bh.domingoCerrado !== undefined) horario.value.domingoCerrado = bh.domingoCerrado
    }
    if (data.firma_electronica) {
      firmaConfig.value = { ...firmaConfig.value, ...data.firma_electronica }
    }
    if (data.smtp) {
      emailConfig.value = { ...emailConfig.value, ...data.smtp }
    }
  } catch {
    // Load defaults
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  errorMessage.value = ''
  successMessage.value = ''
  saving.value = true

  try {
    if (activeTab.value === 'general') {
      await configService.upsert('business_hours', { ...horario.value })
    } else if (activeTab.value === 'firma') {
      await configService.upsert('firma_electronica', { ...firmaConfig.value })
    } else if (activeTab.value === 'correo') {
      await configService.upsert('smtp', { ...emailConfig.value })
    }
    successMessage.value = 'Configuración guardada correctamente.'
  } catch (error: unknown) {
    const apiError = error as { message?: string }
    errorMessage.value = apiError.message || 'Error al guardar la configuración'
  } finally {
    saving.value = false
    setTimeout(() => { successMessage.value = '' }, 4000)
  }
}

onMounted(loadConfig)
</script>

<template>
  <div class="config-view">
    <div class="page-header">
      <div>
        <span class="text-small">Sistema</span>
        <h1 class="text-title">Configuración</h1>
        <p class="text-body">Ajustes generales del sistema y parámetros de operación</p>
      </div>
    </div>

    <Message v-if="successMessage" severity="success" closable>{{ successMessage }}</Message>
    <Message v-if="errorMessage" severity="error" closable>{{ errorMessage }}</Message>

    <div v-if="loading" class="text-body">Cargando configuración...</div>

    <template v-if="!loading">
      <div class="config-tabs">
        <button :class="['tab-btn', { active: activeTab === 'general' }]" @click="activeTab = 'general'">
          <i class="fa-solid fa-clock"></i> Horario Comercial
        </button>
        <button :class="['tab-btn', { active: activeTab === 'firma' }]" @click="activeTab = 'firma'">
          <i class="fa-solid fa-file-signature"></i> Firma Electrónica
        </button>
        <button :class="['tab-btn', { active: activeTab === 'correo' }]" @click="activeTab = 'correo'">
          <i class="fa-solid fa-envelope"></i> Correo SMTP
        </button>
      </div>

      <div class="config-card">
        <div v-if="activeTab === 'general'">
          <h2 class="section-title">Horario de Atención Comercial</h2>
          <p class="text-body section-desc">Configura el horario en el que los peritos pueden acceder al sistema.</p>
          <div class="form-grid">
            <div class="field">
              <label>Lunes - Viernes Apertura</label>
              <InputText v-model="horario.lunesViernesApertura" type="time" fluid />
            </div>
            <div class="field">
              <label>Lunes - Viernes Cierre</label>
              <InputText v-model="horario.lunesViernesCierre" type="time" fluid />
            </div>
            <div class="field">
              <label>Sábado Apertura</label>
              <InputText v-model="horario.sabadoApertura" type="time" fluid />
            </div>
            <div class="field">
              <label>Sábado Cierre</label>
              <InputText v-model="horario.sabadoCierre" type="time" fluid />
            </div>
            <div class="field switch-field">
              <label>Domingo cerrado</label>
              <InputSwitch v-model="horario.domingoCerrado" />
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'firma'">
          <h2 class="section-title">Configuración de Firma Electrónica</h2>
          <p class="text-body section-desc">Datos del contribuyente para facturación electrónica SRI.</p>
          <div class="form-grid">
            <div class="field">
              <label>RUC</label>
              <InputText v-model="firmaConfig.ruc" maxlength="13" fluid />
            </div>
            <div class="field">
              <label>Razón Social</label>
              <InputText v-model="firmaConfig.razonSocial" fluid />
            </div>
            <div class="field">
              <label>Dirección Establecimiento</label>
              <InputText v-model="firmaConfig.direccionEstablecimiento" fluid />
            </div>
            <div class="field">
              <label>Contribuyente Especial (Resolución)</label>
              <InputText v-model="firmaConfig.contribuyenteEspecial" fluid />
            </div>
            <div class="field switch-field">
              <label>Obligado a llevar contabilidad</label>
              <InputSwitch v-model="firmaConfig.obligadoContabilidad" />
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'correo'">
          <h2 class="section-title">Configuración de Correo Electrónico</h2>
          <p class="text-body section-desc">Servidor SMTP para envío de notificaciones del sistema.</p>
          <div class="form-grid">
            <div class="field">
              <label>Servidor SMTP</label>
              <InputText v-model="emailConfig.host" fluid />
            </div>
            <div class="field">
              <label>Puerto</label>
              <InputText v-model="emailConfig.puerto" fluid />
            </div>
            <div class="field">
              <label>Usuario</label>
              <InputText v-model="emailConfig.usuario" fluid />
            </div>
            <div class="field">
              <label>Contraseña</label>
              <InputText v-model="emailConfig.password" type="password" fluid />
            </div>
          </div>
        </div>

        <div class="config-actions">
          <Button label="Guardar configuración" icon="fa-solid fa-floppy-disk" :loading="saving" @click="saveConfig" />
        </div>
      </div>
    </template>

    <div class="info-card">
      <i class="fa-solid fa-shield-halved"></i>
      <div>
        <strong>Seguridad del sistema</strong>
        <p>Los cambios de configuración crítica requieren autenticación de administrador. El horario comercial se aplica a todos los usuarios no administradores.</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.config-view {
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
  p { margin: 0; }
}

.config-tabs {
  display: flex;
  gap: 0.25rem;
  background-color: $bg-surface;
  border: 1px solid $border-color;
  border-radius: 0.75rem;
  padding: 0.25rem;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover { color: $text-primary; }

  &.active {
    background-color: $primary;
    color: $white;
  }
}

.config-card {
  background-color: $bg-surface;
  border: 1px solid $border-color;
  border-radius: 1rem;
  padding: 1.5rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 0.25rem 0;
}

.section-desc {
  margin: 0 0 1.5rem 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-size: 0.875rem;
      font-weight: 600;
      color: $text-primary;
    }

    &.switch-field {
      flex-direction: row;
      align-items: center;
      gap: 0.75rem;
    }
  }
}

.config-actions {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid $border-color;
}

.info-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background-color: rgba($primary, 0.06);
  border: 1px solid rgba($primary, 0.15);
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  font-size: 0.875rem;
  color: $text-secondary;

  i {
    color: $primary;
    font-size: 1.25rem;
    margin-top: 0.125rem;
  }

  strong {
    color: $text-primary;
    display: block;
    margin-bottom: 0.25rem;
  }

  p { margin: 0; }
}

@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
  .config-tabs { flex-direction: column; }
}
</style>
