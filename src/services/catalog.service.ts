import APIBase from './httpBase'
import type { Juez, Juzgado, UnidadJudicial, Cliente, CatalogType } from '@/types'

type CatalogMap = {
  jueces: Juez
  juzgados: Juzgado
  'unidades-judiciales': UnidadJudicial
  clientes: Cliente
}

class CatalogService extends APIBase {
  async findAll<T extends CatalogType>(type: T): Promise<CatalogMap[T][]> {
    const response = await this.get<CatalogMap[T][]>(`catalogs/${type}`)
    return response.data
  }

  async create<T extends CatalogType>(type: T, payload: Omit<CatalogMap[T], '_id' | 'isActive'>): Promise<CatalogMap[T]> {
    const response = await this.post<CatalogMap[T]>(`catalogs/${type}`, payload)
    return response.data
  }

  async update<T extends CatalogType>(type: T, id: string, payload: Partial<Omit<CatalogMap[T], '_id' | 'isActive'>>): Promise<CatalogMap[T]> {
    const response = await this.patch<CatalogMap[T]>(`catalogs/${type}/${id}`, payload)
    return response.data
  }

  async remove<T extends CatalogType>(type: T, id: string): Promise<CatalogMap[T]> {
    const response = await this.delete<CatalogMap[T]>(`catalogs/${type}/${id}`)
    return response.data
  }
}

export const catalogService = new CatalogService()
