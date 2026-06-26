import APIBase from './httpBase'
import type { Perito } from '@/types'

export interface CreatePeritoPayload {
  nombres: string
  apellidos: string
  ruc: string
  direccion?: string
  telefono?: string
  email?: string
  cuentasBancarias?: { banco: string; tipoCuenta: 'AHORROS' | 'CORRIENTE'; numeroCuenta: string }[]
  fechaVigenciaCalificacion?: string
  fechaVencimientoFirma?: string
  password?: string
  sendNotification?: boolean
}

export interface CreatePeritoResult {
  perito: Perito
  notificationSent: boolean
  passwordGenerated: boolean
  userCreated: boolean
}

class PeritoService extends APIBase {
  async findAll(): Promise<Perito[]> {
    const response = await this.get<Perito[]>('peritos')
    return response.data
  }

  async create(payload: CreatePeritoPayload): Promise<CreatePeritoResult> {
    const response = await this.post<CreatePeritoResult>('peritos', payload)
    return response.data
  }

  async update(id: string, payload: Partial<CreatePeritoPayload>): Promise<Perito> {
    const response = await this.patch<Perito>(`peritos/${id}`, payload)
    return response.data
  }

  async remove(id: string): Promise<Perito> {
    const response = await this.delete<Perito>(`peritos/${id}`)
    return response.data
  }

  async getAlerts(): Promise<Perito[]> {
    const response = await this.get<Perito[]>('peritos/alerts')
    return response.data
  }

  async uploadFirma(peritoId: string, formData: FormData): Promise<void> {
    await this.post(`peritos/${peritoId}/firma`, formData)
  }
}

export const peritoService = new PeritoService()
