import { index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

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

export const reportStatus = pgEnum("report_status", ["pending", "approved", "rejected"]);
export const reportHistoryKind = pgEnum("report_history_kind", ["created", "status", "edited"]);

export const reports = pgTable("reports", {
  ...baseColumns,
  number: integer().generatedAlwaysAsIdentity({ startWith: 1001 }).notNull().unique(),
  name: varchar({ length: 100 }).notNull(),
  description: text().notNull(),
  status: reportStatus().notNull().default("pending"),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: 'restrict' }),
  reviewedAt: timestamp("reviewed_at", { mode: 'string', withTimezone: true }),
}, (table) => [
  index("reports_status_idx").on(table.status),
  index("reports_created_by_idx").on(table.createdBy),
  index("reports_created_at_idx").on(table.createdAt),
]);

export const reportHistory = pgTable("report_history", {
  id: uuid().primaryKey().defaultRandom(),
  reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: 'cascade' }),
  kind: reportHistoryKind().notNull(),
  fromStatus: reportStatus("from_status"),
  toStatus: reportStatus("to_status").notNull(),
  actorId: uuid("actor_id").notNull().references(() => users.id, { onDelete: 'restrict' }),
  note: text().notNull().default(""),
  changes: text().array(),
  createdAt: timestamp("created_at", { mode: 'string', withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("report_history_report_id_idx").on(table.reportId),
]);
