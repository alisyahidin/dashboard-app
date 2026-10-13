import type { User } from '~/services/auth'
import type { Report } from '~/services/reports'

export function hasPermission(user: User, permission: string) {
  return user.permissions.includes(permission)
}

export function canEditReport(user: User, report: Report) {
  if (report.status !== 'pending' || !hasPermission(user, 'reports:edit')) return false
  return user.role === 'admin' || report.submittedBy.id === user.id
}
