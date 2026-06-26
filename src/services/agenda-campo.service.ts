import APIBase from './httpBase'
import type { AgendaCampo } from '@/types'

export interface CreateAgendaPayload {
  sorteoId: string
  peritoId: string
  cobradorId?: string
  fechaHora: string
  tipoDiligencia: string
  direccion: string
  latitud?: number
  longitud?: number
  estado?: string
  observaciones?: string
}

class AgendaCampoService extends APIBase {
  async findAll(params?: {
    peritoId?: string
    estado?: string
    desde?: string
    hasta?: string
  }): Promise<AgendaCampo[]> {
    const query = new URLSearchParams()
    if (params?.peritoId) query.set('peritoId', params.peritoId)
    if (params?.estado) query.set('estado', params.estado)
    if (params?.desde) query.set('desde', params.desde)
    if (params?.hasta) query.set('hasta', params.hasta)
    const qs = query.toString()
    const response = await this.get<AgendaCampo[]>(`agenda-campo${qs ? `?${qs}` : ''}`)
    return response.data
  }

  async findById(id: string): Promise<AgendaCampo> {
    const response = await this.get<AgendaCampo>(`agenda-campo/${id}`)
    return response.data
  }

  async create(payload: CreateAgendaPayload): Promise<AgendaCampo> {
    const response = await this.post<AgendaCampo>('agenda-campo', payload)
    return response.data
  }

  async update(id: string, payload: Partial<CreateAgendaPayload>): Promise<AgendaCampo> {
    const response = await this.put<AgendaCampo>(`agenda-campo/${id}`, payload)
    return response.data
  }

  async remove(id: string): Promise<void> {
    await this.delete(`agenda-campo/${id}`)
  }

  async getStats(): Promise<Record<string, number>> {
    const response = await this.get<Record<string, number>>('agenda-campo/stats')
    return response.data
  }
}

export const agendaCampoService = new AgendaCampoService()
