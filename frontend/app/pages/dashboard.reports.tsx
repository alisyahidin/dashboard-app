import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HistoryIcon,
  InboxIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SearchXIcon,
  XIcon,
} from 'lucide-react'
import { ReportFormDialog } from '~/components/reports/report-form-dialog'
import { RejectReportDialog } from '~/components/reports/reject-report-dialog'
import { ReportHistorySheet } from '~/components/reports/report-history-sheet'
import { ReportStatusBadge } from '~/components/reports/report-status-badge'
import { LoadError, NoAccess, StateMessage, TableSkeletonRows } from '~/components/reports/table-states'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { toast } from '~/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { TruncatedText } from '~/components/truncated-text'
import { isForbidden, useAuthErrorHandler } from '~/hooks/use-auth-error'
import { useCurrentUser } from '~/hooks/use-current-user'
import { useReportCounts, useReports, useRevalidateReports } from '~/hooks/use-reports'
import { formatDateTime } from '~/lib/format'
import { canEditReport, hasPermission } from '~/lib/permissions'
import { ApiError } from '~/services/api'
import { changeReportStatus, type Report, type ReportStatus, type ReportStatusFilter } from '~/services/reports'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

const statusOptions: { value: ReportStatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

function parseStatus(value: unknown): ReportStatusFilter {
  return statusOptions.find((o) => o.value === value)?.value ?? 'all'
}

function parsePage(value: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function parseReportId(value: string | null) {
  return value?.trim() || null
}

const statusLabel: Record<ReportStatus, string> = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }

const col = {
  id: 'hidden w-20 pl-4 xl:table-cell',
  name: 'pl-4 xl:pl-2',
  description: 'hidden w-[20%] 2xl:table-cell',
  status: 'hidden w-28 sm:table-cell',
  reporter: 'hidden w-32 lg:table-cell',
  created: 'hidden w-40 xl:table-cell',
  actions: 'w-52 pr-4 sm:w-60',
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function PageReports() {
  const user = useCurrentUser()
  const canCreate = hasPermission(user, 'reports:write')
  const canReview = hasPermission(user, 'reports:approve')
  const canEdit = (report: Report) => canEditReport(user, report)

  const [searchParams, setSearchParams] = useSearchParams()
  const status = parseStatus(searchParams.get('status'))
  const q = searchParams.get('q') ?? ''
  const page = parsePage(searchParams.get('page'))
  const openReportId = parseReportId(searchParams.get('report'))

  const paramsRef = useRef(searchParams)
  paramsRef.current = searchParams

  function updateParams(changes: Record<string, string | null>, options: { replace?: boolean } = {}) {
    const next = new URLSearchParams(paramsRef.current)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    paramsRef.current = next
    setSearchParams(next, { replace: options.replace ?? false })
  }

  const list = useReports({ status, q, page, pageSize: PAGE_SIZE })
  const counts = useReportCounts()
  const revalidateReports = useRevalidateReports()
  const data = list.data
  const failed = Boolean(list.error) && !list.isLoading

  useEffect(() => {
    if (data && data.page !== page) updateParams({ page: data.page > 1 ? String(data.page) : null }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const [search, setSearch] = useState(q)
  useEffect(() => { setSearch((current) => (current.trim() === q ? current : q)) }, [q])
  useEffect(() => {
    if (search.trim() === q) return
    const timer = setTimeout(() => updateParams({ q: search.trim() || null, page: null }, { replace: true }), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handleAuthError = useAuthErrorHandler()
  const [createOpen, setCreateOpen] = useState(false)
  const [rejecting, setRejecting] = useState<Report | null>(null)
  const [editing, setEditing] = useState<Report | null>(null)
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set())

  function setBusy(id: string, busy: boolean) {
    setBusyIds((prev) => {
      const next = new Set(prev)
      if (busy) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function decide(report: Report, to: Exclude<ReportStatus, 'pending'>, note = ''): Promise<boolean> {
    if (busyIds.has(report.id)) return false
    setRejecting(null)
    setBusy(report.id, true)
    const changing = report.status !== 'pending'
    try {
      await changeReportStatus(report.id, { status: to, note, expectedStatus: report.status })
      toast.add({
        type: 'success',
        title: changing ? `Decision changed to ${statusLabel[to]}` : to === 'approved' ? 'Report approved' : 'Report rejected',
        description: `${report.name} · added to history`,
      })
      revalidateReports()
      return true
    } catch (error) {
      if (handleAuthError(error)) return false
      const status = error instanceof ApiError ? error.status : -1
      if (status === 404) {
        toast.add({
          type: 'error',
          title: 'Report not found',
          description: `Report #${report.number} no longer exists on the server, so nothing was changed. The list has been refreshed.`,
        })
        revalidateReports()
      } else if (status === 409) {
        toast.add({
          type: 'warning',
          title: changing ? 'Status changed elsewhere' : 'Already reviewed',
          description: `Report #${report.number} was updated in another session before your decision arrived. The table now shows its current status.`,
        })
        revalidateReports()
      } else if (status === 400) {
        toast.add({
          type: 'error',
          title: 'Decision was not saved',
          description: error instanceof ApiError ? Object.values(error.fieldErrors ?? {}).flat()[0] ?? error.message : 'Invalid request.',
        })
      } else {
        const toastId = toast.add({
          type: 'error',
          title: 'Decision was not saved',
          description: status === 0
            ? `The server could not be reached. Report #${report.number} is still ${report.status}.`
            : `Something went wrong. Report #${report.number} is still ${report.status}.`,
          timeout: 10_000,
          actionProps: {
            children: 'Retry',
            onClick: () => {
              toast.close(toastId)
              decide(report, to, note)
            },
          },
        })
      }
      return false
    } finally {
      setBusy(report.id, false)
    }
  }

  const hasFilters = status !== 'all' || q !== ''
  const clearFilters = () => updateParams({ status: null, q: null, page: null })
  const rows = data?.items ?? []
  const first = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0
  const last = first > 0 ? first + rows.length - 1 : 0
  const disableControls = list.isLoading && !data

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            {canReview
              ? 'Every field report. Open one to see its status history or change a decision.'
              : 'Every field report. Open one to see its status history.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" onClick={() => list.mutate()} disabled={list.isValidating}>
            <RefreshCwIcon data-icon="inline-start" className={list.isValidating ? 'animate-spin' : undefined} />
            Refresh
          </Button>
          {canCreate && (
            <Button size="lg" onClick={() => setCreateOpen(true)}>
              <PlusIcon data-icon="inline-start" />
              New report
            </Button>
          )}
        </div>
      </div>

      <Card className="gap-0 py-0" aria-label="Reports" aria-busy={list.isLoading}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="relative w-full sm:w-72">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Search reports"
              placeholder="Search name or description"
              className="pl-8"
              value={search}
              disabled={disableControls}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            items={statusOptions}
            value={status}
            disabled={disableControls}
            onValueChange={(value) => {
              const next = parseStatus(value)
              updateParams({ status: next === 'all' ? null : next, page: null })
            }}
          >
            <SelectTrigger aria-label="Filter by status" className="h-9 w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {failed && isForbidden(list.error) ? (
          <div className="border-t">
            <NoAccess description="Your role can't view reports. Ask an admin if you need access." />
          </div>
        ) : failed ? (
          <div className="border-t">
            <LoadError detail="GET /api/v1/reports failed" onRetry={() => list.mutate()} />
          </div>
        ) : !list.isLoading && data && data.total === 0 ? (
          <div className="border-t">
            {counts.data?.all === 0 ? (
              <StateMessage
                icon={InboxIcon}
                title="No reports yet"
                description="Reports submitted from the field appear here. You can also create the first one from this dashboard."
              >
                {canCreate && (
                  <Button onClick={() => setCreateOpen(true)}>
                    <PlusIcon data-icon="inline-start" />
                    New report
                  </Button>
                )}
              </StateMessage>
            ) : (
              <StateMessage
                icon={SearchXIcon}
                title="No reports found"
                description={
                  q
                    ? <>Nothing matches “{q}”{status !== 'all' ? ` in ${status} reports` : ' in any report name or description'}. Check the spelling or clear the filters.</>
                    : `There are no ${status} reports right now.`
                }
              >
                {hasFilters && <Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
              </StateMessage>
            )}
          </div>
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className={col.id}>ID</TableHead>
                <TableHead className={col.name}>Name</TableHead>
                <TableHead className={col.description}>Description</TableHead>
                <TableHead className={col.reporter}>Reporter</TableHead>
                <TableHead className={col.status}>Status</TableHead>
                <TableHead className={col.created}>Created</TableHead>
                <TableHead className={col.actions}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading ? (
                <TableSkeletonRows
                  columns={7}
                  rows={5}
                  skeletonClassName="min-h-7"
                  columnClassNames={[
                    col.id,
                    col.name,
                    col.description,
                    col.reporter,
                    col.status,
                    col.created,
                    col.actions,
                  ]}
                />
              ) : (
                rows.map((report) => {
                  const busy = busyIds.has(report.id)
                  const openHistory = () => updateParams({ report: String(report.id) })
                  const historyButton = (
                    <IconAction label="Status history" onClick={openHistory}>
                      <HistoryIcon />
                    </IconAction>
                  )
                  return (
                    <TableRow key={report.id}>
                      <TableCell className={`${col.id} font-mono text-xs text-muted-foreground`}>#{report.number}</TableCell>
                      <TableCell className={`${col.name} font-medium`}>
                        <TruncatedText
                          className="text-left underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                          render={<button type="button" onClick={openHistory} />}
                        >
                          {report.name}
                        </TruncatedText>
                        <TruncatedText className="text-xs font-normal text-muted-foreground lg:hidden">
                          {report.submittedBy.name}
                        </TruncatedText>
                        <div className="mt-1 sm:hidden"><ReportStatusBadge status={report.status} /></div>
                      </TableCell>
                      <TableCell className={`${col.description} text-muted-foreground`}>
                        <TruncatedText>{report.description}</TruncatedText>
                      </TableCell>
                      <TableCell className={`${col.reporter} text-muted-foreground`}>
                        <TruncatedText>{report.submittedBy.name}</TruncatedText>
                      </TableCell>
                      <TableCell className={col.status}><ReportStatusBadge status={report.status} /></TableCell>
                      <TableCell className={`${col.created} text-muted-foreground tabular-nums`}>
                        <TruncatedText>{formatDateTime(report.createdAt)}</TruncatedText>
                      </TableCell>
                      <TableCell className={col.actions}>
                        <div className="flex min-h-7 items-center justify-between gap-1">
                          {report.status !== 'pending' ? (
                            <TruncatedText className="min-w-0 text-sm text-muted-foreground">
                              {report.reviewedAt ? `Reviewed ${formatDateTime(report.reviewedAt)}` : 'Reviewed'}
                            </TruncatedText>
                          ) : busy ? (
                            <span role="status" className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                              <Loader2Icon className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                              <TruncatedText>Saving decision…</TruncatedText>
                            </span>
                          ) : canReview ? (
                            <div className="flex gap-1.5">
                              <Button variant="outline" size="sm" onClick={() => decide(report, 'approved')}>
                                <CheckIcon data-icon="inline-start" />
                                Approve
                              </Button>
                              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setRejecting(report)}>
                                <XIcon data-icon="inline-start" />
                                Reject
                              </Button>
                            </div>
                          ) : canEdit(report) ? (
                            <Button variant="outline" size="sm" onClick={() => setEditing(report)}>
                              <PencilIcon data-icon="inline-start" />
                              Edit
                            </Button>
                          ) : (
                            <TruncatedText className="min-w-0 text-sm text-muted-foreground">Awaiting review</TruncatedText>
                          )}
                          <div className="ml-auto shrink-0">{historyButton}</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        )}

        {!failed && data && data.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
            <div>Showing {first}–{last} of {data.total} reports</div>
            <div className="flex items-center gap-3">
              <span className="tabular-nums">Page {data.page} of {data.pageCount}</span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous page"
                  disabled={data.page <= 1 || list.isLoading}
                  onClick={() => updateParams({ page: data.page - 1 > 1 ? String(data.page - 1) : null })}
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next page"
                  disabled={data.page >= data.pageCount || list.isLoading}
                  onClick={() => updateParams({ page: String(data.page + 1) })}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <ReportFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={(report) => {
          setCreateOpen(false)
          toast.add({ type: 'success', title: 'Report created', description: report.name })
          if (hasFilters || page !== 1) clearFilters()
          else revalidateReports()
        }}
      />

      <ReportFormDialog
        key={editing?.id ?? 'none'}
        open={editing !== null}
        report={editing}
        onOpenChange={(open) => { if (!open) setEditing(null) }}
        onSaved={(report) => {
          setEditing(null)
          toast.add({ type: 'success', title: 'Report updated', description: `${report.name} · added to history` })
          revalidateReports()
        }}
        onStale={(error) => {
          const id = editing?.number
          setEditing(null)
          toast.add(
            error.status === 404
              ? { type: 'error', title: 'Report not found', description: `Report #${id} no longer exists, so nothing was changed. The list has been refreshed.` }
              : { type: 'warning', title: 'Already reviewed', description: `Report #${id} was reviewed before your changes were saved, so it can no longer be edited.` },
          )
          revalidateReports()
        }}
      />

      <RejectReportDialog
        report={rejecting}
        onCancel={() => setRejecting(null)}
        onConfirm={(report, reason) => decide(report, 'rejected', reason)}
      />

      <ReportHistorySheet
        reportId={openReportId}
        canReview={canReview}
        canEdit={canEdit}
        busy={openReportId !== null && busyIds.has(openReportId)}
        onEdit={setEditing}
        onClose={() => updateParams({ report: null })}
        onDecide={decide}
      />
    </div>
  )
}
