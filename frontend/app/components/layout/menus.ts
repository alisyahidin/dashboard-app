import { FileChartColumnIncreasingIcon, HouseIcon, type LucideIcon } from 'lucide-react'
import { matchPath } from 'react-router'
import type { User } from '~/services/auth'

export type MenuItem = {
  title: string
  url: string
  icon: LucideIcon
  // hide the menu unless the user has this permission
  permission?: string
}

export const menus: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: HouseIcon,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileChartColumnIncreasingIcon,
    permission: "reports:read",
  },
]

export function getVisibleMenus(user: User) {
  return menus.filter((menu) => !menu.permission || user.permissions.includes(menu.permission))
}

// "/" only matches exactly; other menus also match their sub pages (e.g. /reports/123)
export function isMenuActive(menu: MenuItem, pathname: string) {
  return matchPath({ path: menu.url, end: menu.url === "/" }, pathname) !== null
}
