import { useCallback } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { listRoles } from '~/services/roles'
import { listUsers, type ListUsersParams } from '~/services/users'

const ADMIN_KEY = 'admin'

export function useUsers(params: ListUsersParams | null) {
  return useSWR(params ? [ADMIN_KEY, 'users', params] : null, ([, , p]) => listUsers(p), { keepPreviousData: true })
}

export function useRoles() {
  return useSWR([ADMIN_KEY, 'roles'], () => listRoles())
}

export function useRevalidateAdmin() {
  const { mutate } = useSWRConfig()
  return useCallback(() => mutate((key) => Array.isArray(key) && key[0] === ADMIN_KEY), [mutate])
}
