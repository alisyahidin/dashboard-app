import { PageDashboard } from "~/pages/dashboard.home";
import type { Route } from "./+types/dashboard.home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard | Home" },
    { name: "description", content: "Welcome to Dashboard!" },
  ];
}

export default function Home() {
  return <PageDashboard />;
}
