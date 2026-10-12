import { redirect } from "react-router";
import { PageLogin } from "~/pages/auth.login";
import { getCurrentUser } from "~/services/session";
import type { Route } from "./+types/auth.login";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard | Login" },
    { name: "description", content: "Welcome to Dashboard!" },
  ];
}

export async function clientLoader() {
  if (await getCurrentUser()) throw redirect("/");
  return null;
}

export default function Login() {
  return <PageLogin />;
}
