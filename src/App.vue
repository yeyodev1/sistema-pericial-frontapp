<script setup lang="ts">
import { onMounted, onUnmounted, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import { peritoService } from '@/services/perito.service'
import { buildPeritoAlertSignature, getPeritoAlertDetails, getPeritoAlertSeverity } from '@/utils/peritoAlerts'

const router = useRouter()
const userStore = useUserStore()
const toast = useToast()
const alertTimer = ref<ReturnType<typeof setInterval> | null>(null)

function loadSeenAlertSignatures(): Set<string> {
  try {
    const stored = localStorage.getItem('perito_alert_signatures_seen')
    return new Set(stored ? (JSON.parse(stored) as string[]) : [])
  } catch {
    return new Set<string>()
  }
}

const seenAlertSignatures = loadSeenAlertSignatures()

function persistSeenAlertSignatures() {
  try {
    localStorage.setItem('perito_alert_signatures_seen', JSON.stringify([...seenAlertSignatures]))
  } catch {
    // ignore storage failures
  }
}

async function pollPeritoAlerts() {
  if (!userStore.isAuthenticated) return

  try {
    const alerts = await peritoService.getAlerts()
    for (const perito of alerts) {
      const details = getPeritoAlertDetails(perito)
      if (details.length === 0) continue

      const signature = buildPeritoAlertSignature(perito)
      if (seenAlertSignatures.has(signature)) continue

      seenAlertSignatures.add(signature)
      persistSeenAlertSignatures()

      const summary = `${perito.codigoRegistro} - ${perito.nombres} ${perito.apellidos}`
      const detail = details.length > 2 ? `${details.slice(0, 2).join(' · ')} · +${details.length - 2} más` : details.join(' · ')

      toast.add({
        severity: getPeritoAlertSeverity(perito),
        summary: 'Alerta de vigencia',
        detail: `${summary}: ${detail}`,
        life: 9000,
      })
    }
  } catch {
    // silent polling failure
  }
}

function startAlertPolling() {
  stopAlertPolling()
  pollPeritoAlerts()
  alertTimer.value = setInterval(pollPeritoAlerts, 5 * 60 * 1000)
}

function stopAlertPolling() {
  if (alertTimer.value) {
    clearInterval(alertTimer.value)
    alertTimer.value = null
  }
}

function onApiSuccess(e: Event) {
  const { message } = (e as CustomEvent).detail
  toast.add({ severity: 'success', summary: 'Éxito', detail: message, life: 4000 })
}

function onApiError(e: Event) {
  const { message } = (e as CustomEvent).detail
  toast.add({ severity: 'error', summary: 'Error', detail: message, life: 6000 })
}

function onTokenExpired() {
  userStore.clear()
  toast.add({ severity: 'warn', summary: 'Sesión expirada', detail: 'Tu sesión ha expirado', life: 4000 })
  router.push('/login')
}

onMounted(() => {
  window.addEventListener('api:success', onApiSuccess)
  window.addEventListener('api:error', onApiError)
  window.addEventListener('auth:token-expired', onTokenExpired)
})

watch(
  () => [userStore._initialized, userStore.isAuthenticated],
  ([initialized, authenticated]) => {
    if (initialized && authenticated) {
      startAlertPolling()
    } else {
      stopAlertPolling()
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  window.removeEventListener('api:success', onApiSuccess)
  window.removeEventListener('api:error', onApiError)
  window.removeEventListener('auth:token-expired', onTokenExpired)
  stopAlertPolling()
})
</script>

<template>
  <div class="app-container">
    <Toast position="top-right" />

    <Transition name="fade" mode="out-in">
      <div v-if="!userStore._initialized" key="loading" class="app-loading">
        <div class="loading-spinner">
          <span class="brand-mark">SP</span>
          <div class="spinner-ring"></div>
        </div>
      </div>
      <RouterView v-else key="app" v-slot="{ Component, route }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </Transition>
  </div>
</template>

<style lang="scss">
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.brand-mark {
  font-size: 2rem;
  font-weight: 800;
  color: $primary;
  letter-spacing: -0.05em;
}

.spinner-ring {
  width: 32px;
  height: 32px;
  border: 3px solid $border-color;
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.page-enter-to,
.page-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
