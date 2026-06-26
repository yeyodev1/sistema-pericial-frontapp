import { reactive, readonly } from 'vue'

interface ConfirmState {
  visible: boolean
  title: string
  message: string
  acceptLabel: string
  rejectLabel: string
  severity: 'danger' | 'warn' | 'info'
  icon: string
}

const state = reactive<ConfirmState>({
  visible: false,
  title: '',
  message: '',
  acceptLabel: 'Confirmar',
  rejectLabel: 'Cancelar',
  severity: 'danger',
  icon: 'fa-solid fa-triangle-exclamation',
})

let resolveRef: ((value: boolean) => void) | null = null

export function useConfirm() {
  function confirm(options: {
    title?: string
    message: string
    acceptLabel?: string
    rejectLabel?: string
    severity?: 'danger' | 'warn' | 'info'
    icon?: string
  }): Promise<boolean> {
    state.visible = true
    state.title = options.title || '¿Estás seguro?'
    state.message = options.message
    state.acceptLabel = options.acceptLabel || 'Eliminar'
    state.rejectLabel = options.rejectLabel || 'Cancelar'
    state.severity = options.severity || 'danger'
    state.icon = options.icon || 'fa-solid fa-triangle-exclamation'

    return new Promise((resolve) => {
      resolveRef = resolve
    })
  }

  function accept() {
    state.visible = false
    resolveRef?.(true)
    resolveRef = null
  }

  function reject() {
    state.visible = false
    resolveRef?.(false)
    resolveRef = null
  }

  return {
    state: readonly(state) as typeof state,
    confirm,
    accept,
    reject,
  }
}
