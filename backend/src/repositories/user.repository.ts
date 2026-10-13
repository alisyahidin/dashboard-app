import { and, asc, eq, ilike, isNull, ne, or, type SQL, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { invites, roles, users } from '../db/schema.js';

export type User = typeof users.$inferSelect;
export type UserListRow = Awaited<ReturnType<typeof userRepository.listActive>>[number];

export type UserListFilter = {
  role: string;
  q: string;
};

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function listWhere({ role, q }: UserListFilter) {
  const conditions: SQL[] = [isNull(users.deletedAt)];
  if (role !== 'all') conditions.push(eq(roles.name, role));
  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    const search = or(ilike(users.name, pattern), ilike(users.email, pattern));
    if (search) conditions.push(search);
  }
  return and(...conditions);
}

export const userRepository = {
  async findActiveByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);
    return user;
  },

  async findActiveById(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    return user;
  },

  async emailTaken(email: string, exceptId?: string): Promise<boolean> {
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), exceptId ? ne(users.id, exceptId) : undefined, isNull(users.deletedAt)))
      .limit(1);
    return Boolean(row);
  },

  async create(data: Pick<User, 'name' | 'email' | 'roleId'>, invite: { token: string; invitedBy: string }): Promise<string> {
    return db.transaction(async (tx) => {
      const [row] = await tx.insert(users).values(data).returning({ id: users.id });
      if (!row) throw new Error('Failed to create user');
      await tx.insert(invites).values({ userId: row.id, ...invite });
      return row.id;
    });
  },

  async update(id: string, data: Partial<Pick<User, 'name' | 'email' | 'roleId'>>) {
    await db
      .update(users)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(users.id, id));
  },

  async findListRowById(id: string) {
    const [row] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: { id: roles.id, name: roles.name },
        hasPassword: sql<boolean>`${users.passwordHash} is not null`,
        invite: { token: invites.token, createdAt: invites.createdAt },
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(roles, eq(roles.id, users.roleId))
      .leftJoin(invites, and(eq(invites.userId, users.id), isNull(invites.usedAt)))
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    return row;
  },

  async countActive(filter: UserListFilter): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .leftJoin(roles, eq(roles.id, users.roleId))
      .where(listWhere(filter));
    return row?.count ?? 0;
  },

  async listActive(filter: UserListFilter & { limit: number; offset: number }) {
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: { id: roles.id, name: roles.name },
        hasPassword: sql<boolean>`${users.passwordHash} is not null`,
        invite: { token: invites.token, createdAt: invites.createdAt },
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(roles, eq(roles.id, users.roleId))
      .leftJoin(invites, and(eq(invites.userId, users.id), isNull(invites.usedAt)))
      .where(listWhere(filter))
      .orderBy(asc(users.name), asc(users.email))
      .limit(filter.limit)
      .offset(filter.offset);
  },
};
