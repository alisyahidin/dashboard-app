import { index, pgTable, primaryKey, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

// default common columns on table
const baseColumns = {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { mode: 'string', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string', withTimezone: true }),
  deletedAt: timestamp("deleted_at", { mode: 'string', withTimezone: true }),
};

export const roles = pgTable("roles", {
  ...baseColumns,
  name: varchar({ length: 50 }).notNull().unique(),
  description: text(),
});

export const permissions = pgTable("permissions", {
  ...baseColumns,
  name: varchar({ length: 100 }).notNull().unique(),
  description: text(),
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at", { mode: 'string', withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.roleId, table.permissionId] }),
]);

export const users = pgTable("users", {
  ...baseColumns,
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  passwordHash: text(),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: 'restrict' }),
}, (table) => [
  index("users_role_id_idx").on(table.roleId),
]);

export const sessions = pgTable("sessions", {
  ...baseColumns,
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at", { mode: 'string', withTimezone: true }).notNull(),
}, (table) => [
  index("sessions_user_id_idx").on(table.userId),
]);
