import { z } from 'zod';
import type { RoleWithPermissions } from '../repositories/role.repository.js';

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
