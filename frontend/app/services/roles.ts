import { api } from './api'

export type Role = {
  id: string
  name: string
}

export function listRoles(): Promise<Role[]> {
  return api<Role[]>('/roles')
}
