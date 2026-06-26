import { defineStore } from 'pinia'
import { authService } from '@/services/auth.service'

export type UserRole = 'ADMIN' | 'OPERATOR' | 'COLLECTOR' | 'PERITO'

export interface UserState {
  id: string | null
  name: string | null
  email: string | null
  role: UserRole | null
  isAuthenticated: boolean
  _initialized: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    id: null,
    name: null,
    email: null,
    role: null,
    isAuthenticated: false,
    _initialized: false,
  }),

  getters: {
    isAdmin: (state) => state.role === 'ADMIN',
    isOperator: (state) => state.role === 'OPERATOR',
    isCollector: (state) => state.role === 'COLLECTOR',
  },

  actions: {
    async init() {
      const token = localStorage.getItem('access_token')
      if (!token) {
        this.isAuthenticated = false
        this._initialized = true
        return
      }

      this.hydrate()

      try {
        const user = await authService.getCurrentUser()
        this.setUser(user)
      } catch {
        this.clear()
      } finally {
        this._initialized = true
      }
    },

    hydrate() {
      const token = localStorage.getItem('access_token')
      const id = localStorage.getItem('user_id')
      const name = localStorage.getItem('user_name')
      const email = localStorage.getItem('user_email')
      const role = localStorage.getItem('user_role') as UserRole | null

      this.isAuthenticated = !!token
      this.id = id || null
      this.name = name || null
      this.email = email || null
      this.role = role || null
    },

    setUser(payload: { id?: string; name?: string; email?: string; role?: UserRole }) {
      if (payload.id !== undefined) {
        this.id = payload.id
        try {
          localStorage.setItem('user_id', payload.id)
        } catch {}
      }
      if (payload.name) {
        this.name = payload.name
        try {
          localStorage.setItem('user_name', payload.name)
        } catch {}
      }
      if (payload.email) {
        this.email = payload.email
        try {
          localStorage.setItem('user_email', payload.email)
        } catch {}
      }
      if (payload.role) {
        this.role = payload.role
        try {
          localStorage.setItem('user_role', payload.role)
        } catch {}
      }
      this.isAuthenticated = true
    },

    clear() {
      this.id = null
      this.name = null
      this.email = null
      this.role = null
      this.isAuthenticated = false
      try {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_id')
        localStorage.removeItem('user_name')
        localStorage.removeItem('user_email')
        localStorage.removeItem('user_role')
      } catch {}
    },
  },
})
