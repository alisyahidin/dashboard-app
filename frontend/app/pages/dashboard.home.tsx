import { useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  InboxIcon,
  PlusIcon,
  XCircleIcon,
  type LucideIcon,
} from 'lucide-react'
import { ReportFormDialog } from '~/components/reports/report-form-dialog'
import { ReportStatusBadge } from '~/components/reports/report-status-badge'
import { LoadError, StateMessage, TableSkeletonRows } from '~/components/reports/table-states'
import { Button, buttonVariants } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { toast } from '~/components/ui/toast'
import { TruncatedText } from '~/components/truncated-text'
import { useCurrentUser } from '~/hooks/use-current-user'
import { useReportCounts, useReports, useRevalidateReports } from '~/hooks/use-reports'
import { formatDateTime } from '~/lib/format'
import { hasPermission } from '~/lib/permissions'
import type { ReportCounts } from '~/services/reports'

const col = {
  id: 'hidden w-20 pl-4 xl:table-cell',
  name: 'pl-4 xl:pl-2',
  description: 'hidden w-[30%] xl:table-cell',
  status: 'w-28',
  created: 'hidden w-40 lg:table-cell',
  action: 'w-20 pr-4 text-right',
}

const summaryCards: { key: keyof ReportCounts; label: string; caption: string; icon: LucideIcon }[] = [
  { key: 'all', label: 'Total reports', caption: 'All submissions', icon: FileTextIcon },
  { key: 'pending', label: 'Pending', caption: 'Awaiting review', icon: ClockIcon },
  { key: 'approved', label: 'Approved', caption: 'Decision final', icon: CheckCircle2Icon },
  { key: 'rejected', label: 'Rejected', caption: 'Decision final', icon: XCircleIcon },
]

export function PageDashboard() {
  const user = useCurrentUser()
  const canCreate = hasPermission(user, 'reports:write')
  const canReview = hasPermission(user, 'reports:approve')
  const [createOpen, setCreateOpen] = useState(false)

  const countsQuery = useReportCounts()
  const latestQuery = useReports({ status: 'all', page: 1, pageSize: 5 })
  const revalidateReports = useRevalidateReports()
  const counts = countsQuery.data
  const latest = latestQuery.data?.items ?? []
  const failed = Boolean(latestQuery.error) && !latestQuery.isLoading

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Where field reports stand right now and what still needs a decision.</p>
        </div>
        {canCreate && (
          <Button size="lg" onClick={() => setCreateOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            New report
          </Button>
        )}
      </div>

      <section aria-label="Report summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {summaryCards.map(({ key, label, caption, icon: Icon }) => (
          <Card key={key} className="gap-1 py-4">
            <CardContent className="flex flex-col gap-1 px-4">
              <div className="flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground">
                {label}
                <Icon className="size-4" aria-hidden="true" />
              </div>
              {countsQuery.isLoading ? (
                <Skeleton className="my-0.5 h-7 w-12" />
              ) : (
                <div className="text-2xl font-semibold tabular-nums">{counts ? counts[key] : '—'}</div>
              )}
              <div className="text-xs text-muted-foreground">{caption}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold">Latest reports</h2>
            <p className="text-sm text-muted-foreground">The five most recent submissions.</p>
          </div>
          <Link to="/reports" className={buttonVariants({ variant: 'ghost' })}>
            View all reports
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </div>

        {failed ? (
          <div className="border-t">
            <LoadError detail="GET /api/v1/reports failed" onRetry={() => revalidateReports()} />
          </div>
        ) : !latestQuery.isLoading && latest.length === 0 ? (
          <div className="border-t">
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
          </div>
        ) : (
          <Table className="table-fixed" aria-busy={latestQuery.isLoading}>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className={col.id}>ID</TableHead>
                <TableHead className={col.name}>Name</TableHead>
                <TableHead className={col.description}>Description</TableHead>
                <TableHead className={col.status}>Status</TableHead>
                <TableHead className={col.created}>Created</TableHead>
                <TableHead className={col.action}><span className="sr-only">Action</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestQuery.isLoading ? (
                <TableSkeletonRows
                  columns={6}
                  skeletonClassName='min-h-[22px]'
                  columnClassNames={[col.id, col.name, col.description, col.status, col.created, col.action]}
                />
              ) : (
                latest.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className={`${col.id} font-mono text-xs text-muted-foreground`}>#{report.number}</TableCell>
                    <TableCell className={`${col.name} font-medium`}>
                      <TruncatedText>{report.name}</TruncatedText>
                    </TableCell>
                    <TableCell className={`${col.description} text-muted-foreground`}>
                      <TruncatedText>{report.description}</TruncatedText>
                    </TableCell>
                    <TableCell className={col.status}><ReportStatusBadge status={report.status} /></TableCell>
                    <TableCell className={`${col.created} text-muted-foreground tabular-nums`}>
                      <TruncatedText>{formatDateTime(report.createdAt)}</TruncatedText>
                    </TableCell>
                    <TableCell className={col.action}>
                      {report.status === 'pending' && canReview && (
                        <Link to={`/reports?report=${report.id}`} className="text-sm font-medium underline-offset-4 hover:underline">
                          Review
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <ReportFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={(report) => {
          setCreateOpen(false)
          toast.add({ type: 'success', title: 'Report created', description: report.name })
          revalidateReports()
        }}
      />
    </div>
  )
}
