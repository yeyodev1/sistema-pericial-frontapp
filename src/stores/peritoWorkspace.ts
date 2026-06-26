import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Perito } from '@/types'
import { peritoService } from '@/services/perito.service'

export const usePeritoWorkspaceStore = defineStore('peritoWorkspace', () => {
  const selected = ref<Perito | null>(null)
  const peritos = ref<Perito[]>([])
  const loading = ref(false)

  function hydrate() {
    const stored = localStorage.getItem('perito_workspace')
    if (stored) {
      try {
        selected.value = JSON.parse(stored)
      } catch {
        localStorage.removeItem('perito_workspace')
      }
    }
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

  function select(perito: Perito | null) {
    selected.value = perito
    if (perito) {
      localStorage.setItem('perito_workspace', JSON.stringify(perito))
    } else {
      localStorage.removeItem('perito_workspace')
    }
  }

  const selectedName = computed(() => {
    if (!selected.value) return null
    return `${selected.value.nombres} ${selected.value.apellidos}`
  })

  const selectedRuc = computed(() => selected.value?.ruc || null)

  return {
    selected,
    peritos,
    loading,
    hydrate,
    loadPeritos,
    select,
    selectedName,
    selectedRuc,
  }
})
