import { z } from 'zod';
import type { RoleWithPermissions } from '../repositories/role.repository.js';
import type { UserListRow } from '../repositories/user.repository.js';

export const userResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  role: z.string().nullable(),
  permissions: z.array(z.string()),
});
export type UserResponse = z.infer<typeof userResponseSchema>;

export function toUserResponse(
  user: { id: string; name: string; email: string },
  role: RoleWithPermissions | null,
): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: role?.name ?? null,
    permissions: role?.permissions ?? [],
  };
}

export const USER_PAGE_SIZE_DEFAULT = 20;
export const USER_PAGE_SIZE_MAX = 100;

export const listUsersQuerySchema = z.object({
  role: z.string().trim().toLowerCase().max(50).catch('all').transform((role) => role || 'all'),
  q: z.string().trim().max(100).catch(''),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(USER_PAGE_SIZE_MAX).catch(USER_PAGE_SIZE_DEFAULT),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const userListItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  role: z.object({ id: z.uuid(), name: z.string() }).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
});
export type UserListItem = z.infer<typeof userListItemSchema>;

export const listUsersResponseSchema = z.object({
  items: z.array(userListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  pageCount: z.number().int(),
});
export type ListUsersResponse = z.infer<typeof listUsersResponseSchema>;

export function toUserListItem(row: UserListRow): UserListItem {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}
