import APIBase from './httpBase'

export interface ConfigData {
  business_hours?: {
    lunesViernesApertura: string
    lunesViernesCierre: string
    sabadoApertura: string
    sabadoCierre: string
    domingoCerrado: boolean
  }
  firma_electronica?: {
    ruc: string
    razonSocial: string
    direccionEstablecimiento: string
    contribuyenteEspecial: string
    obligadoContabilidad: boolean
  }
  smtp?: {
    host: string
    puerto: string
    usuario: string
    password: string
  }
}

class ConfigService extends APIBase {
  async getAll(): Promise<ConfigData> {
    const response = await this.get<ConfigData>('configuracion')
    return response.data
  }

  async upsert(key: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await this.put<Record<string, unknown>>(`configuracion/${key}`, data)
    return response.data
  }
}

export const configService = new ConfigService()
