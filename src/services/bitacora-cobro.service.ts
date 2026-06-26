import APIBase from './httpBase'
import type { BitacoraCobro } from '@/types'

export interface CreateBitacoraPayload {
  sorteoId: string
  fecha: string
  tipoGestion: string
  resultado: string
  proximaAccion?: string
  proximaFecha?: string
  observaciones?: string
}

class BitacoraCobroService extends APIBase {
  async findAll(params?: { sorteoId?: string; cobradorId?: string }): Promise<BitacoraCobro[]> {
    const query = new URLSearchParams()
    if (params?.sorteoId) query.set('sorteoId', params.sorteoId)
    if (params?.cobradorId) query.set('cobradorId', params.cobradorId)
    const qs = query.toString()
    const response = await this.get<BitacoraCobro[]>(`bitacora-cobro${qs ? `?${qs}` : ''}`)
    return response.data
  }

  async findById(id: string): Promise<BitacoraCobro> {
    const response = await this.get<BitacoraCobro>(`bitacora-cobro/${id}`)
    return response.data
  }

  async create(payload: CreateBitacoraPayload): Promise<BitacoraCobro> {
    const response = await this.post<BitacoraCobro>('bitacora-cobro', payload)
    return response.data
  }

  async update(id: string, payload: Partial<CreateBitacoraPayload>): Promise<BitacoraCobro> {
    const response = await this.put<BitacoraCobro>(`bitacora-cobro/${id}`, payload)
    return response.data
  }

  async remove(id: string): Promise<void> {
    await this.delete(`bitacora-cobro/${id}`)
  }
}

export const bitacoraCobroService = new BitacoraCobroService()
