import { PageInvite } from "~/pages/invite";
import type { Route } from "./+types/invite";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard | Set up your account" },
  ];
}

export default function Invite({ params }: Route.ComponentProps) {
  return <PageInvite key={params.token} token={params.token} />;
}
