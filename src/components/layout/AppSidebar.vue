<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useSidebar } from '@/composables/useSidebar'
import { useConfirm } from '@/composables/useConfirm'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { isOpen, close } = useSidebar()
const { confirm } = useConfirm()

async function handleLogout() {
  const ok = await confirm({
    title: 'Cerrar sesión',
    message: '¿Estás seguro de que deseas cerrar sesión?',
    acceptLabel: 'Salir',
    rejectLabel: 'Cancelar',
    severity: 'danger',
    icon: 'fa-solid fa-right-from-bracket',
  })
  if (ok) {
    userStore.clear()
    router.push('/login')
  }
}

const isActive = (path: string) => route.path === path

const menuItems = computed(() => {
  const role = userStore.role || ''

  const items = [
    { label: 'Inicio', icon: 'fa-solid fa-house', path: '/dashboard', roles: ['ADMIN', 'OPERATOR', 'COLLECTOR', 'PERITO'] },
    { label: 'Mis Sorteos', icon: 'fa-solid fa-gavel', path: '/dashboard/sorteos', roles: ['ADMIN', 'OPERATOR', 'PERITO'] },
    { label: 'Peritos', icon: 'fa-solid fa-user-tie', path: '/dashboard/peritos', roles: ['ADMIN', 'OPERATOR'] },
    { label: 'Catálogos', icon: 'fa-solid fa-book', path: '/dashboard/catalogos', roles: ['ADMIN', 'OPERATOR'] },
    { label: 'Cuentas x Cobrar', icon: 'fa-solid fa-wallet', path: '/dashboard/cxc', roles: ['ADMIN', 'OPERATOR', 'COLLECTOR'] },
    { label: 'Escritos', icon: 'fa-solid fa-file-lines', path: '/dashboard/escritos', roles: ['ADMIN', 'OPERATOR', 'PERITO'] },
    { label: 'Facturación', icon: 'fa-solid fa-file-invoice-dollar', path: '/dashboard/facturacion', roles: ['ADMIN', 'OPERATOR', 'PERITO'] },
    { label: 'Agenda de Campo', icon: 'fa-solid fa-map-location-dot', path: '/dashboard/agenda-campo', roles: ['ADMIN', 'OPERATOR', 'COLLECTOR', 'PERITO'] },
    { label: 'Bitácora de Cobro', icon: 'fa-solid fa-hand-holding-dollar', path: '/dashboard/bitacora-cobro', roles: ['ADMIN', 'OPERATOR', 'COLLECTOR'] },
    { label: 'Caja', icon: 'fa-solid fa-cash-register', path: '/dashboard/caja', roles: ['ADMIN', 'OPERATOR'] },
    { label: 'Liquidación', icon: 'fa-solid fa-coins', path: '/dashboard/liquidacion', roles: ['ADMIN'] },
    { label: 'Accesos', icon: 'fa-solid fa-shield-halved', path: '/dashboard/access-logs', roles: ['ADMIN'] },
    { label: 'Configuración', icon: 'fa-solid fa-gear', path: '/dashboard/configuracion', roles: ['ADMIN'] },
  ]

  if (role === 'PERITO') {
    return items.filter((item) =>
      ['Inicio', 'Mis Sorteos', 'Escritos', 'Facturación', 'Agenda de Campo', 'Cuentas x Cobrar'].includes(item.label)
    )
  }

  return items.filter((item) => item.roles.includes(role))
})

watch(() => route.path, () => {
  if (isOpen.value) close()
})
</script>

<template>
  <!-- Overlay backdrop (mobile only) -->
  <transition name="fade">
    <div
      v-if="isOpen"
      class="sidebar-overlay"
      @click="close"
    ></div>
  </transition>

  <!-- Sidebar -->
  <transition name="slide">
    <aside
      class="app-sidebar"
      :class="{ 'sidebar-open': isOpen }"
    >
      <div class="sidebar-brand">
        <span class="brand-mark">SP</span>
        <span class="brand-text">Sistema Pericial</span>
        <button class="sidebar-close" aria-label="Cerrar menú" @click="close">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="sidebar-user">
        <div class="sidebar-user-avatar">{{ userStore.name?.charAt(0) || 'U' }}</div>
        <div class="sidebar-user-info">
          <span class="sidebar-user-name">{{ userStore.name || 'Usuario' }}</span>
          <span class="sidebar-user-role">{{ userStore.role || 'Sin rol' }}</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </RouterLink>

        <div class="nav-divider"></div>

        <RouterLink to="/dashboard/mi-cuenta" class="nav-item" :class="{ active: isActive('/dashboard/mi-cuenta') }">
          <i class="fa-solid fa-user-gear"></i>
          <span>Mi Cuenta</span>
        </RouterLink>

        <a class="nav-item nav-logout" @click.prevent="handleLogout">
          <i class="fa-solid fa-right-from-bracket"></i>
          <span>Cerrar sesión</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <span class="version">v1.0.0</span>
      </div>
    </aside>
  </transition>
</template>

<style lang="scss" scoped>
/* ============ DESKTOP ============ */
.app-sidebar {
  width: 260px;
  height: 100vh;
  background-color: $bg-surface;
  border-right: 1px solid $border-color;
  color: $text-primary;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
}

.sidebar-brand {
  height: 72px;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0 1.5rem;
  border-bottom: 1px solid $border-color;
}

.brand-mark {
  width: 36px;
  height: 36px;
  background-color: $primary;
  color: $white;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: -0.02em;
  flex-shrink: 0;
}

.brand-text {
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: -0.01em;
}

.sidebar-close {
  display: none;
}

/* Mobile user card */
.sidebar-user {
  display: none;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 0.25rem;
  flex: 1;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  border-radius: 0.625rem;
  color: $text-secondary;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all 0.15s ease;

  &:hover {
    background-color: $bg-surface-secondary;
    color: $text-primary;
  }

  &.active {
    background-color: $primary;
    color: $white;

    &:hover {
      background-color: $primary-dark;
    }
  }

  i {
    font-size: 1.1rem;
    width: 22px;
    text-align: center;
  }
}

.nav-logout {
  color: #ef4444 !important;
  cursor: pointer;

  &:hover {
    background-color: rgba(239, 68, 68, 0.06) !important;
    color: #dc2626 !important;
  }

  i {
    color: inherit;
  }
}

.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid $border-color;

  .version {
    font-size: 0.75rem;
    color: $text-muted;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
}

/* Overlay backdrop */
.sidebar-overlay {
  display: none;
}

/* Transition classes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

/* ============ MOBILE ============ */
@media (max-width: 768px) {
  .app-sidebar {
    transform: translateX(-100%);
    z-index: 200;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);

    &.sidebar-open {
      transform: translateX(0);
    }
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.35);
    z-index: 199;
  }

  .sidebar-close {
    display: flex;
    width: 36px;
    height: 36px;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid $border-color;
    border-radius: 0.5rem;
    color: $text-secondary;
    font-size: 1.125rem;
    cursor: pointer;
    margin-left: auto;
    transition: all 0.15s ease;

    &:hover {
      background-color: $bg-surface-secondary;
      color: $text-primary;
    }
  }

  .sidebar-user {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid $border-color;
  }

  .sidebar-user-avatar {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $primary;
    color: $white;
    border-radius: 50%;
    font-weight: 600;
    font-size: 0.9375rem;
    flex-shrink: 0;
  }

  .sidebar-user-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.2;
  }

  .sidebar-user-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sidebar-user-role {
    font-size: 0.6875rem;
    color: $text-muted;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .sidebar-brand {
    padding: 0 1rem;
  }

.nav-divider {
  height: 1px;
  background-color: $border-color;
  margin: 0.5rem 0;
}

.sidebar-footer {
    display: block;
  }
}
</style>
