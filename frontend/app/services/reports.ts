import { ApiError } from './api'
import { me } from './auth'


export type ReportStatus = 'pending' | 'approved' | 'rejected'
export type ReportStatusFilter = ReportStatus | 'all'

export type Report = {
  id: number
  name: string
  description: string
  status: ReportStatus
  submittedBy: string
  createdAt: string
  reviewedAt: string | null
}

export type ReportHistoryEntry = {
  id: string
  kind: 'created' | 'status' | 'edited'
  from: ReportStatus | null
  to: ReportStatus
  actor: string
  actorRole: string
  note: string
  changes?: ('name' | 'description')[]
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
  counts: ReportCounts
}

export type ReportSummaryResponse = {
  counts: ReportCounts
  latest: Report[]
}

export type CreateReportRequest = {
  name: string
  description: string
}

export type UpdateReportRequest = {
  name: string
  description: string
}

export type ChangeReportStatusRequest = {
  status: Exclude<ReportStatus, 'pending'>
  note: string
  expectedStatus: ReportStatus
}

export const REPORT_NAME_MIN = 3
export const REPORT_NAME_MAX = 100
export const REPORT_DESCRIPTION_MIN = 10
export const REPORT_DESCRIPTION_MAX = 500
export const REPORT_NOTE_MIN = 5
export const REPORT_NOTE_MAX = 500

type StoredReport = Omit<ReportDetail, 'status' | 'submittedBy' | 'reviewedAt'>

const at = (day: number, hour: number, minute: number) => new Date(2026, 9, day, hour, minute).toISOString()

let entrySeq = 0
const created = (actor: string, when: string): ReportHistoryEntry => ({
  id: `h${++entrySeq}`, kind: 'created', from: null, to: 'pending', actor, actorRole: 'Field officer', note: '', at: when,
})
const changed = (from: ReportStatus, to: ReportStatus, actor: string, when: string, note = ''): ReportHistoryEntry => ({
  id: `h${++entrySeq}`, kind: 'status', from, to, actor, actorRole: 'Supervisor', note, at: when,
})

let reports: StoredReport[] = [
  { id: 1048, name: 'Borehole BH-07 soil investigation', description: 'SPT completed to 18 m. Soft clay layer between 4 and 7 m, groundwater observed at 3.2 m.', createdAt: at(11, 9, 14), history: [created('Rina Putri', at(11, 9, 14))] },
  { id: 1047, name: 'Concrete slump test, Pier P3', description: 'Slump measured at 140 mm against a 120 ± 20 mm spec. Three cube samples taken.', createdAt: at(11, 8, 40), history: [created('Dimas Prasetyo', at(11, 8, 40))] },
  { id: 1046, name: 'Hairline cracks on retaining wall RW-2', description: 'Three vertical cracks under 0.3 mm found near the expansion joint.', createdAt: at(10, 16, 22), history: [created('Agus Santoso', at(10, 16, 22))] },
  { id: 1045, name: 'Rebar spacing check, Slab S1 zone B', description: 'Spacing verified at 150 mm centres, cover blocks in place before the pour.', createdAt: at(10, 13, 5), history: [created('Dimas Prasetyo', at(10, 13, 5)), changed('pending', 'approved', 'Budi Hartono', at(10, 14, 30))] },
  { id: 1044, name: 'CPT sounding CPT-12', description: 'Refusal at 11.4 m. Data file is incomplete after 9 m because of a cable fault.', createdAt: at(10, 10, 48), history: [created('Rina Putri', at(10, 10, 48)), changed('pending', 'rejected', 'Budi Hartono', at(10, 11, 20), 'Data after 9 m is missing. Repeat the sounding before resubmitting.')] },
  { id: 1043, name: 'Honeycombing on column C14', description: 'Surface honeycomb of about 20 × 30 cm at the column base, no exposed rebar.', createdAt: at(9, 15, 30), history: [created('Agus Santoso', at(9, 15, 30)), changed('pending', 'rejected', 'Budi Hartono', at(9, 16, 2), 'Size of the honeycomb area was not recorded.'), changed('rejected', 'approved', 'Sari Wulandari', at(10, 8, 15), 'Size confirmed with the field officer by phone and added to the description.')] },
  { id: 1042, name: 'Compaction test, embankment STA 2+300', description: 'Sand cone result is 96% of maximum dry density, above the 95% requirement.', createdAt: at(9, 11, 12), history: [created('Rina Putri', at(9, 11, 12)), changed('pending', 'approved', 'Sari Wulandari', at(9, 13, 45))] },
  { id: 1041, name: 'Weld inspection, steel girder G5', description: 'Visual inspection only. The report was submitted without the NDT checklist.', createdAt: at(8, 14, 55), history: [created('Dimas Prasetyo', at(8, 14, 55)), changed('pending', 'rejected', 'Sari Wulandari', at(8, 16, 10), 'Girder welds need the NDT checklist attached.')] },
  { id: 1040, name: 'Sieve analysis, subgrade sample SG-3', description: 'Fines content of 11% passing the 0.075 mm sieve, classed as silty sand.', createdAt: at(8, 10, 20), history: [created('Agus Santoso', at(8, 10, 20)), changed('pending', 'approved', 'Budi Hartono', at(8, 11, 5))] },
  { id: 1039, name: 'Formwork alignment, shear wall W4', description: 'Verticality deviation of 4 mm over 3 m, within the 6 mm tolerance.', createdAt: at(7, 15, 42), history: [created('Rina Putri', at(7, 15, 42)), changed('pending', 'approved', 'Budi Hartono', at(7, 16, 30))] },
  { id: 1038, name: 'Spalled concrete on beam B7 soffit', description: 'Spalling of about 15 × 40 cm with one stirrup exposed near the support.', createdAt: at(7, 11, 8), history: [created('Dimas Prasetyo', at(7, 11, 8))] },
  { id: 1037, name: 'Bolt torque check, base plate BP-2', description: 'Report lists 12 bolts but torque values are recorded for only 8.', createdAt: at(6, 14, 15), history: [created('Agus Santoso', at(6, 14, 15)), changed('pending', 'approved', 'Budi Hartono', at(6, 15, 0)), changed('approved', 'rejected', 'Sari Wulandari', at(7, 9, 20), 'Torque values are missing for 4 of the 12 bolts. Approval was given in error.')] },
]

function toReport(stored: StoredReport): Report {
  const first = stored.history[0]
  const last = stored.history[stored.history.length - 1]
  return {
    id: stored.id,
    name: stored.name,
    description: stored.description,
    status: last?.to ?? 'pending',
    submittedBy: first?.actor ?? 'Unknown',
    createdAt: stored.createdAt,
    reviewedAt: [...stored.history].reverse().find((h) => h.kind === 'status')?.at ?? null,
  }
}

function toDetail(stored: StoredReport): ReportDetail {
  return { ...toReport(stored), history: [...stored.history].reverse().map((h) => ({ ...h })) }
}

type MockScenario =
  | 'empty'
  | 'list-error'
  | 'create-error'
  | 'edit-conflict'
  | 'edit-offline'
  | 'decide-not-found'
  | 'decide-conflict'
  | 'decide-offline'

function scenario(): MockScenario | null {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('mock') as MockScenario | null
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const offline = () => new ApiError(0, 'Unable to reach the server. Please try again.')

function visibleReports() {
  return scenario() === 'empty' ? [] : reports
}

function countByStatus(list: Report[]): ReportCounts {
  return {
    all: list.length,
    pending: list.filter((r) => r.status === 'pending').length,
    approved: list.filter((r) => r.status === 'approved').length,
    rejected: list.filter((r) => r.status === 'rejected').length,
  }
}

const byNewest = (a: Report, b: Report) => b.createdAt.localeCompare(a.createdAt)

const roleLabels: Record<string, string> = { admin: 'Admin', supervisor: 'Supervisor', officer: 'Field officer' }

async function currentActor() {
  try {
    const { user } = await me()
    return { name: user.name, role: (user.role && roleLabels[user.role]) ?? 'User', permissions: user.permissions }
  } catch {
    return { name: 'You', role: 'User', permissions: [] as string[] }
  }
}

export async function listReports({ status = 'all', q = '', page = 1, pageSize = 8 }: ListReportsParams = {}): Promise<ListReportsResponse> {
  await delay(600)
  if (scenario() === 'list-error') throw offline()

  const all = visibleReports().map(toReport)
  const query = q.trim().toLowerCase()
  const filtered = all
    .filter((r) => status === 'all' || r.status === status)
    .filter((r) => !query || r.name.toLowerCase().includes(query) || r.description.toLowerCase().includes(query))
    .sort(byNewest)

  const size = Math.max(1, pageSize)
  const pageCount = Math.max(1, Math.ceil(filtered.length / size))
  const current = Math.min(Math.max(1, page), pageCount)
  const start = (current - 1) * size

  return {
    items: filtered.slice(start, start + size),
    total: filtered.length,
    page: current,
    pageSize: size,
    pageCount,
    counts: countByStatus(all),
  }
}

export async function getReportSummary(): Promise<ReportSummaryResponse> {
  await delay(600)
  if (scenario() === 'list-error') throw offline()

  const all = visibleReports().map(toReport)
  return {
    counts: countByStatus(all),
    latest: [...all].sort(byNewest).slice(0, 5),
  }
}

export async function getReport(id: number): Promise<ReportDetail> {
  await delay(500)
  if (scenario() === 'list-error') throw offline()

  const stored = visibleReports().find((r) => r.id === id)
  if (!stored) throw new ApiError(404, 'Report not found')
  return toDetail(stored)
}

export async function createReport(body: CreateReportRequest): Promise<Report> {
  await delay(800)
  if (scenario() === 'create-error') throw offline()

  const name = body.name.trim()
  const description = body.description.trim()
  const fieldErrors: Record<string, string[]> = {}
  if (name.length < REPORT_NAME_MIN || name.length > REPORT_NAME_MAX) fieldErrors['name'] = ['Invalid name length']
  if (description.length < REPORT_DESCRIPTION_MIN || description.length > REPORT_DESCRIPTION_MAX) fieldErrors['description'] = ['Invalid description length']
  if (Object.keys(fieldErrors).length) throw new ApiError(400, 'Invalid request body', fieldErrors)

  const actor = await currentActor()
  const now = new Date().toISOString()
  const stored: StoredReport = {
    id: Math.max(0, ...reports.map((r) => r.id)) + 1,
    name,
    description,
    createdAt: now,
    history: [{ id: `h${++entrySeq}`, kind: 'created', from: null, to: 'pending', actor: actor.name, actorRole: actor.role, note: '', at: now }],
  }
  reports = [stored, ...reports]
  return toReport(stored)
}

export async function updateReport(id: number, body: UpdateReportRequest): Promise<ReportDetail> {
  await delay(800)
  const mock = scenario()
  if (mock === 'edit-offline') throw offline()
  if (mock === 'edit-conflict') {
    reports = reports.map((r) =>
      r.id === id && toReport(r).status === 'pending'
        ? { ...r, history: [...r.history, changed('pending', 'approved', 'Budi Hartono', new Date().toISOString())] }
        : r,
    )
  }

  const actor = await currentActor()
  if (!actor.permissions.includes('reports:edit')) throw new ApiError(403, 'Only field officers can edit reports')

  const stored = reports.find((r) => r.id === id)
  if (!stored) throw new ApiError(404, 'Report not found')
  if (toReport(stored).status !== 'pending') throw new ApiError(409, 'Only pending reports can be edited')

  const name = body.name.trim()
  const description = body.description.trim()
  const fieldErrors: Record<string, string[]> = {}
  if (name.length < REPORT_NAME_MIN || name.length > REPORT_NAME_MAX) fieldErrors['name'] = ['Invalid name length']
  if (description.length < REPORT_DESCRIPTION_MIN || description.length > REPORT_DESCRIPTION_MAX) fieldErrors['description'] = ['Invalid description length']
  if (Object.keys(fieldErrors).length) throw new ApiError(400, 'Invalid request body', fieldErrors)

  const changes: ('name' | 'description')[] = []
  if (name !== stored.name) changes.push('name')
  if (description !== stored.description) changes.push('description')
  if (changes.length === 0) return toDetail(stored)

  const entry: ReportHistoryEntry = {
    id: `h${++entrySeq}`, kind: 'edited', from: 'pending', to: 'pending', actor: actor.name, actorRole: actor.role, note: '', changes, at: new Date().toISOString(),
  }
  const updated: StoredReport = { ...stored, name, description, history: [...stored.history, entry] }
  reports = reports.map((r) => (r.id === id ? updated : r))
  return toDetail(updated)
}

export async function changeReportStatus(id: number, body: ChangeReportStatusRequest): Promise<ReportDetail> {
  await delay(700)
  const mock = scenario()
  if (mock === 'decide-offline') throw offline()

  if (mock === 'decide-not-found') reports = reports.filter((r) => r.id !== id)
  if (mock === 'decide-conflict') {
    reports = reports.map((r) => {
      if (r.id !== id) return r
      const current = toReport(r).status
      const to: ReportStatus = current === 'approved' ? 'rejected' : 'approved'
      return { ...r, history: [...r.history, changed(current, to, 'Budi Hartono', new Date().toISOString(), current === 'pending' ? '' : 'Changed in another session.')] }
    })
  }

  const stored = reports.find((r) => r.id === id)
  if (!stored) throw new ApiError(404, 'Report not found')

  const current = toReport(stored).status
  if (current !== body.expectedStatus) throw new ApiError(409, 'Report status has changed since it was loaded')
  if (current === body.status) throw new ApiError(409, `Report is already ${current}`)

  const note = body.note.trim()
  const needsReason = body.status === 'rejected' || current !== 'pending'
  if ((needsReason && note.length < REPORT_NOTE_MIN) || note.length > REPORT_NOTE_MAX) {
    throw new ApiError(400, 'Invalid request body', { note: ['A reason is required'] })
  }

  const actor = await currentActor()
  const entry: ReportHistoryEntry = {
    id: `h${++entrySeq}`, kind: 'status', from: current, to: body.status, actor: actor.name, actorRole: actor.role, note, at: new Date().toISOString(),
  }
  const updated: StoredReport = { ...stored, history: [...stored.history, entry] }
  reports = reports.map((r) => (r.id === id ? updated : r))
  return toDetail(updated)
}
