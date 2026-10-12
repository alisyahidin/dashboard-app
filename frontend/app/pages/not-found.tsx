import { Link } from 'react-router'
import { buttonVariants } from '~/components/ui/button'

export function PageNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <div className="rounded-full border bg-muted px-2.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">404</div>
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        This address does not match any page in the dashboard. It may have been mistyped, or the link is out of date.
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Link to="/" className={buttonVariants()}>Back to dashboard</Link>
      </div>
    </div>
  )
}
