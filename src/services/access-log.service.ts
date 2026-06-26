import APIBase from './httpBase'
import type { AccessLog } from '@/types'

class AccessLogService extends APIBase {
  async findAll(params?: {
    email?: string
    accion?: string
    desde?: string
    hasta?: string
  }): Promise<AccessLog[]> {
    const query = new URLSearchParams()
    if (params?.email) query.set('email', params.email)
    if (params?.accion) query.set('accion', params.accion)
    if (params?.desde) query.set('desde', params.desde)
    if (params?.hasta) query.set('hasta', params.hasta)
    const qs = query.toString()
    const response = await this.get<AccessLog[]>(`access-logs${qs ? `?${qs}` : ''}`)
    return response.data
  }
}

export const accessLogService = new AccessLogService()
