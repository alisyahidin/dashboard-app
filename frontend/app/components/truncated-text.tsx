import { useState } from 'react'
import { cn } from 'cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'

export function TruncatedText({
  children,
  className,
  render,
}: {
  children: React.ReactNode
  className?: string
  render?: React.ReactElement
}) {
  const [truncated, setTruncated] = useState(false)

  const measure = (event: React.SyntheticEvent<HTMLElement>) => {
    const el = event.currentTarget
    setTruncated(el.scrollWidth > el.clientWidth)
  }

  return (
    <Tooltip>
      <TooltipTrigger
        delay={300}
        render={render ?? <span />}
        className={cn('block max-w-full truncate', className)}
        onPointerEnter={measure}
        onFocus={measure}
      >
        {children}
      </TooltipTrigger>
      {truncated && <TooltipContent className="max-w-sm break-words">{children}</TooltipContent>}
    </Tooltip>
  )
}
