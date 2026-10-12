import type {
  CreateReportRequest,
  ListReportsQuery,
  ListReportsResponse,
  ReportCounts,
  ReportDetailResponse,
  UpdateReportRequest,
} from '../dto/report.dto.js';
import { toReportDetailResponse, toReportResponse } from '../dto/report.dto.js';
import { ConflictError, NotFoundError } from '../lib/errors.js';
import { reportRepository } from '../repositories/report.repository.js';
import type { AuthContext } from './auth.service.js';

const ROLES_SEEING_ALL_REPORTS = ['admin', 'supervisor'];

function ownerScope(auth: AuthContext): string | undefined {
  return ROLES_SEEING_ALL_REPORTS.includes(auth.role?.name ?? '') ? undefined : auth.user.id;
}

async function loadDetail(id: string, createdBy?: string): Promise<ReportDetailResponse> {
  const row = await reportRepository.findDetailById(id);
  if (!row || (createdBy && row.report.createdBy !== createdBy)) throw new NotFoundError('Report not found');
  return toReportDetailResponse(row);
}

export const reportService = {
  async list(auth: AuthContext, { status, q, page, pageSize }: ListReportsQuery): Promise<ListReportsResponse> {
    const filter = { status, q, createdBy: ownerScope(auth) };
    const total = await reportRepository.count(filter);
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, pageCount);
    const rows = await reportRepository.list({ ...filter, limit: pageSize, offset: (currentPage - 1) * pageSize });

    return {
      items: rows.map(toReportResponse),
      total,
      page: currentPage,
      pageSize,
      pageCount,
    };
  },

  get(auth: AuthContext, id: string): Promise<ReportDetailResponse> {
    return loadDetail(id, ownerScope(auth));
  },

  async create(auth: AuthContext, body: CreateReportRequest): Promise<ReportDetailResponse> {
    const report = await reportRepository.transaction(async (tx) => {
      const created = await reportRepository.create(
        { name: body.name, description: body.description, createdBy: auth.user.id },
        tx,
      );
      await reportRepository.addHistory(
        { reportId: created.id, kind: 'created', fromStatus: null, toStatus: 'pending', actorId: auth.user.id },
        tx,
      );
      return created;
    });
    return loadDetail(report.id);
  },

  async update(auth: AuthContext, id: string, body: UpdateReportRequest): Promise<ReportDetailResponse> {
    await reportRepository.transaction(async (tx) => {
      const report = await reportRepository.findActiveByIdForUpdate(id, tx);
      if (!report) throw new NotFoundError('Report not found');

      const canEditAny = auth.role?.name === 'admin';
      if (!canEditAny && report.createdBy !== auth.user.id) throw new NotFoundError('Report not found');
      if (report.status !== 'pending') throw new ConflictError('Only pending reports can be edited');

      const changes: ('name' | 'description')[] = [];
      if (body.name !== undefined && body.name !== report.name) changes.push('name');
      if (body.description !== undefined && body.description !== report.description) changes.push('description');
      if (changes.length === 0) return;

      await reportRepository.update(
        id,
        {
          ...(changes.includes('name') && body.name !== undefined ? { name: body.name } : {}),
          ...(changes.includes('description') && body.description !== undefined ? { description: body.description } : {}),
        },
        tx,
      );
      await reportRepository.addHistory(
        { reportId: id, kind: 'edited', fromStatus: 'pending', toStatus: 'pending', actorId: auth.user.id, changes },
        tx,
      );
    });
    return loadDetail(id);
  },


  async countByStatus(auth: AuthContext): Promise<ReportCounts> {
    const counts = await reportRepository.countByStatus(ownerScope(auth));
    return {
      all: counts.pending + counts.approved + counts.rejected,
      ...counts,
    };
  },
};
