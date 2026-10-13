import { api } from './api'
import { me, type LoginResponse } from './auth'

export type UserStatus = 'active' | 'invited'

export type AdminUser = {
  id: string
  name: string
  email: string
  role: { id: string; name: string }
  status: UserStatus
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

function inviteUrl(token: string) {
  return `${window.location.origin}/invite/${token}`
}

async function currentActor() {
  const { user } = await me()
  return user
}

type ApiUserListItem = {
  id: string
  name: string
  email: string
  role: { id: string; name: string } | null
  status: UserStatus
  invite: { token: string; createdAt: string } | null
  createdAt: string
}

function fromApiUser(user: ApiUserListItem, actorEmail: string): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: { id: user.role?.id ?? '', name: user.role?.name ?? 'No role' },
    status: user.status,
    invite: user.invite ? { url: inviteUrl(user.invite.token), createdAt: user.invite.createdAt } : null,
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

  return {
    items: response.items.map((user) => fromApiUser(user, actor.email)),
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
    pageCount: response.pageCount,
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

export function getInvite(token: string): Promise<InviteDetails> {
  return api<InviteDetails>(`/invites/${encodeURIComponent(token)}`)
}

export function acceptInvite(token: string, password: string): Promise<LoginResponse> {
  return api<LoginResponse>(`/invites/${encodeURIComponent(token)}/accept`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}
