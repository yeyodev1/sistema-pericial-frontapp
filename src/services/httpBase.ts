import axios, { HttpStatusCode } from 'axios'
import type { AxiosResponse, AxiosRequestConfig } from 'axios'

class APIBase {
  private baseUrl: string
  private axiosInstance = axios.create()

  constructor() {
    const hostname = window.location.hostname
    const envUrl = (import.meta.env.VITE_API_BASE_URL as string) || ''

    let baseUrl: string
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      baseUrl = 'http://localhost:8100'
    } else if (hostname.includes('bakano.ec')) {
      baseUrl = 'https://testing-storybrand-backapp.bakano.ec'
    } else {
      baseUrl = envUrl || 'http://localhost:8100'
    }

    const trimmed = baseUrl.replace(/\/+$/, '')
    this.baseUrl = trimmed.endsWith('/api') || /\/api\//.test(trimmed)
      ? trimmed
      : `${trimmed}/api`
    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        config.timeout = config.timeout || 15000
        return config
      },
      (error) => Promise.reject(error),
    )

    this.axiosInstance.interceptors.response.use(
      (response) => {
        const body = response.data
        if (body && typeof body === 'object' && 'message' in body) {
          const { message, data } = body
          const isMutation = response.config.method &&
            ['post', 'put', 'patch', 'delete'].includes(response.config.method)
          if (message && isMutation) {
            window.dispatchEvent(new CustomEvent('api:success', { detail: { message } }))
          }
          response.data = data !== undefined ? data : body
        }
        return response
      },
      (error) => {
        if (axios.isAxiosError(error) && error.response) {
          const msg = error.response.data?.message || error.message
          if (error.response.status === HttpStatusCode.Unauthorized) {
            window.dispatchEvent(new CustomEvent('auth:token-expired'))
          } else {
            window.dispatchEvent(new CustomEvent('api:error', { detail: { message: msg } }))
          }
          throw { status: error.response.status, message: msg, data: error.response.data }
        }
        const fallbackMsg = error.message || 'Error de conexión'
        window.dispatchEvent(new CustomEvent('api:error', { detail: { message: fallbackMsg } }))
        throw { status: error.status || HttpStatusCode.InternalServerError, message: fallbackMsg }
      },
    )
  }

  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`
  }

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const accessToken = localStorage.getItem('access_token')
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    return headers
  }

  protected async get<T>(
    endpoint: string,
    headers?: Record<string, string>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const url = this.buildUrl(endpoint)
    return this.axiosInstance.get<T>(url, {
      headers: headers || this.getHeaders(),
      ...config,
    })
  }

  protected async post<T>(
    endpoint: string,
    data: unknown,
    headers?: Record<string, string>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const url = this.buildUrl(endpoint)
    const isFormData = data instanceof FormData
    const finalHeaders = headers || this.getHeaders()

    if (isFormData) {
      delete finalHeaders['Content-Type']
    }

    return this.axiosInstance.post<T>(url, data, {
      headers: finalHeaders,
      ...config,
    })
  }

  protected async put<T>(
    endpoint: string,
    data: unknown,
    headers?: Record<string, string>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const url = this.buildUrl(endpoint)
    return this.axiosInstance.put<T>(url, data, {
      headers: headers || this.getHeaders(),
      ...config,
    })
  }

  protected async patch<T>(
    endpoint: string,
    data: unknown,
    headers?: Record<string, string>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const url = this.buildUrl(endpoint)
    return this.axiosInstance.patch<T>(url, data, {
      headers: headers || this.getHeaders(),
      ...config,
    })
  }

  protected async delete<T>(
    endpoint: string,
    headers?: Record<string, string>,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const url = this.buildUrl(endpoint)
    return this.axiosInstance.delete<T>(url, {
      headers: headers || this.getHeaders(),
      ...config,
    })
  }
}

export default APIBase
