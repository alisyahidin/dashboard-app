import { cn } from "cn"
import { Badge } from "~/components/ui/badge"

const roleStyles: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  supervisor: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  officer: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
}

export function RoleBadge({ role, label, className }: { role: string | null; label?: string; className?: string }) {
  const style = role ? roleStyles[role] : undefined

  return (
    <Badge
      variant={style ? "default" : "outline"}
      className={cn(!label && "capitalize", style, className)}
    >
      {label ?? role ?? "no role"}
    </Badge>
  )
}
