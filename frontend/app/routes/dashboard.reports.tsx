import { PageReports } from "~/pages/dashboard.reports";
import type { Route } from "./+types/dashboard.reports";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard | Reports" },
  ];
}

export default function Reports() {
  return <PageReports />;
}
