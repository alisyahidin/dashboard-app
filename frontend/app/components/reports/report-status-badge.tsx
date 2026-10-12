import { CheckIcon, ClockIcon, XIcon } from 'lucide-react'
import { cn } from 'cn'
import { Badge } from '~/components/ui/badge'
import type { ReportStatus } from '~/services/reports'

const statusConfig: Record<ReportStatus, { label: string; icon: typeof CheckIcon; className: string }> = {
  pending: {
    label: 'Pending',
    icon: ClockIcon,
    className: 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
  },
  approved: {
    label: 'Approved',
    icon: CheckIcon,
    className: 'border-green-200 bg-green-100 text-green-800 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-300',
  },
  rejected: {
    label: 'Rejected',
    icon: XIcon,
    className: 'border-red-200 bg-red-100 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300',
  },
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const { label, icon: Icon, className } = statusConfig[status]
  return (
    <Badge variant="outline" className={cn(className)}>
      <Icon data-icon="inline-start" strokeWidth={2.5} />
      {label}
    </Badge>
  )
}
