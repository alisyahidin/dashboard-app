import { api, ApiError } from './api'
import { me } from './auth'
import {
  ALL_PERMISSION_KEYS,
  delay,
  newId,
  PERMISSIONS,
  readDb,
  requireAdminPermission,
  writeDb,
  type MockRole,
  type PermissionKey,
} from './admin-mock'

export { PERMISSIONS, type PermissionKey }

export type AdminRole = {
  id: string
  name: string
  description: string
  locked: boolean
  custom: boolean
  permissions: PermissionKey[]
  userCount: number
}

export type Role = {
  id: string
  name: string
}

export type CreateRoleRequest = {
  name: string
  description: string
  copyFromRoleId: string | null
}

export type RolePermissionsChange = {
  roleId: string
  permissions: PermissionKey[]
}

export const ROLE_NAME_MIN = 2
export const ROLE_NAME_MAX = 50

const REPORT_PERMISSIONS: PermissionKey[] = ['reports:write', 'reports:edit', 'reports:approve', 'reports:change']

export function normalizePermissions(
  current: PermissionKey[],
  toggled: PermissionKey,
  enabled: boolean,
): PermissionKey[] {
  const next = new Set(current)
  if (enabled) next.add(toggled)
  else next.delete(toggled)

  if (toggled === 'reports:read' && !enabled) REPORT_PERMISSIONS.forEach((p) => next.delete(p))
  if (REPORT_PERMISSIONS.includes(toggled) && enabled) next.add('reports:read')
  if (toggled === 'reports:change' && enabled) next.add('reports:approve')
  if (toggled === 'reports:approve' && !enabled) next.delete('reports:change')

  return ALL_PERMISSION_KEYS.filter((p) => next.has(p))
}

function isConsistent(permissions: PermissionKey[]) {
  const has = new Set(permissions)
  if (REPORT_PERMISSIONS.some((p) => has.has(p)) && !has.has('reports:read')) return false
  if (has.has('reports:change') && !has.has('reports:approve')) return false
  return true
}

async function requireRolesManager() {
  const { user } = await me()
  requireAdminPermission(user.permissions, 'roles:manage', user.role)
}

function toAdminRole(role: MockRole, userCount: number): AdminRole {
  return { ...role, permissions: [...role.permissions], userCount }
}

export function listRoles(): Promise<Role[]> {
  return api<Role[]>('/roles')
}

export async function createRole(body: CreateRoleRequest): Promise<AdminRole> {
  await requireRolesManager()
  await delay(600)

  const db = readDb()
  const name = body.name.trim()
  if (name.length < ROLE_NAME_MIN || name.length > ROLE_NAME_MAX) {
    throw new ApiError(400, 'Invalid request body', { name: [`Enter a role name of ${ROLE_NAME_MIN} to ${ROLE_NAME_MAX} characters.`] })
  }
  if (db.roles.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
    throw new ApiError(400, 'Invalid request body', { name: ['A role with this name already exists.'] })
  }
  const source = body.copyFromRoleId ? db.roles.find((r) => r.id === body.copyFromRoleId) : null

  const role: MockRole = {
    id: newId(),
    name,
    description: body.description.trim() || 'Custom role.',
    locked: false,
    custom: true,
    permissions: source && !source.locked ? [...source.permissions] : [],
  }
  writeDb((d) => { d.roles.push(role) })
  return toAdminRole(role, 0)
}

export async function deleteRole(id: string): Promise<void> {
  await requireRolesManager()
  await delay(500)

  const db = readDb()
  const role = db.roles.find((r) => r.id === id)
  if (!role) throw new ApiError(404, 'Role not found')
  if (!role.custom) throw new ApiError(403, 'Built-in roles cannot be deleted.')
  if (db.users.some((u) => u.roleId === id)) throw new ApiError(409, 'Move its users to another role before deleting it.')
  writeDb((d) => { d.roles = d.roles.filter((r) => r.id !== id) })
}

export async function saveRolePermissions(changes: RolePermissionsChange[]): Promise<AdminRole[]> {
  await requireRolesManager()
  await delay(700)

  const db = readDb()
  for (const change of changes) {
    const role = db.roles.find((r) => r.id === change.roleId)
    if (!role) throw new ApiError(404, 'Role not found')
    if (role.locked) throw new ApiError(403, `${role.name} always keeps every permission.`)
    if (!change.permissions.every((p) => ALL_PERMISSION_KEYS.includes(p)) || !isConsistent(change.permissions)) {
      throw new ApiError(400, `The permissions for ${role.name} are not consistent.`)
    }
  }

  writeDb((d) => {
    d.roles = d.roles.map((role) => {
      const change = changes.find((c) => c.roleId === role.id)
      return change ? { ...role, permissions: ALL_PERMISSION_KEYS.filter((p) => change.permissions.includes(p)) } : role
    })
  })
  const saved = readDb()
  return saved.roles.map((role) => toAdminRole(role, saved.users.filter((u) => u.roleId === role.id).length))
}

export const PERMISSION_GROUPS = ['Reports', 'Administration'] as const

export function permissionsInGroup(group: (typeof PERMISSION_GROUPS)[number]) {
  return PERMISSIONS.filter((p) => p.group === group)
}
