import { FileChartColumnIncreasingIcon, HouseIcon, UsersIcon, type LucideIcon } from 'lucide-react'
import { matchPath } from 'react-router'
import type { User } from '~/services/auth'

export type MenuItem = {
  title: string
  url: string
  icon: LucideIcon
  permission?: string
  role?: string
}

export type MenuGroup = {
  label: string
  items: MenuItem[]
}

export const menuGroups: MenuGroup[] = [
  {
    label: 'Menu',
    items: [
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
    ],
  },
  {
    label: 'Admin',
    items: [
      {
        title: "Users",
        url: "/admin/users",
        icon: UsersIcon,
        role: "admin",
      },
    ],
  },
]

export const menus: MenuItem[] = menuGroups.flatMap((group) => group.items)

export function canSeeMenu(user: User, menu: MenuItem) {
  if (menu.role && user.role !== menu.role) return false
  return !menu.permission || user.permissions.includes(menu.permission)
}

export function getVisibleMenuGroups(user: User) {
  return menuGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => canSeeMenu(user, item)) }))
    .filter((group) => group.items.length > 0)
}

export function isMenuActive(menu: MenuItem, pathname: string) {
  return matchPath({ path: menu.url, end: menu.url === "/" }, pathname) !== null
}
