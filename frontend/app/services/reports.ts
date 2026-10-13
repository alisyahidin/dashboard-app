import { api } from './api'

export type ReportStatus = 'pending' | 'approved' | 'rejected'
export type ReportStatusFilter = ReportStatus | 'all'

export type Report = {
  id: string
  number: number
  name: string
  description: string
  status: ReportStatus
  submittedBy: { id: string; name: string }
  createdAt: string
  updatedAt: string | null
  reviewedAt: string | null
}

export type ReportHistoryEntry = {
  id: string
  kind: 'created' | 'status' | 'edited'
  from: ReportStatus | null
  to: ReportStatus
  actor: { id: string; name: string; role: string | null }
  note: string
  changes: ('name' | 'description')[]
  at: string
}

export type ReportDetail = Report & { history: ReportHistoryEntry[] }

export type ReportCounts = Record<ReportStatusFilter, number>

export type ListReportsParams = {
  status?: ReportStatusFilter
  q?: string
  page?: number
  pageSize?: number
}

export type ListReportsResponse = {
  items: Report[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

export type CreateReportRequest = {
  name: string
  description: string
}

export type UpdateReportRequest = Partial<CreateReportRequest>

export const REPORT_NAME_MIN = 3
export const REPORT_NAME_MAX = 100
export const REPORT_DESCRIPTION_MIN = 10
export const REPORT_DESCRIPTION_MAX = 500
export const REPORT_NOTE_MIN = 5
export const REPORT_NOTE_MAX = 500

export function listReports({ status = 'all', q = '', page = 1, pageSize = 8 }: ListReportsParams = {}) {
  const params = new URLSearchParams({ status, page: String(page), pageSize: String(pageSize) })
  if (q.trim()) params.set('q', q.trim())
  return api<ListReportsResponse>(`/reports?${params}`)
}

export function getReportCounts() {
  return api<ReportCounts>('/reports/counts')
}

export function getReport(id: string) {
  return api<ReportDetail>(`/reports/${encodeURIComponent(id)}`)
}

export function createReport(body: CreateReportRequest) {
  return api<ReportDetail>('/reports', { method: 'POST', body: JSON.stringify(body) })
}

export function updateReport(id: string, body: UpdateReportRequest) {
  return api<ReportDetail>(`/reports/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export type ChangeReportStatusRequest = {
  status: Exclude<ReportStatus, 'pending'>
  note: string
  expectedStatus: ReportStatus
}

export function changeReportStatus(id: string, body: ChangeReportStatusRequest) {
  return api<ReportDetail>(`/reports/${encodeURIComponent(id)}/status`, { method: 'POST', body: JSON.stringify(body) })
}
