import { useRouteLoaderData } from 'react-router'
import type { User } from '~/services/auth'

export function useCurrentUser(): User {
  const data = useRouteLoaderData<{ user: User }>('dashboard')
  if (!data) throw new Error('useCurrentUser must be used inside the dashboard layout')
  return data.user
}
