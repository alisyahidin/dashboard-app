import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sessions, users } from '../db/schema.js';

export type NewSession = Pick<typeof sessions.$inferInsert, 'userId' | 'ipAddress' | 'userAgent' | 'expiresAt'>;

export const sessionRepository = {
  async create(data: NewSession) {
    const [session] = await db
      .insert(sessions)
      .values(data)
      .returning({ id: sessions.id, expiresAt: sessions.expiresAt });
    if (!session) throw new Error('Failed to create session');
    return session;
  },

  async findActiveWithUser(sessionId: string, userId: string) {
    const [row] = await db
      .select({
        session: { id: sessions.id, expiresAt: sessions.expiresAt },
        user: { id: users.id, name: users.name, email: users.email, roleId: users.roleId },
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(
          eq(sessions.id, sessionId),
          eq(users.id, userId),
          isNull(sessions.deletedAt),
          isNull(users.deletedAt),
          gt(sessions.expiresAt, sql`now()`),
        ),
      )
      .limit(1);
    return row;
  },

  async revoke(id: string) {
    await db
      .update(sessions)
      .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(sessions.id, id));
  },
};
