import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/views/LandingView.vue'),
    meta: { public: true, title: 'Sistema Pericial' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true, title: 'Iniciar sesión' },
  },
  {
    path: '/dashboard',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { requiresAuth: true, title: 'Dashboard' },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
      },
      {
        path: 'sorteos',
        name: 'Sorteos',
        component: () => import('@/views/SorteosView.vue'),
        meta: { roles: ['ADMIN', 'OPERATOR', 'PERITO'] },
      },
      {
        path: 'peritos',
        name: 'Peritos',
        component: () => import('@/views/PeritosView.vue'),
        meta: { roles: ['ADMIN', 'OPERATOR'] },
      },
      {
        path: 'catalogos',
        name: 'Catalogos',
        component: () => import('@/views/CatalogosView.vue'),
        meta: { roles: ['ADMIN', 'OPERATOR'] },
      },
      {
        path: 'facturacion',
        name: 'Facturacion',
        component: () => import('@/views/FacturacionView.vue'),
        meta: { roles: ['ADMIN', 'OPERATOR', 'PERITO'] },
      },
      {
        path: 'agenda-campo',
        name: 'AgendaCampo',
        component: () => import('@/views/AgendaCampoView.vue'),
        meta: { roles: ['ADMIN', 'OPERATOR', 'COLLECTOR', 'PERITO'] },
      },
      {
        path: 'escritos',
        name: 'Escritos',
        component: () => import('@/views/EscritosView.vue'),
        meta: { roles: ['ADMIN', 'OPERATOR', 'PERITO'] },
      },
      {
        path: 'bitacora-cobro',
        name: 'BitacoraCobro',
        component: () => import('@/views/BitacoraCobroView.vue'),
        meta: { roles: ['ADMIN', 'OPERATOR', 'COLLECTOR'] },
      },
      {
        path: 'caja',
        name: 'Caja',
        component: () => import('@/views/CajaView.vue'),
        meta: { roles: ['ADMIN', 'OPERATOR'] },
      },
      {
        path: 'access-logs',
        name: 'AccessLogs',
        component: () => import('@/views/AccessLogsView.vue'),
        meta: { roles: ['ADMIN'] },
      },
      {
        path: 'liquidacion',
        name: 'Liquidacion',
        component: () => import('@/views/LiquidacionView.vue'),
        meta: { roles: ['ADMIN'] },
      },
      {
        path: 'configuracion',
        name: 'Configuracion',
        component: () => import('@/views/ConfiguracionView.vue'),
        meta: { roles: ['ADMIN'] },
      },
      {
        path: 'mi-cuenta',
        name: 'MiCuenta',
        component: () => import('@/views/MiCuentaView.vue'),
        meta: { roles: ['ADMIN', 'OPERATOR', 'COLLECTOR', 'PERITO'] },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { left: 0, top: 0, behavior: 'smooth' }
  },
})

let _initPromise: Promise<void> | null = null

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()

  if (!_initPromise) {
    _initPromise = userStore.init()
  }
  if (!userStore._initialized) {
    await _initPromise
  }

  const isAuthenticated = userStore.isAuthenticated
  const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth)

  if (to.path === '/login' && isAuthenticated) {
    return next({ path: '/dashboard', replace: true })
  }

  if (requiresAuth && !isAuthenticated) {
    return next({ path: '/login', replace: true })
  }

  if (requiresAuth && isAuthenticated) {
    const allowedRoles = to.meta.roles as string[] | undefined
    if (allowedRoles && !allowedRoles.includes(userStore.role || '')) {
      return next({ path: '/dashboard', replace: true })
    }
  }

  next()
})

export default router
