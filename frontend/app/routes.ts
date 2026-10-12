import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/auth.login.tsx"),
  layout("routes/dashboard.layout.tsx", { id: "dashboard" }, [
    index("routes/dashboard.home.tsx"),
    route("reports", "routes/dashboard.reports.tsx"),
  ]),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
