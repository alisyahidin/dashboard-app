import { api } from './api'

export type User = {
  id: string
  name: string
  email: string
  role: string | null
  permissions: string[]
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  user: User
}

export type MeResponse = {
  user: User
  session: { expiresAt: string }
}

export function login(body: LoginRequest) {
  return api<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function me() {
  return api<MeResponse>('/auth/me')
}

export function logout() {
  return api<void>('/auth/logout', { method: 'POST' })
}
