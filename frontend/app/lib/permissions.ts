import type { User } from '~/services/auth'

export function hasPermission(user: User, permission: string) {
  return user.permissions.includes(permission)
}
