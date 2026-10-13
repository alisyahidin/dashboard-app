import { redirect } from "react-router";
import { SWRConfig } from "swr";
import { LayoutDashboard } from "~/components/layout/dashboard";
import { useAuthErrorHandler } from "~/hooks/use-auth-error";
import { ApiError } from "~/services/api";
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
  const handleAuthError = useAuthErrorHandler();

  return (
    <SWRConfig
      value={{
        onError: (error) => handleAuthError(error, { notify: false, refetch: false }),
        onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return;
          if (retryCount >= 3) return;
          setTimeout(() => revalidate({ retryCount }), 2000 * 2 ** retryCount);
        },
      }}
    >
      <LayoutDashboard user={loaderData.user} />
    </SWRConfig>
  );
}
