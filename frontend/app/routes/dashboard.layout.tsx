import { redirect } from "react-router";
import { LayoutDashboard } from "~/components/layout/dashboard";
import { getCurrentUser } from "~/services/session";
import type { Route } from "./+types/dashboard.layout";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const user = await getCurrentUser();
  if (!user) {
    const { pathname, search } = new URL(request.url);
    const params = new URLSearchParams({ redirectTo: pathname + search });
    throw redirect(`/login?${params}`);
  }
  return { user };
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  return <LayoutDashboard user={loaderData.user} />;
}
