import APIBase from './httpBase'
import type { Liquidacion } from '@/types'

export interface CreateLiquidacionPayload {
  peritoId: string
  periodo: string
  fechaInicio: string
  fechaFin: string
  detalle: { sorteoId: string; honorarios: number; descuentos: number }[]
  totalHonorarios: number
  totalDescuentos: number
  totalAPagar: number
  estado?: string
  observaciones?: string
}

class LiquidacionService extends APIBase {
  async findAll(): Promise<Liquidacion[]> {
    const response = await this.get<Liquidacion[]>('liquidaciones')
    return response.data
  }

  async create(payload: CreateLiquidacionPayload): Promise<Liquidacion> {
    const response = await this.post<Liquidacion>('liquidaciones', payload)
    return response.data
  }

  async update(id: string, payload: Partial<CreateLiquidacionPayload>): Promise<Liquidacion> {
    const response = await this.patch<Liquidacion>(`liquidaciones/${id}`, payload)
    return response.data
  }

  async remove(id: string): Promise<void> {
    await this.delete(`liquidaciones/${id}`)
  }

  async getStats(): Promise<{ totalPendiente: number; liquidado: number; peritosActivos: number }> {
    const response = await this.get<{ totalPendiente: number; liquidado: number; peritosActivos: number }>('liquidaciones/stats')
    return response.data
  }
}

export const liquidacionService = new LiquidacionService()
