import { sql } from 'drizzle-orm';
import type { dbSeed } from './index.js';

import type { Role } from '../../constants/rbac.js';
import * as schema from '../schema.js';

export async function seedusers(db: typeof dbSeed) {
  console.log('seeding users started ...');

  const roleIds = new Map((await db.select().from(schema.roles)).map((r) => [r.name, r.id]));
  const roleId = (role: Role) => roleIds.get(role) ?? null;

  await db
    .insert(schema.users)
    .values([
      {
        name: 'Admin',
        email: 'admin@mail.com',
        passwordHash: '$argon2id$v=19$m=65536,p=4,t=3$KIR4omps/88PIJBEAgJ6FQ$5ozKDd91ED9rw7I7sDscYIj+gqnmtEM/jv0RNZ5sU18', // admin123!#
        roleId: roleId('admin'),
      },
      {
        name: 'Supervisor',
        email: 'supervisor@mail.com',
        passwordHash: '$argon2id$v=19$m=65536,p=4,t=3$2PXNX1wlGJFckXbCNcjvnw$VmKsKihUA/L6baFh02FhPXDT9zmET4WHUt1/slto9ps', // supervisor123!#
        roleId: roleId('supervisor'),
      },
      {
        name: 'Officer',
        email: 'officer@mail.com',
        passwordHash: '$argon2id$v=19$m=65536,p=4,t=3$R7MHBNypsAoGM0OlaPhvqQ$i2pNYwpoEHrc5ueyQrmFNfbpufqReRDSSnUZT2nkvyc', // officer123!#
        roleId: roleId('officer'),
      },
    ])
    .onConflictDoUpdate({ target: schema.users.email, set: { roleId: sql`excluded.role_id` } });

  console.log('seeding users ended ...');
}
