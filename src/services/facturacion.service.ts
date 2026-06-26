import APIBase from './httpBase'
import type { Factura } from '@/types'

export interface CreateFacturaPayload {
  numeroFactura: string
  sorteoId?: string
  peritoId: string
  clienteId?: string
  clienteNombre: string
  clienteRuc: string
  fechaEmision?: string
  subtotal: number
  iva: number
  total: number
  estado?: string
  observaciones?: string
}

class FacturacionService extends APIBase {
  async findAll(): Promise<Factura[]> {
    const response = await this.get<Factura[]>('facturas')
    return response.data
  }

  async create(payload: CreateFacturaPayload): Promise<Factura> {
    const response = await this.post<Factura>('facturas', payload)
    return response.data
  }

  async update(id: string, payload: Partial<CreateFacturaPayload>): Promise<Factura> {
    const response = await this.patch<Factura>(`facturas/${id}`, payload)
    return response.data
  }

  async remove(id: string): Promise<void> {
    await this.delete(`facturas/${id}`)
  }

  async getStats(): Promise<{ porFacturar: number; autorizadas: number; rechazadas: number }> {
    const response = await this.get<{ porFacturar: number; autorizadas: number; rechazadas: number }>('facturas/stats')
    return response.data
  }
}

export const facturacionService = new FacturacionService()
