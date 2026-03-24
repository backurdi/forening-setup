import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

export async function getOrganizationCrmOverview(slug: string) {
  return fetchAuthQuery(api.crm.getOrganizationCrmOverview, { slug });
}
