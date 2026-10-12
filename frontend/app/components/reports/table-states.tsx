import { cn } from 'cn'
import type { LucideIcon } from 'lucide-react'
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import { TableCell, TableRow } from '~/components/ui/table'

const skeletonWidths = ['w-44', 'w-36', 'w-48', 'w-32', 'w-40']

export function TableSkeletonRows({
  rows = 5,
  columns,
  skeletonClassName,
  columnClassNames,
}: {
  rows?: number
  columns: number
  skeletonClassName?: string
  columnClassNames?: (string | undefined)[]
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <TableRow key={row} aria-hidden="true">
          {Array.from({ length: columns }, (_, col) => (
            <TableCell key={col} className={columnClassNames ? columnClassNames[col] : col === 2 ? 'hidden xl:table-cell' : undefined}>
              <Skeleton
                className={cn(
                  col === 1 || col === 2 ? `h-4 ${skeletonWidths[row % skeletonWidths.length]} max-w-full` : 'h-4 w-16',
                  skeletonClassName,
                )}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export function StateMessage({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="mb-1 flex size-11 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="text-base font-semibold">{title}</div>
      <div className="max-w-sm text-sm text-muted-foreground">{description}</div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}

export function LoadError({ detail, onRetry }: { detail: string; onRetry: () => void }) {
  return (
    <div role="alert">
      <StateMessage
        icon={AlertCircleIcon}
        title="Reports could not be loaded"
        description={
          <>
            The API did not respond. Check that the server is running, then try again.
            <span className="mt-2 block font-mono text-xs">{detail}</span>
          </>
        }
      >
        <Button variant="outline" onClick={onRetry}>
          <RefreshCwIcon data-icon="inline-start" />
          Try again
        </Button>
      </StateMessage>
    </div>
  )
}
