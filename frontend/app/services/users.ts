import { api, ApiError } from './api'
import { me } from './auth'
import {
  delay,
  inviteUrl,
  newId,
  newToken,
  readDb,
  requireAdminPermission,
  writeDb,
  type MockUser,
} from './admin-mock'

export type UserStatus = 'active' | 'invited'

export type AdminUser = {
  id: string
  name: string
  email: string
  role: { id: string; name: string }
  status: UserStatus
  lastActiveAt: string | null
  invite: { url: string; createdAt: string } | null
  isCurrentUser: boolean
}

export type ListUsersParams = {
  roleId?: string
  q?: string
  page?: number
  pageSize?: number
}

export type ListUsersResponse = {
  items: AdminUser[]
  total: number
  page: number
  pageSize: number
  pageCount: number
  summary: { all: number; invited: number }
}

export type UserRequest = {
  name: string
  email: string
  roleId: string
}

export type CreateUserResponse = {
  user: AdminUser
}

export type InviteDetails =
  | { state: 'valid'; name: string; email: string; role: string; invitedBy: string }
  | { state: 'used'; email: string }

export const USER_NAME_MIN = 2
export const USER_NAME_MAX = 80
export const PASSWORD_MIN = 8

export const passwordRules = [
  { key: 'length', label: `At least ${PASSWORD_MIN} characters`, test: (password: string) => password.length >= PASSWORD_MIN },
  { key: 'mix', label: 'Includes a letter and a number', test: (password: string) => /[A-Za-z]/.test(password) && /\d/.test(password) },
] as const

function statusOf(user: MockUser): UserStatus {
  return user.hasPassword ? 'active' : 'invited'
}

async function currentActor() {
  const { user } = await me()
  return user
}

function toAdminUser(user: MockUser, roles: { id: string; name: string }[], currentEmail: string): AdminUser {
  const role = roles.find((r) => r.id === user.roleId)
  const status = statusOf(user)
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: { id: user.roleId, name: role?.name ?? 'No role' },
    status,
    lastActiveAt: user.lastActiveAt,
    invite: status === 'invited' && user.invite
      ? { url: inviteUrl(user.invite.token), createdAt: user.invite.createdAt }
      : null,
    isCurrentUser: user.email.toLowerCase() === currentEmail.toLowerCase(),
  }
}

function validateUser(body: UserRequest, users: MockUser[], roleIds: string[], excludeId?: string) {
  const name = body.name.trim()
  const email = body.email.trim().toLowerCase()
  const fieldErrors: Record<string, string[]> = {}
  if (name.length < USER_NAME_MIN || name.length > USER_NAME_MAX) fieldErrors['name'] = ["Enter the person's full name."]
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors['email'] = ['Enter a valid email address, like name@company.com.']
  else if (users.some((u) => u.id !== excludeId && u.email.toLowerCase() === email)) fieldErrors['email'] = ['A user with this email already exists.']
  if (!roleIds.includes(body.roleId)) fieldErrors['roleId'] = ['Choose a role.']
  if (Object.keys(fieldErrors).length) throw new ApiError(400, 'Invalid request body', fieldErrors)
  return { name, email }
}

function newInvite(invitedBy: string) {
  return {
    token: newToken(),
    createdAt: new Date().toISOString(),
    usedAt: null,
    invitedBy,
  }
}

type ApiUserListItem = {
  id: string
  name: string
  email: string
  role: { id: string; name: string } | null
  createdAt: string
}

export async function listUsers({ roleId = 'all', q = '', page = 1, pageSize = 8 }: ListUsersParams = {}): Promise<ListUsersResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (roleId !== 'all') params.set('role', roleId)
  if (q.trim()) params.set('q', q.trim())

  const [actor, response] = await Promise.all([
    currentActor(),
    api<{ items: ApiUserListItem[]; total: number; page: number; pageSize: number; pageCount: number }>(`/users?${params}`),
  ])

  const items: AdminUser[] = response.items.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: { id: user.role?.name ?? '', name: user.role?.name ?? 'No role' },
    status: 'active',
    lastActiveAt: null,
    invite: null,
    isCurrentUser: user.email.toLowerCase() === actor.email.toLowerCase(),
  }))

  return {
    items,
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
    pageCount: response.pageCount,
    summary: {
      all: response.total,
      invited: items.filter((u) => u.status === 'invited').length,
    },
  }
}

export async function createUser(body: UserRequest): Promise<CreateUserResponse> {
  const actor = await currentActor()
  requireAdminPermission(actor.permissions, 'users:manage', actor.role)
  await delay(700)

  const db = readDb()
  const { name, email } = validateUser(body, db.users, db.roles.map((r) => r.id))
  const user: MockUser = {
    id: newId(),
    name,
    email,
    roleId: body.roleId,
    hasPassword: false,
    lastActiveAt: null,
    invite: newInvite(actor.name),
    createdAt: new Date().toISOString(),
  }
  writeDb((d) => { d.users.push(user) })
  return { user: toAdminUser(user, db.roles, actor.email) }
}

export async function updateUser(id: string, body: UserRequest): Promise<AdminUser> {
  const actor = await currentActor()
  requireAdminPermission(actor.permissions, 'users:manage', actor.role)
  await delay(600)

  const db = readDb()
  const existing = db.users.find((u) => u.id === id)
  if (!existing) throw new ApiError(404, 'User not found')
  const { name, email } = validateUser(body, db.users, db.roles.map((r) => r.id), id)
  const isSelf = existing.email.toLowerCase() === actor.email.toLowerCase()
  if (isSelf && body.roleId !== existing.roleId) throw new ApiError(403, "You can't change your own role. Ask another admin.")

  const updated: MockUser = { ...existing, name, email, roleId: body.roleId }
  writeDb((d) => { d.users = d.users.map((u) => (u.id === id ? updated : u)) })
  return toAdminUser(updated, db.roles, actor.email)
}

export async function getInvite(token: string): Promise<InviteDetails> {
  await delay(500)
  const db = readDb()
  const user = db.users.find((u) => u.invite?.token === token)
  if (!user?.invite) throw new ApiError(404, 'Invite not found')
  if (user.invite.usedAt || user.hasPassword) return { state: 'used', email: user.email }
  return {
    state: 'valid',
    name: user.name,
    email: user.email,
    role: db.roles.find((r) => r.id === user.roleId)?.name ?? 'No role',
    invitedBy: user.invite.invitedBy,
  }
}

export async function acceptInvite(token: string, password: string): Promise<{ email: string; role: string }> {
  await delay(900)
  const db = readDb()
  const user = db.users.find((u) => u.invite?.token === token)
  if (!user?.invite) throw new ApiError(404, 'Invite not found')
  if (user.invite.usedAt || user.hasPassword) throw new ApiError(410, 'This link was already used.')
  if (!passwordRules.every((rule) => rule.test(password))) {
    throw new ApiError(400, 'Invalid request body', { password: ['Password does not meet the requirements.'] })
  }

  const now = new Date().toISOString()
  writeDb((d) => {
    d.users = d.users.map((u) =>
      u.id === user.id && u.invite ? { ...u, hasPassword: true, lastActiveAt: now, invite: { ...u.invite, usedAt: now } } : u,
    )
  })
  return { email: user.email, role: db.roles.find((r) => r.id === user.roleId)?.name ?? 'No role' }
}
