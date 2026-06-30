<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { peritoService } from '@/services/perito.service'
import { sorteoService } from '@/services/sorteo.service'
import type { Perito } from '@/types'
import { getPeritoAlertDetails } from '@/utils/peritoAlerts'

const userStore = useUserStore()
const alerts = ref<Perito[]>([])
const loadingAlerts = ref(false)
const peritosCount = ref(0)
const sorteoStats = ref({ total: 0, asignados: 0, enProceso: 0, cerrados: 0 })

const isPerito = computed(() => userStore.role === 'PERITO')

async function loadAlerts() {
  loadingAlerts.value = true
  try {
    alerts.value = await peritoService.getAlerts()
  } catch {
    alerts.value = []
  } finally {
    loadingAlerts.value = false
  }
}

async function loadStats() {
  try {
    const [stats, peritos] = await Promise.all([
      sorteoService.getStats(),
      peritoService.findAll(),
    ])
    sorteoStats.value = stats
    peritosCount.value = peritos.length
  } catch {
    // stats stay at 0
  }
}

onMounted(() => {
  loadAlerts()
  loadStats()
})

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

const peritoModules = computed(() => [
  {
    title: 'Mis Sorteos',
    count: String(sorteoStats.value.total || '0'),
    label: 'Asignados',
    icon: 'fa-solid fa-gavel',
    path: '/dashboard/sorteos',
  },
  {
    title: 'Agenda de Campo',
    count: '—',
    label: 'Próximas diligencias',
    icon: 'fa-solid fa-map-location-dot',
    path: '/dashboard/agenda-campo',
  },
  {
    title: 'Facturación',
    count: '—',
    label: 'Facturas pendientes',
    icon: 'fa-solid fa-file-invoice-dollar',
    path: '/dashboard/facturacion',
  },
  {
    title: 'Mi Cuenta',
    count: '—',
    label: 'Configuración',
    icon: 'fa-solid fa-user-gear',
    path: '/dashboard/mi-cuenta',
  },
])

const adminModules = computed(() => [
  {
    title: 'Sorteos',
    count: String(sorteoStats.value.total || '0'),
    label: 'Activos',
    icon: 'fa-solid fa-gavel',
    path: '/dashboard/sorteos',
  },
  {
    title: 'Peritos',
    count: String(peritosCount.value || '0'),
    label: 'Registrados',
    icon: 'fa-solid fa-user-tie',
    path: '/dashboard/peritos',
  },
  {
    title: 'Escritos',
    count: '—',
    label: 'Judiciales',
    icon: 'fa-solid fa-file-lines',
    path: '/dashboard/escritos',
  },
  {
    title: 'Facturas',
    count: '—',
    label: 'Pendientes',
    icon: 'fa-solid fa-file-invoice-dollar',
    path: '/dashboard/facturacion',
  },
  {
    title: 'CxC',
    count: '—',
    label: 'Clientes',
    icon: 'fa-solid fa-wallet',
    path: '/dashboard/cxc',
  },
  {
    title: 'Agenda',
    count: '—',
    label: 'Tareas hoy',
    icon: 'fa-solid fa-calendar-check',
    path: '/dashboard/agenda-campo',
  },
  {
    title: 'Bitácora',
    count: '—',
    label: 'Gestiones de cobro',
    icon: 'fa-solid fa-hand-holding-dollar',
    path: '/dashboard/bitacora-cobro',
  },
  {
    title: 'Caja',
    count: '—',
    label: 'Movimientos',
    icon: 'fa-solid fa-cash-register',
    path: '/dashboard/caja',
  },
])

const modules = computed(() => isPerito.value ? peritoModules.value : adminModules.value)
</script>

<template>
  <div class="dashboard-view">
    <section class="hero-section">
      <span class="text-small">Dashboard</span>
      <h1 class="text-display">
        {{ greeting() }},<br />
        {{ userStore.name || 'Usuario' }}
      </h1>

      <p v-if="isPerito" class="text-body hero-description">
        Panel personal de perito judicial. Consulta tus sorteos asignados, gestiona tu agenda
        de campo y mantén al día tu documentación.
      </p>
      <p v-else class="text-body hero-description">
        Gestión integral de peritos judiciales. Monitorea sorteos, facturación,
        agendas y liquidaciones desde un solo lugar.
      </p>
    </section>

    <section class="modules-grid">
      <RouterLink
        v-for="mod in modules"
        :key="mod.title"
        :to="mod.path"
        class="module-card"
      >
        <div class="module-icon">
          <i :class="mod.icon"></i>
        </div>
        <div class="module-content">
          <span class="module-count">{{ mod.count }}</span>
          <span class="module-title">{{ mod.title }}</span>
          <span class="module-label">{{ mod.label }}</span>
        </div>
        <div class="module-arrow">
          <i class="fa-solid fa-arrow-right"></i>
        </div>
      </RouterLink>
    </section>

    <section class="alerts-section">
      <h2 class="text-title section-title">
        Alertas de vigencia
      </h2>

      <div v-if="loadingAlerts" class="text-body">Cargando alertas...</div>

      <div v-else-if="alerts.length === 0" class="alert-item alert-success">
        <i class="fa-solid fa-check-circle"></i>
        <span>No hay alertas de vigencia pendientes</span>
      </div>

      <div v-else class="alerts-list">
        <RouterLink
          v-for="alert in alerts"
          :key="alert._id"
          to="/dashboard/peritos"
          class="alert-item alert-warning"
        >
          <i class="fa-solid fa-triangle-exclamation"></i>
          <div class="alert-content">
            <span class="alert-name">{{ alert.codigoRegistro }} - {{ alert.nombres }} {{ alert.apellidos }}</span>
            <span class="alert-detail">
              {{ getPeritoAlertDetails(alert).slice(0, 2).join(' · ') }}
              <template v-if="getPeritoAlertDetails(alert).length > 2">
                · +{{ getPeritoAlertDetails(alert).length - 2 }} más
              </template>
            </span>
          </div>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  max-width: 1200px;
}

.hero-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1rem;

  h1 {
    margin: 0;
    color: $text-primary;
  }

  .hero-description {
    max-width: 560px;
    margin: 0;
    font-size: 1.125rem;
  }
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.module-card {
  background-color: $bg-surface;
  border: 1px solid $border-color;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  text-decoration: none;

  &:hover {
    border-color: $gray-400;
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba($black, 0.06);

    .module-arrow {
      transform: translateX(4px);
    }
  }
}

.module-icon {
  width: 48px;
  height: 48px;
  background-color: $bg-surface-secondary;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: $text-primary;
  flex-shrink: 0;
}

.module-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.module-count {
  font-size: 2rem;
  font-weight: 700;
  color: $text-primary;
  line-height: 1;
}

.module-title {
  font-size: 1rem;
  font-weight: 600;
  color: $text-primary;
}

.module-label {
  font-size: 0.8125rem;
  color: $text-secondary;
}

.module-arrow {
  color: $text-muted;
  transition: transform 0.2s ease;
  align-self: center;
}

.alerts-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  margin: 0;
  color: $text-primary;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background-color: $bg-surface;
  border: 1px solid $border-color;
  border-radius: 0.75rem;
  font-size: 0.9375rem;
  color: $text-secondary;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    border-color: $gray-400;
  }

  i {
    font-size: 1rem;
  }

  &.alert-warning i {
    color: $accent-amber;
  }

  &.alert-success i {
    color: $accent-green;
  }
}

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.alert-name {
  font-weight: 600;
  color: $text-primary;
}

.alert-detail {
  font-size: 0.8125rem;
  color: $text-secondary;
}

@media (max-width: 768px) {
  .dashboard-view {
    gap: 2rem;
  }

  .modules-grid {
    grid-template-columns: 1fr;
  }

  .module-card {
    padding: 1.25rem;
  }
}
</style>
