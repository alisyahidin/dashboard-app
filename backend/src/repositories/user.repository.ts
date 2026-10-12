import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

export type User = typeof users.$inferSelect;

export const userRepository = {
  async findActiveByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);
    return user;
  },
};
