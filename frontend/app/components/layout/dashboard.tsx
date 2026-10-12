import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { Button } from '~/components/ui/button'
import { logout, type User } from '~/services/auth'

export function LayoutDashboard({ user }: { user: User }) {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <>
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="text-sm">
          {user.name} <span className="text-muted-foreground">({user.role ?? 'no role'})</span>
        </span>
        <Button variant="outline" size="sm" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? 'Logging out...' : 'Logout'}
        </Button>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}
