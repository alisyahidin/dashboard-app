import { and, desc, eq, ilike, isNull, or, type SQL, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { reportHistory, reports, roles, users } from '../db/schema.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = typeof db | Transaction;

export type Report = typeof reports.$inferSelect;
export type NewReport = Pick<typeof reports.$inferInsert, 'name' | 'description' | 'createdBy'>;
export type NewReportHistory = Omit<typeof reportHistory.$inferInsert, 'id' | 'createdAt'>;

export type ReportDetailRow = NonNullable<Awaited<ReturnType<typeof reportRepository.findDetailById>>>;
export type ReportListRow = Awaited<ReturnType<typeof reportRepository.list>>[number];

export type ReportListFilter = {
  status: Report['status'] | 'all';
  q: string;
  createdBy?: string | undefined;
};

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function listWhere({ status, q, createdBy }: ReportListFilter) {
  const conditions: SQL[] = [isNull(reports.deletedAt)];
  if (createdBy) conditions.push(eq(reports.createdBy, createdBy));
  if (status !== 'all') conditions.push(eq(reports.status, status));
  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    const search = or(ilike(reports.name, pattern), ilike(reports.description, pattern));
    if (search) conditions.push(search);
  }
  return and(...conditions);
}

export const reportRepository = {
  transaction<T>(fn: (tx: Transaction) => Promise<T>) {
    return db.transaction(fn);
  },

  async create(data: NewReport, executor: Executor = db): Promise<Report> {
    const [report] = await executor.insert(reports).values(data).returning();
    if (!report) throw new Error('Failed to create report');
    return report;
  },

  async findActiveByIdForUpdate(id: string, tx: Transaction): Promise<Report | undefined> {
    const [report] = await tx
      .select()
      .from(reports)
      .where(and(eq(reports.id, id), isNull(reports.deletedAt)))
      .limit(1)
      .for('update');
    return report;
  },

  async update(id: string, data: Partial<Pick<Report, 'name' | 'description'>>, executor: Executor = db) {
    await executor
      .update(reports)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(reports.id, id));
  },

  async updateStatus(id: string, status: Report['status'], executor: Executor = db) {
    await executor
      .update(reports)
      .set({ status, reviewedAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(reports.id, id));
  },

  async addHistory(entry: NewReportHistory, executor: Executor = db) {
    await executor.insert(reportHistory).values(entry);
  },

  async count(filter: ReportListFilter): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reports)
      .where(listWhere(filter));
    return row?.count ?? 0;
  },

  async list(filter: ReportListFilter & { limit: number; offset: number }) {
    return db
      .select({ report: reports, submittedBy: { id: users.id, name: users.name } })
      .from(reports)
      .innerJoin(users, eq(users.id, reports.createdBy))
      .where(listWhere(filter))
      .orderBy(desc(reports.createdAt), desc(reports.number))
      .limit(filter.limit)
      .offset(filter.offset);
  },

  async countByStatus(createdBy?: string): Promise<Record<Report['status'], number>> {
    const rows = await db
      .select({ status: reports.status, count: sql<number>`count(*)::int` })
      .from(reports)
      .where(and(isNull(reports.deletedAt), createdBy ? eq(reports.createdBy, createdBy) : undefined))
      .groupBy(reports.status);
    const counts = { pending: 0, approved: 0, rejected: 0 };
    for (const row of rows) counts[row.status] = row.count;
    return counts;
  },

  async findDetailById(id: string, executor: Executor = db) {
    const [row] = await executor
      .select({ report: reports, submittedBy: { id: users.id, name: users.name } })
      .from(reports)
      .innerJoin(users, eq(users.id, reports.createdBy))
      .where(and(eq(reports.id, id), isNull(reports.deletedAt)))
      .limit(1);
    if (!row) return undefined;

    const history = await executor
      .select({
        id: reportHistory.id,
        kind: reportHistory.kind,
        fromStatus: reportHistory.fromStatus,
        toStatus: reportHistory.toStatus,
        note: reportHistory.note,
        changes: reportHistory.changes,
        createdAt: reportHistory.createdAt,
        actorId: users.id,
        actorName: users.name,
        actorRole: roles.name,
      })
      .from(reportHistory)
      .innerJoin(users, eq(users.id, reportHistory.actorId))
      .leftJoin(roles, eq(roles.id, users.roleId))
      .where(eq(reportHistory.reportId, id))
      .orderBy(desc(reportHistory.createdAt), desc(reportHistory.id));

    return { ...row, history };
  },
};
