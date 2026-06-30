import type { Perito } from '@/types'

const MS_PER_DAY = 1000 * 60 * 60 * 24

export function daysUntil(dateValue?: string): number | null {
  if (!dateValue) return null
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return null
  return Math.ceil((parsed.getTime() - Date.now()) / MS_PER_DAY)
}

export function getPeritoAlertDetails(perito: Perito, thresholdDays = 30): string[] {
  const details: string[] = []

  const calificacionDays = daysUntil(perito.fechaVigenciaCalificacion)
  if (calificacionDays !== null && calificacionDays <= thresholdDays) {
    details.push(
      `Calificación ${calificacionDays <= 0 ? 'vencida' : 'vence'}${perito.fechaVigenciaCalificacion ? ` el ${new Date(perito.fechaVigenciaCalificacion).toLocaleDateString('es-EC')}` : ''}`
    )
  }

  const firmaDays = daysUntil(perito.fechaVencimientoFirma)
  if (firmaDays !== null && firmaDays <= thresholdDays) {
    details.push(
      `Firma electrónica ${firmaDays <= 0 ? 'vencida' : 'vence'}${perito.fechaVencimientoFirma ? ` el ${new Date(perito.fechaVencimientoFirma).toLocaleDateString('es-EC')}` : ''}`
    )
  }

  for (const especialidad of perito.especialidades || []) {
    const specialtyDays = daysUntil(especialidad.fechaVencimiento)
    if (specialtyDays !== null && specialtyDays <= thresholdDays) {
      details.push(
        `${especialidad.especialidad || 'Especialidad'} ${specialtyDays <= 0 ? 'vencida' : 'vence'}${especialidad.fechaVencimiento ? ` el ${new Date(especialidad.fechaVencimiento).toLocaleDateString('es-EC')}` : ''}`
      )
    }
  }

  return details
}

export function getPeritoAlertSeverity(perito: Perito): 'danger' | 'warn' | 'success' {
  const details = getPeritoAlertDetails(perito, 30)
  if (details.some((detail) => detail.includes('vencida'))) return 'danger'
  if (details.length > 0) return 'warn'
  return 'success'
}

export function buildPeritoAlertSignature(perito: Perito): string {
  const details = getPeritoAlertDetails(perito, 30)
  return `${perito._id}:${details.join('|')}`
}
