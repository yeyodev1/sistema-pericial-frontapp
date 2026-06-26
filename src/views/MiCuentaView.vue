<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { authService } from '@/services/auth.service'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'

const userStore = useUserStore()
const router = useRouter()

const profileForm = ref({
  name: userStore.name || '',
  email: userStore.email || '',
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const profileError = ref('')
const profileSuccess = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')
const savingProfile = ref(false)
const savingPassword = ref(false)

async function saveProfile() {
  profileError.value = ''
  profileSuccess.value = ''
  savingProfile.value = true

  try {
    const updated = await authService.updateProfile({
      name: profileForm.value.name || undefined,
      email: profileForm.value.email || undefined,
    })
    userStore.setUser(updated)
    profileSuccess.value = 'Perfil actualizado correctamente'
  } catch (error: unknown) {
    const apiError = error as { message?: string; data?: { message?: string } }
    profileError.value = apiError.data?.message || apiError.message || 'Error al actualizar el perfil'
  } finally {
    savingProfile.value = false
  }
}

async function savePassword() {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'Las contraseñas no coinciden'
    return
  }
  if (passwordForm.value.newPassword.length < 6) {
    passwordError.value = 'La nueva contraseña debe tener al menos 6 caracteres'
    return
  }

  savingPassword.value = true
  try {
    await authService.updatePassword(passwordForm.value.currentPassword, passwordForm.value.newPassword)
    passwordSuccess.value = 'Contraseña actualizada correctamente'
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch (error: unknown) {
    const apiError = error as { message?: string; data?: { message?: string } }
    passwordError.value = apiError.data?.message || apiError.message || 'Error al actualizar la contraseña'
  } finally {
    savingPassword.value = false
  }
}

function cerrarSesion() {
  userStore.clear()
  router.push('/login')
}
</script>

<template>
  <div class="mi-cuenta-view">
    <div class="page-header">
      <div>
        <span class="text-small">Configuración</span>
        <h1 class="text-title">Mi Cuenta</h1>
        <p class="text-body">Gestiona tu perfil y cambia tu contraseña</p>
      </div>
    </div>

    <div class="profile-card">
      <div class="card-header">
        <i class="fa-solid fa-user-pen"></i>
        <div>
          <h2>Editar Perfil</h2>
          <p>Actualiza tu nombre y correo electrónico</p>
        </div>
      </div>

      <Message v-if="profileSuccess" severity="success" closable @close="profileSuccess = ''">{{ profileSuccess }}</Message>
      <Message v-if="profileError" severity="error" closable @close="profileError = ''">{{ profileError }}</Message>

      <div class="profile-form">
        <div class="field">
          <label>Nombre</label>
          <InputText v-model="profileForm.name" fluid />
        </div>
        <div class="field">
          <label>Correo electrónico</label>
          <InputText v-model="profileForm.email" type="email" fluid />
        </div>
        <Button label="Guardar cambios" icon="fa-solid fa-floppy-disk" size="large" :loading="savingProfile" @click="saveProfile" />
      </div>
    </div>

    <div class="profile-card">
      <div class="card-header">
        <i class="fa-solid fa-lock"></i>
        <div>
          <h2>Cambiar Contraseña</h2>
          <p>Establece una nueva contraseña para tu cuenta</p>
        </div>
      </div>

      <Message v-if="passwordSuccess" severity="success" closable @close="passwordSuccess = ''">{{ passwordSuccess }}</Message>
      <Message v-if="passwordError" severity="error" closable @close="passwordError = ''">{{ passwordError }}</Message>

      <div class="profile-form">
        <div class="field">
          <label>Contraseña actual</label>
          <InputText v-model="passwordForm.currentPassword" type="password" fluid />
        </div>
        <div class="field">
          <label>Nueva contraseña</label>
          <InputText v-model="passwordForm.newPassword" type="password" fluid />
        </div>
        <div class="field">
          <label>Confirmar nueva contraseña</label>
          <InputText v-model="passwordForm.confirmPassword" type="password" fluid />
        </div>
        <Button label="Cambiar contraseña" icon="fa-solid fa-key" size="large" :loading="savingPassword" @click="savePassword" />
      </div>
    </div>

    <div class="profile-card danger-zone">
      <div class="card-header">
        <i class="fa-solid fa-right-from-bracket"></i>
        <div>
          <h2>Cerrar Sesión</h2>
          <p>Finaliza tu sesión actual</p>
        </div>
      </div>
      <div class="profile-form">
        <Button label="Cerrar sesión" icon="fa-solid fa-right-from-bracket" severity="danger" size="large" @click="cerrarSesion" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.mi-cuenta-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 600px;
}

.page-header {
  .text-body {
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
    color: $text-secondary;
  }
}

.profile-card {
  background-color: $bg-surface;
  border: 1px solid $border-color;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &.danger-zone {
    border-color: rgba(#ef4444, 0.2);

    .card-header i {
      color: #ef4444;
    }
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;

  i {
    font-size: 1.25rem;
    color: $primary;
    width: 2.25rem;
    height: 2.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba($primary, 0.08);
    border-radius: 0.625rem;
    flex-shrink: 0;
  }

  h2 {
    font-size: 1.0625rem;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
  }

  p {
    font-size: 0.8125rem;
    color: $text-secondary;
    margin: 0.25rem 0 0 0;
  }
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;

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

  :deep(.p-button) {
    padding: 0.75rem 2rem;
    border-radius: 0.625rem;
    font-weight: 600;
    align-self: flex-start;

    &.p-button-lg {
      padding: 0.75rem 2rem;
    }
  }

  :deep(.p-button-danger) {
    background-color: #ef4444;
    border-color: #ef4444;
    color: #fff;

    &:hover {
      background-color: #dc2626;
      border-color: #dc2626;
    }
  }
}
</style>
