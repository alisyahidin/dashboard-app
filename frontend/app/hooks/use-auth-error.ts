import { useCallback } from 'react'
import { useLocation, useNavigate, useRevalidator } from 'react-router'
import { useSWRConfig } from 'swr'
import { toast } from '~/components/ui/toast'
import { ApiError } from '~/services/api'

export function isForbidden(error: unknown) {
  return error instanceof ApiError && error.status === 403
}

export function useAuthErrorHandler() {
  const navigate = useNavigate()
  const location = useLocation()
  const revalidator = useRevalidator()
  const { mutate } = useSWRConfig()

  return useCallback(
    (error: unknown, options: { notify?: boolean; refetch?: boolean } = {}) => {
      if (!(error instanceof ApiError)) return false
      if (error.status === 401) {
        const params = new URLSearchParams({ redirectTo: location.pathname + location.search })
        navigate(`/login?${params}`, { replace: true })
        return true
      }
      if (error.status === 403) {
        if (options.notify ?? true) {
          toast.add({
            type: 'error',
            title: 'Not allowed',
            description:
              error.message && error.message !== 'Forbidden'
                ? error.message
                : "You don't have permission to do this. Your access may have changed, so the page has been updated.",
          })
        }
        revalidator.revalidate()
        if (options.refetch ?? true) mutate(() => true)
        return true
      }
      return false
    },
    [navigate, location.pathname, location.search, revalidator, mutate],
  )
}
