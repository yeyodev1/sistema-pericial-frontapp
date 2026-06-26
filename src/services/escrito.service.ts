import APIBase from './httpBase'
import type { Escrito } from '@/types'

export interface CreateEscritoPayload {
  sorteoId: string
  tipo: string
  fechaPresentacion: string
  fechaNotificacion?: string
  estado?: string
  archivoUrl?: string
  observaciones?: string
}

class EscritoService extends APIBase {
  async findAll(params?: { sorteoId?: string; tipo?: string; estado?: string }): Promise<Escrito[]> {
    const query = new URLSearchParams()
    if (params?.sorteoId) query.set('sorteoId', params.sorteoId)
    if (params?.tipo) query.set('tipo', params.tipo)
    if (params?.estado) query.set('estado', params.estado)
    const qs = query.toString()
    const response = await this.get<Escrito[]>(`escritos${qs ? `?${qs}` : ''}`)
    return response.data
  }

  async findById(id: string): Promise<Escrito> {
    const response = await this.get<Escrito>(`escritos/${id}`)
    return response.data
  }

  async create(payload: CreateEscritoPayload): Promise<Escrito> {
    const response = await this.post<Escrito>('escritos', payload)
    return response.data
  }

  async update(id: string, payload: Partial<CreateEscritoPayload>): Promise<Escrito> {
    const response = await this.put<Escrito>(`escritos/${id}`, payload)
    return response.data
  }

  async remove(id: string): Promise<void> {
    await this.delete(`escritos/${id}`)
  }
}

export const escritoService = new EscritoService()
