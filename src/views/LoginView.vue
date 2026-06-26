<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { authService } from '@/services/auth.service'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  errorMessage.value = ''
  loading.value = true

  try {
    const result = await authService.login({
      email: email.value,
      password: password.value,
    })

    localStorage.setItem('access_token', result.token)
    userStore.setUser(result.user)

    router.push('/dashboard')
  } catch (error: unknown) {
    const apiError = error as { status?: number; message?: string; data?: { message?: string } }

    if (apiError.status === 403) {
      errorMessage.value = 'El acceso está restringido fuera del horario comercial. La plataforma se reactivará a las 5:00 AM.'
    } else {
      errorMessage.value = apiError.data?.message || apiError.message || 'Error al iniciar sesión'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-view">
    <div class="login-card">
      <div class="login-brand">
        <span class="brand-mark">SP</span>
      </div>

      <div class="login-header">
        <h1 class="text-display">Bienvenido</h1>
        <p class="text-body">
          Sistema de gestión integral para administradoras de peritos judiciales.
        </p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="field">
          <label for="email">Correo electrónico</label>
          <InputText
            id="email"
            v-model="email"
            type="email"
            placeholder="admin@sistemapericial.com"
            required
            fluid
          />
        </div>

        <div class="field">
          <label for="password">Contraseña</label>
          <Password
            id="password"
            v-model="password"
            placeholder="••••••••"
            :feedback="false"
            toggle-mask
            required
            fluid
          />
        </div>

        <Message v-if="errorMessage" severity="error" class="w-full">
          {{ errorMessage }}
        </Message>

        <Button
          type="submit"
          label="Iniciar sesión"
          :loading="loading"
          fluid
          class="login-button"
        />
      </form>

      <div class="login-footer">
        <span class="text-small">Sistema Pericial v1.0</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $bg-body;
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background-color: $bg-surface;
  border: 1px solid $border-color;
  border-radius: 1.25rem;
  padding: 2.5rem;
  box-shadow: 0 4px 48px rgba($black, 0.04);
}

.login-brand {
  margin-bottom: 1.5rem;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background-color: $primary;
  color: $white;
  border-radius: 0.625rem;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: -0.02em;
}

.login-header {
  margin-bottom: 2rem;

  h1 {
    margin: 0 0 0.5rem 0;
    color: $text-primary;
  }

  p {
    margin: 0;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

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

.w-full {
  width: 100%;
}

.login-button {
  background-color: $primary !important;
  border-color: $primary !important;
  color: $white !important;
  font-weight: 600 !important;
  border-radius: 0.625rem !important;

  &:hover {
    background-color: $primary-dark !important;
    border-color: $primary-dark !important;
  }
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
}
</style>
