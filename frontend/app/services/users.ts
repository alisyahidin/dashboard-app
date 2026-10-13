import { api, ApiError } from './api'
import { me } from './auth'
import { delay, readDb, writeDb } from './admin-mock'

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

async function currentActor() {
  const { user } = await me()
  return user
}

type ApiUserListItem = {
  id: string
  name: string
  email: string
  role: { id: string; name: string } | null
  createdAt: string
}

function fromApiUser(user: ApiUserListItem, actorEmail: string): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: { id: user.role?.id ?? '', name: user.role?.name ?? 'No role' },
    status: 'active',
    lastActiveAt: null,
    invite: null,
    isCurrentUser: user.email.toLowerCase() === actorEmail.toLowerCase(),
  }
}

export async function listUsers({ roleId = 'all', q = '', page = 1, pageSize = 8 }: ListUsersParams = {}): Promise<ListUsersResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (roleId !== 'all') params.set('role', roleId)
  if (q.trim()) params.set('q', q.trim())

  const [actor, response] = await Promise.all([
    currentActor(),
    api<{ items: ApiUserListItem[]; total: number; page: number; pageSize: number; pageCount: number }>(`/users?${params}`),
  ])

  const items: AdminUser[] = response.items.map((user) => fromApiUser(user, actor.email))

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
  const [actor, user] = await Promise.all([
    currentActor(),
    api<ApiUserListItem>('/users', { method: 'POST', body: JSON.stringify(body) }),
  ])
  return { user: fromApiUser(user, actor.email) }
}

export async function updateUser(id: string, body: UserRequest): Promise<AdminUser> {
  const [actor, user] = await Promise.all([
    currentActor(),
    api<ApiUserListItem>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  ])
  return fromApiUser(user, actor.email)
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
