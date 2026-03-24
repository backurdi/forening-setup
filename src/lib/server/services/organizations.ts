import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

export async function listOrganizationSummaries() {
  return fetchAuthQuery(api.organizations.listForViewer);
}
