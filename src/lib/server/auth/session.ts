import { redirect } from "next/navigation";

import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

export async function getRequiredViewer() {
  if (!(await isAuthenticated())) {
    redirect("/auth/sign-in");
  }

  return fetchAuthQuery(api.auth.viewer);
}
