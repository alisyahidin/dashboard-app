import { PageNotFound } from "~/pages/not-found";
import type { Route } from "./+types/not-found";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard | Page not found" },
  ];
}

export default function NotFound() {
  return <PageNotFound />;
}
