import { and, eq, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../db/index.js';
import { invites, roles, users } from '../db/schema.js';

const inviters = alias(users, 'inviters');

export const inviteRepository = {
  async findByToken(token: string) {
    const [row] = await db
      .select({
        id: invites.id,
        userId: users.id,
        name: users.name,
        email: users.email,
        roleId: users.roleId,
        hasPassword: sql<boolean>`${users.passwordHash} is not null`,
        role: roles.name,
        invitedBy: inviters.name,
        usedAt: invites.usedAt,
      })
      .from(invites)
      .innerJoin(users, and(eq(users.id, invites.userId), isNull(users.deletedAt)))
      .leftJoin(roles, eq(roles.id, users.roleId))
      .leftJoin(inviters, eq(inviters.id, invites.invitedBy))
      .where(eq(invites.token, token))
      .limit(1);
    return row;
  },

  async accept(inviteId: string, userId: string, passwordHash: string): Promise<boolean> {
    return db.transaction(async (tx) => {
      const [used] = await tx
        .update(invites)
        .set({ usedAt: sql`now()` })
        .where(and(eq(invites.id, inviteId), isNull(invites.usedAt)))
        .returning({ id: invites.id });
      if (!used) return false;
      await tx.update(users).set({ passwordHash, updatedAt: sql`now()` }).where(eq(users.id, userId));
      return true;
    });
  },
};
