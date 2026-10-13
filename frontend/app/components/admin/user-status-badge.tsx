import { cn } from 'cn'
import { Badge } from '~/components/ui/badge'
import type { UserStatus } from '~/services/users'

const statusConfig: Record<UserStatus, { label: string; className: string; dot?: string }> = {
  active: {
    label: 'Active',
    className: 'border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-300',
    dot: 'bg-green-600 dark:bg-green-400',
  },
  invited: {
    label: 'Invite sent',
    className: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300',
  },
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const { label, className, dot } = statusConfig[status]
  return (
    <Badge variant="outline" className={cn(className)}>
      {dot && <span className={cn('size-1.5 rounded-full', dot)} aria-hidden="true" />}
      {label}
    </Badge>
  )
}
