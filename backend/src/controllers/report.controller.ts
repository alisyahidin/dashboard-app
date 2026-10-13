import type { Request, RequestHandler } from 'express';
import {
  changeReportStatusRequestSchema,
  createReportRequestSchema,
  listReportsQuerySchema,
  reportIdParamSchema,
  updateReportRequestSchema,
} from '../dto/report.dto.js';
import { NotFoundError, UnauthorizedError } from '../lib/errors.js';
import { reportService } from '../services/report.service.js';

function getAuth(req: Request) {
  if (!req.auth) throw new UnauthorizedError();
  return req.auth;
}

function getReportId(req: Request) {
  const parsed = reportIdParamSchema.safeParse(req.params['id']);
  if (!parsed.success) throw new NotFoundError('Report not found');
  return parsed.data;
}

export const listReports: RequestHandler = async (req, res) => {
  res.json(await reportService.list(getAuth(req), listReportsQuerySchema.parse(req.query)));
};

export const getReportCounts: RequestHandler = async (req, res) => {
  res.json(await reportService.countByStatus(getAuth(req)));
};

export const getReport: RequestHandler = async (req, res) => {
  res.json(await reportService.get(getAuth(req), getReportId(req)));
};

export const createReport: RequestHandler = async (req, res) => {
  const body = createReportRequestSchema.parse(req.body);
  res.status(201).json(await reportService.create(getAuth(req), body));
};

export const updateReport: RequestHandler = async (req, res) => {
  const id = getReportId(req);
  const body = updateReportRequestSchema.parse(req.body);
  res.json(await reportService.update(getAuth(req), id, body));
};

export const changeReportStatus: RequestHandler = async (req, res) => {
  const id = getReportId(req);
  const body = changeReportStatusRequestSchema.parse(req.body);
  res.json(await reportService.changeStatus(getAuth(req), id, body));
};
