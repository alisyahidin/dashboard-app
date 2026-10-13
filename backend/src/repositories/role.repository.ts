import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { permissions, rolePermissions, roles } from '../db/schema.js';

export type RoleWithPermissions = { id: string; name: string; permissions: string[] };

export const roleRepository = {
  listActive() {
    return db
      .select({ id: roles.id, name: roles.name })
      .from(roles)
      .where(isNull(roles.deletedAt))
      .orderBy(asc(roles.name));
  },

  async existsActive(id: string): Promise<boolean> {
    const [row] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.id, id), isNull(roles.deletedAt)))
      .limit(1);
    return Boolean(row);
  },

  async findWithPermissions(roleId: string): Promise<RoleWithPermissions | undefined> {
    const rows = await db
      .select({ id: roles.id, name: roles.name, permission: permissions.name })
      .from(roles)
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(
        permissions,
        and(eq(permissions.id, rolePermissions.permissionId), isNull(permissions.deletedAt)),
      )
      .where(and(eq(roles.id, roleId), isNull(roles.deletedAt)));

    const [first] = rows;
    if (!first) return undefined;
    return {
      id: first.id,
      name: first.name,
      permissions: rows.flatMap((r) => (r.permission ? [r.permission] : [])),
    };
  },
};
