import { PageReports } from "~/pages/reports";
import type { Route } from "./+types/reports";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard | Reports" },
  ];
}

export default function Reports() {
  return <PageReports />;
}
