import APIBase from './httpBase'
import type { CajaMovimiento, CajaResumen } from '@/types'

export interface CreateCajaPayload {
  fecha?: string
  tipoMovimiento: 'INGRESO' | 'EGRESO'
  monto: number
  concepto: string
  peritoId?: string
  sorteoId?: string
  formaPago?: string
  referencia?: string
  observaciones?: string
}

class CajaService extends APIBase {
  async findAll(params?: {
    desde?: string
    hasta?: string
    tipoMovimiento?: string
    peritoId?: string
  }): Promise<CajaMovimiento[]> {
    const query = new URLSearchParams()
    if (params?.desde) query.set('desde', params.desde)
    if (params?.hasta) query.set('hasta', params.hasta)
    if (params?.tipoMovimiento) query.set('tipoMovimiento', params.tipoMovimiento)
    if (params?.peritoId) query.set('peritoId', params.peritoId)
    const qs = query.toString()
    const response = await this.get<CajaMovimiento[]>(`caja${qs ? `?${qs}` : ''}`)
    return response.data
  }

  async findById(id: string): Promise<CajaMovimiento> {
    const response = await this.get<CajaMovimiento>(`caja/${id}`)
    return response.data
  }

  async create(payload: CreateCajaPayload): Promise<CajaMovimiento> {
    const response = await this.post<CajaMovimiento>('caja', payload)
    return response.data
  }

  async update(id: string, payload: Partial<CreateCajaPayload>): Promise<CajaMovimiento> {
    const response = await this.put<CajaMovimiento>(`caja/${id}`, payload)
    return response.data
  }

  async remove(id: string): Promise<void> {
    await this.delete(`caja/${id}`)
  }

  async getResumen(): Promise<CajaResumen> {
    const response = await this.get<CajaResumen>('caja/resumen')
    return response.data
  }
}

export const cajaService = new CajaService()
