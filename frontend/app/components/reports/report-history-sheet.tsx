import { useEffect, useState } from 'react'
import { AlertCircleIcon, ArrowLeftRightIcon, CheckIcon, FileXIcon, Loader2Icon, PencilIcon, PlusIcon, RefreshCwIcon, XIcon } from 'lucide-react'
import { cn } from 'cn'
import { ReportStatusBadge } from '~/components/reports/report-status-badge'
import { StateMessage } from '~/components/reports/table-states'
import { Button } from '~/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '~/components/ui/field'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { Skeleton } from '~/components/ui/skeleton'
import { Textarea } from '~/components/ui/textarea'
import { useReport } from '~/hooks/use-reports'
import { formatDateTime } from '~/lib/format'
import { ApiError } from '~/services/api'
import {
  REPORT_NOTE_MAX,
  REPORT_NOTE_MIN,
  type Report,
  type ReportDetail,
  type ReportHistoryEntry,
  type ReportStatus,
} from '~/services/reports'

type Decision = Exclude<ReportStatus, 'pending'>

const statusLabel: Record<ReportStatus, string> = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }

const markerStyles: Record<ReportStatus, { icon: typeof CheckIcon; className: string }> = {
  pending: { icon: PlusIcon, className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
  approved: { icon: CheckIcon, className: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300' },
  rejected: { icon: XIcon, className: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300' },
}

const editedMarker = { icon: PencilIcon, className: 'bg-muted text-muted-foreground' }

function entryTitle(entry: ReportHistoryEntry) {
  if (entry.kind === 'created') return 'Report submitted'
  if (entry.kind === 'edited') return 'Report edited'
  return entry.from === 'pending' ? statusLabel[entry.to] : `Changed to ${statusLabel[entry.to]}`
}

function entryTransition(entry: ReportHistoryEntry) {
  if (entry.kind === 'edited') {
    const fields = entry.changes ?? []
    return fields.length === 2 ? 'Name and description updated' : fields[0] === 'name' ? 'Name updated' : 'Description updated'
  }
  if (entry.kind === 'created' || !entry.from) return 'Status set to Pending'
  return `${statusLabel[entry.from]} → ${statusLabel[entry.to]}`
}

export function ReportHistorySheet({
  reportId,
  canReview,
  canEdit,
  busy,
  onClose,
  onEdit,
  onDecide,
}: {
  reportId: number | null
  canReview: boolean
  canEdit: boolean
  busy: boolean
  onClose: () => void
  onEdit: (report: Report) => void
  onDecide: (report: ReportDetail, to: Decision, note: string) => Promise<boolean>
}) {
  const { data: report, error, isLoading, mutate } = useReport(reportId)
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState<string | null>(null)

  useEffect(() => {
    setNote('')
    setNoteError(null)
  }, [reportId])

  const notFound = error instanceof ApiError && error.status === 404

  async function decide(to: Decision) {
    if (!report) return
    const trimmed = note.trim()
    const needsReason = to === 'rejected' || report.status !== 'pending'
    if (needsReason && trimmed.length < REPORT_NOTE_MIN) {
      setNoteError(
        report.status === 'pending'
          ? `Add a reason of at least ${REPORT_NOTE_MIN} characters to reject.`
          : `Add a reason of at least ${REPORT_NOTE_MIN} characters to change the decision.`,
      )
      return
    }
    if (await onDecide(report, to, trimmed)) {
      setNote('')
      setNoteError(null)
    }
  }

  return (
    <Sheet open={reportId !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        {report ? (
          <>
            <SheetHeader className="gap-2.5 border-b p-6">
              <div className="flex items-center gap-2 pr-8">
                <span className="font-mono text-xs text-muted-foreground">#{report.id}</span>
                <ReportStatusBadge status={report.status} />
                {canEdit && report.status === 'pending' && (
                  <Button variant="outline" size="sm" className="ml-auto" onClick={() => onEdit(report)}>
                    <PencilIcon data-icon="inline-start" />
                    Edit
                  </Button>
                )}
              </div>
              <SheetTitle className="pr-8 text-lg leading-6">{report.name}</SheetTitle>
              <SheetDescription className="text-foreground/80">{report.description}</SheetDescription>
              <dl className="mt-1 grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">Submitted by</dt>
                  <dd className="font-medium">{report.submittedBy}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">Created</dt>
                  <dd className="font-medium tabular-nums">{formatDateTime(report.createdAt)}</dd>
                </div>
              </dl>
            </SheetHeader>

            {canReview && (
              <section aria-labelledby="review-title" className="flex flex-col gap-3 border-b p-6">
                <h3 id="review-title" className="text-[15px] font-semibold">
                  {report.status === 'pending' ? 'Review' : 'Change decision'}
                </h3>
                {report.status !== 'pending' && (
                  <p className="text-sm text-muted-foreground">
                    This report is {report.status}. A change needs a reason and is added to the history below.
                  </p>
                )}
                <Field data-invalid={Boolean(noteError)}>
                  <FieldLabel htmlFor="report-note">
                    {report.status === 'pending' ? 'Note' : 'Reason for the change'}
                  </FieldLabel>
                  <Textarea
                    id="report-note"
                    rows={3}
                    className="min-h-19 resize-none"
                    placeholder={report.status === 'pending' ? 'Anything the field officer should know' : 'Why is the decision being changed?'}
                    value={note}
                    maxLength={REPORT_NOTE_MAX}
                    disabled={busy}
                    aria-invalid={Boolean(noteError)}
                    onChange={(e) => {
                      setNote(e.target.value)
                      setNoteError(null)
                    }}
                  />
                  {noteError ? (
                    <FieldError>{noteError}</FieldError>
                  ) : (
                    <FieldDescription>
                      {report.status === 'pending'
                        ? 'Optional when approving, required when rejecting.'
                        : 'Required. Saved with this change in the history.'}
                    </FieldDescription>
                  )}
                </Field>
                {busy ? (
                  <div role="status" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
                    Saving decision…
                  </div>
                ) : report.status === 'pending' ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => decide('approved')}>
                      <CheckIcon data-icon="inline-start" />
                      Approve
                    </Button>
                    <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => decide('rejected')}>
                      <XIcon data-icon="inline-start" />
                      Reject
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Button variant="outline" onClick={() => decide(report.status === 'approved' ? 'rejected' : 'approved')}>
                      <ArrowLeftRightIcon data-icon="inline-start" />
                      Change to {report.status === 'approved' ? 'Rejected' : 'Approved'}
                    </Button>
                  </div>
                )}
              </section>
            )}

            <section aria-labelledby="history-title" className="flex flex-col gap-4 p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 id="history-title" className="text-[15px] font-semibold">Status history</h3>
                <span className="text-sm text-muted-foreground">
                  {report.history.length} {report.history.length === 1 ? 'entry' : 'entries'}, newest first
                </span>
              </div>
              <ol className="flex flex-col">
                {report.history.map((entry, index) => {
                  const marker = entry.kind === 'edited' ? editedMarker : markerStyles[entry.kind === 'created' ? 'pending' : entry.to]
                  const Icon = marker.icon
                  const last = index === report.history.length - 1
                  return (
                    <li key={entry.id} className="flex gap-3">
                      <div className="flex w-6 flex-none flex-col items-center">
                        <div className={cn('flex size-6 items-center justify-center rounded-full', marker.className)}>
                          <Icon className="size-3" strokeWidth={3} aria-hidden="true" />
                        </div>
                        {!last && <div className="my-1 min-h-4 w-px flex-1 bg-border" aria-hidden="true" />}
                      </div>
                      <div className={cn('flex min-w-0 flex-1 flex-col gap-1', !last && 'pb-5')}>
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-medium">{entryTitle(entry)}</span>
                          <span className="text-xs text-muted-foreground">{entryTransition(entry)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.actor} · {entry.actorRole} · <time dateTime={entry.at}>{formatDateTime(entry.at)}</time>
                        </div>
                        {entry.note && (
                          <p className="mt-1 rounded-lg border bg-muted/50 px-2.5 py-2 text-sm text-foreground/80">{entry.note}</p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          </>
        ) : notFound ? (
          <div className="flex flex-1 items-center">
            <SheetTitle className="sr-only">Report not found</SheetTitle>
            <StateMessage
              icon={FileXIcon}
              title="Report not found"
              description={`Report #${reportId} doesn't exist or was removed. The link may be out of date.`}
            />
          </div>
        ) : error && !isLoading ? (
          <div role="alert" className="flex flex-1 items-center">
            <SheetTitle className="sr-only">History could not be loaded</SheetTitle>
            <StateMessage
              icon={AlertCircleIcon}
              title="History could not be loaded"
              description="The API did not respond. Check that the server is running, then try again."
            >
              <Button variant="outline" onClick={() => mutate()}>
                <RefreshCwIcon data-icon="inline-start" />
                Try again
              </Button>
            </StateMessage>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-6" aria-busy="true">
            <SheetTitle className="sr-only">Loading report</SheetTitle>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="mt-6 flex flex-col gap-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-6 rounded-full" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
