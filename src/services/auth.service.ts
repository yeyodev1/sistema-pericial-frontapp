import APIBase from './httpBase'
import type { UserRole } from '@/stores/user'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: UserRole
  }
}

export interface ProfileData {
  name?: string
  email?: string
}

class AuthService extends APIBase {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.post<LoginResponse>('auth/login', credentials)
    return response.data
  }

  async getCurrentUser(): Promise<LoginResponse['user']> {
    const response = await this.get<LoginResponse['user']>('auth/me')
    return response.data
  }

  async updateProfile(data: ProfileData): Promise<LoginResponse['user']> {
    const response = await this.put<LoginResponse['user']>('auth/profile', data)
    return response.data
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.put('auth/password', { currentPassword, newPassword })
  }
}

export const authService = new AuthService()
