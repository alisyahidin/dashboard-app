import { ApiError } from './api'

export const PERMISSIONS = [
  { key: 'reports:read', group: 'Reports', name: 'View reports', description: 'See the dashboard, the report list and status history.' },
  { key: 'reports:write', group: 'Reports', name: 'Create reports', description: 'Submit new reports from the dashboard.' },
  { key: 'reports:edit', group: 'Reports', name: 'Edit pending reports', description: 'Change the name and description while a report is pending.' },
  { key: 'reports:approve', group: 'Reports', name: 'Approve and reject', description: 'Decide on pending reports. Rejecting needs a reason.' },
  { key: 'reports:change', group: 'Reports', name: 'Change decisions', description: 'Switch an approved report to rejected or back, with a reason.' },
  { key: 'users:manage', group: 'Administration', name: 'Manage users', description: 'Add users, edit their details and share login links.' },
  { key: 'roles:manage', group: 'Administration', name: 'Manage roles and permissions', description: 'Create roles and change what each role can do.' },
] as const

export type PermissionKey = (typeof PERMISSIONS)[number]['key']
export type PermissionGroup = (typeof PERMISSIONS)[number]['group']

export const ALL_PERMISSION_KEYS = PERMISSIONS.map((p) => p.key) as PermissionKey[]

export type MockRole = {
  id: string
  name: string
  description: string
  locked: boolean
  custom: boolean
  permissions: PermissionKey[]
}

export type MockInvite = {
  token: string
  createdAt: string
  usedAt: string | null
  invitedBy: string
}

export type MockUser = {
  id: string
  name: string
  email: string
  roleId: string
  hasPassword: boolean
  lastActiveAt: string | null
  invite: MockInvite | null
  createdAt: string
}

type MockDb = {
  version: 1
  roles: MockRole[]
  users: MockUser[]
}

const STORAGE_KEY = 'mock.admin.v1'

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

export function newToken() {
  const bytes = new Uint8Array(9)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 12)
}

export function newId() {
  return crypto.randomUUID()
}

function seed(): MockDb {
  const roles: MockRole[] = [
    { id: 'admin', name: 'Admin', description: 'Runs the workspace. Manages users, roles and every report.', locked: true, custom: false, permissions: [...ALL_PERMISSION_KEYS] },
    { id: 'supervisor', name: 'Supervisor', description: 'Reviews reports from the field and decides on them.', locked: false, custom: false, permissions: ['reports:read', 'reports:approve', 'reports:change'] },
    { id: 'officer', name: 'Field officer', description: 'Submits reports and corrects them while pending.', locked: false, custom: false, permissions: ['reports:read', 'reports:write', 'reports:edit'] },
  ]
  const active = (name: string, email: string, roleId: string, lastActiveHoursAgo: number): MockUser => ({
    id: newId(), name, email, roleId, hasPassword: true, lastActiveAt: hoursAgo(lastActiveHoursAgo), invite: null, createdAt: hoursAgo(24 * 30),
  })
  const users: MockUser[] = [
    active('Admin', 'admin@mail.com', 'admin', 0),
    active('Supervisor', 'supervisor@mail.com', 'supervisor', 3),
    active('Officer', 'officer@mail.com', 'officer', 5),
    active('Sari Wulandari', 'sari.wulandari@example.com', 'supervisor', 20),
    active('Budi Hartono', 'budi.hartono@example.com', 'supervisor', 28),
    active('Rina Putri', 'rina.putri@example.com', 'officer', 50),
    active('Dimas Prasetyo', 'dimas.prasetyo@example.com', 'officer', 21),
    active('Agus Santoso', 'agus.santoso@example.com', 'officer', 70),
    {
      id: newId(), name: 'Wahyu Nugroho', email: 'wahyu.nugroho@example.com', roleId: 'officer', hasPassword: false, lastActiveAt: null, createdAt: hoursAgo(20),
      invite: { token: 'w7k2m9q4x1z8', createdAt: hoursAgo(20), usedAt: null, invitedBy: 'Admin' },
    },
    {
      id: newId(), name: 'Lestari Dewi', email: 'lestari.dewi@example.com', roleId: 'supervisor', hasPassword: false, lastActiveAt: null, createdAt: hoursAgo(24 * 7),
      invite: { token: 'k3d8s1v6n2p0', createdAt: hoursAgo(24 * 7), usedAt: null, invitedBy: 'Admin' },
    },
  ]
  return { version: 1, roles, users }
}

let memory: MockDb | null = null

function load(): MockDb {
  if (memory) return memory
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as MockDb) : null
    memory = parsed?.version === 1 ? parsed : seed()
  } catch {
    memory = seed()
  }
  save(memory)
  return memory
}

function save(db: MockDb) {
  memory = db
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    return
  }
}

export function readDb(): MockDb {
  return structuredClone(load())
}

export function writeDb(update: (db: MockDb) => void) {
  const db = readDb()
  update(db)
  save(db)
}

export function resetMockAdmin() {
  save(seed())
}

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function inviteUrl(token: string) {
  return `${window.location.origin}/invite/${token}`
}

export function requireAdminPermission(permissions: string[], needed: 'users:manage' | 'roles:manage', role: string | null) {
  if (role === 'admin' || permissions.includes(needed)) return
  throw new ApiError(403, "You don't have permission to manage this.")
}
