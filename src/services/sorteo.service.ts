import APIBase from './httpBase'
import type { Sorteo } from '@/types'

class SorteoService extends APIBase {
  async findAll(): Promise<Sorteo[]> {
    const response = await this.get<Sorteo[]>('sorteos')
    return response.data
  }

  async create(payload: Omit<Sorteo, '_id'>): Promise<Sorteo> {
    const response = await this.post<Sorteo>('sorteos', payload)
    return response.data
  }

  async update(id: string, payload: Partial<Sorteo>): Promise<Sorteo> {
    const response = await this.put<Sorteo>(`sorteos/${id}`, payload)
    return response.data
  }

  async remove(id: string): Promise<void> {
    await this.delete(`sorteos/${id}`)
  }

  async getStats(): Promise<{ total: number; asignados: number; enProceso: number; cerrados: number }> {
    const response = await this.get<{ total: number; asignados: number; enProceso: number; cerrados: number }>('sorteos/stats')
    return response.data
  }
}

export const sorteoService = new SorteoService()
