import { PageAdminUsers } from "~/pages/admin.users";
import type { Route } from "./+types/admin.users";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard | Users" },
  ];
}

export default function AdminUsers() {
  return <PageAdminUsers />;
}
