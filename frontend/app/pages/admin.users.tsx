import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ChevronLeftIcon, ChevronRightIcon, LinkIcon, PencilIcon, PlusIcon, SearchIcon, SearchXIcon } from 'lucide-react'
import { InviteLinkDialog } from '~/components/admin/invite-link-dialog'
import { UserAvatar } from '~/components/user-avatar'
import { UserFormDialog } from '~/components/admin/user-form-dialog'
import { UserStatusBadge } from '~/components/admin/user-status-badge'
import { LoadError, NoAccess, StateMessage, TableSkeletonRows } from '~/components/reports/table-states'
import { RoleBadge } from '~/components/role-badge'
import { TruncatedText } from '~/components/truncated-text'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { toast } from '~/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useRevalidateAdmin, useRoles, useUsers } from '~/hooks/use-admin'
import { isForbidden } from '~/hooks/use-auth-error'
import { useCurrentUser } from '~/hooks/use-current-user'
import type { AdminUser } from '~/services/users'

const SEARCH_DEBOUNCE_MS = 300
const PAGE_SIZE = 20

const col = {
  user: 'pl-4',
  role: 'hidden w-36 lg:table-cell',
  status: 'hidden w-32 sm:table-cell',
  actions: 'w-36 pr-4',
}

function parsePage(value: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export function PageAdminUsers() {
  const currentUser = useCurrentUser()
  const isAdmin = currentUser.role === 'admin'
  const revalidateAdmin = useRevalidateAdmin()

  const [searchParams, setSearchParams] = useSearchParams()
  const roleId = searchParams.get('role') ?? 'all'
  const page = parsePage(searchParams.get('page'))
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')

  function setPage(value: number, options: { replace?: boolean } = {}) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value > 1) next.set('page', String(value))
      else next.delete('page')
      return next
    }, { replace: options.replace ?? false })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = search.trim()
      if (trimmed === query) return
      setQuery(trimmed)
      setPage(1, { replace: true })
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  const users = useUsers({ roleId, q: query, page, pageSize: PAGE_SIZE })

  useEffect(() => {
    if (users.data && users.data.page !== page) setPage(users.data.page, { replace: true })
  }, [users.data])
  const roles = useRoles()
  const roleList = roles.data ?? []
  const filterOptions = [{ value: 'all', label: 'All roles' }, ...roleList.map((r) => ({ value: r.name, label: r.name }))]

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [linkFor, setLinkFor] = useState<{ user: AdminUser; fromAdd: boolean } | null>(null)

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <Card className="py-0">
          <NoAccess description="Only admins can manage users." />
        </Card>
      </div>
    )
  }

  const data = users.data
  const rows = data?.items ?? []
  const failed = Boolean(users.error) && !users.isLoading
  const hasFilters = roleId !== 'all' || query !== ''

  function setRoleFilter(value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === 'all') next.delete('role')
      else next.set('role', value)
      next.delete('page')
      return next
    }, { replace: true })
  }

  function clearFilters() {
    setSearch('')
    setQuery('')
    setRoleFilter('all')
  }

  const first = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0
  const last = first > 0 ? first + rows.length - 1 : 0

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Add people, set their role, and share a login link so they can create a password.</p>
        </div>
        <Button
          size="lg"
          disabled={roleList.length === 0}
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <PlusIcon data-icon="inline-start" />
          Add user
        </Button>
      </div>

      <Card className="gap-0 py-0" aria-label="Users" aria-busy={users.isLoading}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="relative w-full sm:w-72">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Search users"
              placeholder="Search name or email"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select items={filterOptions} value={roleId} onValueChange={(value) => setRoleFilter(String(value ?? 'all'))}>
            <SelectTrigger aria-label="Filter by role" className="h-9 w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {failed && isForbidden(users.error) ? (
          <div className="border-t">
            <NoAccess description="Your role can't manage users. Ask an admin if you need access." />
          </div>
        ) : failed ? (
          <div className="border-t">
            <LoadError detail="GET /api/v1/users failed" onRetry={() => users.mutate()} />
          </div>
        ) : !users.isLoading && rows.length === 0 ? (
          <div className="border-t">
            <StateMessage
              icon={SearchXIcon}
              title="No users found"
              description="Nobody matches this role and search."
            >
              {hasFilters && <Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
            </StateMessage>
          </div>
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className={col.user}>User</TableHead>
                <TableHead className={col.role}>Role</TableHead>
                <TableHead className={col.status}>Status</TableHead>
                <TableHead className={col.actions}><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.isLoading ? (
                <TableSkeletonRows
                  columns={4}
                  rows={6}
                  skeletonClassName="min-h-9"
                  columnClassNames={[col.user, col.role, col.status, col.actions]}
                />
              ) : (
                rows.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className={col.user}>
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar name={user.name} />
                        <div className="flex min-w-0 flex-col">
                          <div className="flex min-w-0 items-center gap-2">
                            <TruncatedText className="font-medium">{user.name}</TruncatedText>
                            {user.isCurrentUser && <Badge variant="secondary" className="shrink-0">You</Badge>}
                          </div>
                          <TruncatedText className="text-xs text-muted-foreground">{user.email}</TruncatedText>
                          <div className="mt-1 flex flex-wrap gap-1 lg:hidden">
                            <RoleBadge role={user.role.name} label={user.role.name} />
                            <span className="sm:hidden"><UserStatusBadge status={user.status} /></span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={col.role}>
                      <RoleBadge role={user.role.name} label={user.role.name} />
                    </TableCell>
                    <TableCell className={col.status}><UserStatusBadge status={user.status} /></TableCell>
                    <TableCell className={col.actions}>
                      <div className="flex items-center justify-end gap-1">
                        {user.status === 'invited' && user.invite && (
                          <Button variant="outline" size="sm" onClick={() => setLinkFor({ user, fromAdd: false })}>
                            <LinkIcon data-icon="inline-start" />
                            Login link
                          </Button>
                        )}
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Edit ${user.name}`}
                                onClick={() => {
                                  setEditing(user)
                                  setFormOpen(true)
                                }}
                              />
                            }
                          >
                            <PencilIcon />
                          </TooltipTrigger>
                          <TooltipContent>Edit user</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {!failed && data && data.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
            <div>Showing {first}–{last} of {data.total} {data.total === 1 ? 'user' : 'users'}</div>
            <div className="flex items-center gap-3">
              <span className="tabular-nums">Page {data.page} of {data.pageCount}</span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous page"
                  disabled={data.page <= 1 || users.isLoading}
                  onClick={() => setPage(data.page - 1)}
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next page"
                  disabled={data.page >= data.pageCount || users.isLoading}
                  onClick={() => setPage(data.page + 1)}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <UserFormDialog
        key={editing?.id ?? 'new'}
        open={formOpen}
        user={editing}
        roles={roleList}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        onSaved={(user, created) => {
          setFormOpen(false)
          setEditing(null)
          revalidateAdmin()
          if (created) {
            setLinkFor({ user, fromAdd: true })
          } else {
            toast.add({ type: 'success', title: 'User updated', description: `${user.name} · ${user.role.name}` })
          }
        }}
      />

      <InviteLinkDialog user={linkFor?.user ?? null} fromAdd={linkFor?.fromAdd ?? false} onClose={() => setLinkFor(null)} />
    </div>
  )
}
