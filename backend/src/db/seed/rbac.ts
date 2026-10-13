import { and, eq, notInArray } from 'drizzle-orm';
import type { dbSeed } from './index.js';

import { PERMISSIONS, ROLE_PERMISSIONS, ROLES } from '../../constants/rbac.js';
import * as schema from '../schema.js';

export async function seedRbac(db: typeof dbSeed) {
  console.log('seeding rbac started ...');

  await db
    .insert(schema.roles)
    .values(ROLES.map((name) => ({ name })))
    .onConflictDoNothing({ target: schema.roles.name });

  await db
    .insert(schema.permissions)
    .values(PERMISSIONS.map((name) => ({ name })))
    .onConflictDoNothing({ target: schema.permissions.name });

  const roleIds = new Map<string, string>((await db.select().from(schema.roles)).map((r) => [r.name, r.id]));
  const permissionIds = new Map<string, string>((await db.select().from(schema.permissions)).map((p) => [p.name, p.id]));

  const rolePermissions = ROLES.flatMap((role) =>
    ROLE_PERMISSIONS[role].map((permission) => {
      const roleId = roleIds.get(role);
      const permissionId = permissionIds.get(permission);
      if (!roleId || !permissionId) throw new Error(`Missing role "${role}" or permission "${permission}"`);
      return { roleId, permissionId };
    }),
  );

  await db.insert(schema.rolePermissions).values(rolePermissions).onConflictDoNothing();

  for (const role of ROLES) {
    const roleId = roleIds.get(role);
    if (!roleId) continue;
    const allowed = rolePermissions.filter((rp) => rp.roleId === roleId).map((rp) => rp.permissionId);
    await db
      .delete(schema.rolePermissions)
      .where(and(eq(schema.rolePermissions.roleId, roleId), notInArray(schema.rolePermissions.permissionId, allowed)));
  }

  console.log('seeding rbac ended ...');
}
