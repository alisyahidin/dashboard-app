import { z } from 'zod';
import type { ReportDetailRow, ReportListRow } from '../repositories/report.repository.js';

export const REPORT_NAME_MIN = 3;
export const REPORT_NAME_MAX = 100;
export const REPORT_DESCRIPTION_MIN = 10;
export const REPORT_DESCRIPTION_MAX = 500;

const nameSchema = z
  .string()
  .trim()
  .min(REPORT_NAME_MIN, `Name must be at least ${REPORT_NAME_MIN} characters.`)
  .max(REPORT_NAME_MAX, `Name must be ${REPORT_NAME_MAX} characters or fewer.`);

const descriptionSchema = z
  .string()
  .trim()
  .min(REPORT_DESCRIPTION_MIN, `Description must be at least ${REPORT_DESCRIPTION_MIN} characters.`)
  .max(REPORT_DESCRIPTION_MAX, `Description must be ${REPORT_DESCRIPTION_MAX} characters or fewer.`);

export const reportIdParamSchema = z.uuid();

export const createReportRequestSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
});
export type CreateReportRequest = z.infer<typeof createReportRequestSchema>;

export const updateReportRequestSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
  })
  .refine((body) => body.name !== undefined || body.description !== undefined, {
    message: 'Provide a name or a description to update.',
    path: ['name'],
  });
export type UpdateReportRequest = z.infer<typeof updateReportRequestSchema>;

export const reportStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const REPORT_PAGE_SIZE_DEFAULT = 20;
export const REPORT_PAGE_SIZE_MAX = 100;

export const listReportsQuerySchema = z.object({
  status: z.enum(['all', 'pending', 'approved', 'rejected']).catch('all'),
  q: z.string().trim().max(100).catch(''),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(REPORT_PAGE_SIZE_MAX).catch(REPORT_PAGE_SIZE_DEFAULT),
});
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;

const actorSchema = z.object({ id: z.uuid(), name: z.string(), role: z.string().nullable() });

export const reportHistoryEntrySchema = z.object({
  id: z.uuid(),
  kind: z.enum(['created', 'status', 'edited']),
  from: reportStatusSchema.nullable(),
  to: reportStatusSchema,
  actor: actorSchema,
  note: z.string(),
  changes: z.array(z.enum(['name', 'description'])),
  at: z.iso.datetime({ offset: true }),
});

export const reportResponseSchema = z.object({
  id: z.uuid(),
  number: z.number().int(),
  name: z.string(),
  description: z.string(),
  status: reportStatusSchema,
  submittedBy: z.object({ id: z.uuid(), name: z.string() }),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }).nullable(),
  reviewedAt: z.iso.datetime({ offset: true }).nullable(),
});
export type ReportResponse = z.infer<typeof reportResponseSchema>;

export const reportDetailResponseSchema = reportResponseSchema.extend({
  history: z.array(reportHistoryEntrySchema),
});
export type ReportDetailResponse = z.infer<typeof reportDetailResponseSchema>;

export const reportCountsSchema = z.object({
  all: z.number().int(),
  pending: z.number().int(),
  approved: z.number().int(),
  rejected: z.number().int(),
});
export type ReportCounts = z.infer<typeof reportCountsSchema>;

export const listReportsResponseSchema = z.object({
  items: z.array(reportResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  pageCount: z.number().int(),
});
export type ListReportsResponse = z.infer<typeof listReportsResponseSchema>;

const iso = (value: string) => new Date(value).toISOString();
const isoOrNull = (value: string | null) => (value ? iso(value) : null);

export function toReportResponse(row: ReportListRow): ReportResponse {
  return {
    id: row.report.id,
    number: row.report.number,
    name: row.report.name,
    description: row.report.description,
    status: row.report.status,
    submittedBy: row.submittedBy,
    createdAt: iso(row.report.createdAt),
    updatedAt: isoOrNull(row.report.updatedAt),
    reviewedAt: isoOrNull(row.report.reviewedAt),
  };
}

export function toReportDetailResponse(row: ReportDetailRow): ReportDetailResponse {
  return {
    ...toReportResponse(row),
    history: row.history.map((entry) => ({
      id: entry.id,
      kind: entry.kind,
      from: entry.fromStatus,
      to: entry.toStatus,
      actor: { id: entry.actorId, name: entry.actorName, role: entry.actorRole },
      note: entry.note,
      changes: (entry.changes ?? []).filter((c): c is 'name' | 'description' => c === 'name' || c === 'description'),
      at: iso(entry.createdAt),
    })),
  };
}
