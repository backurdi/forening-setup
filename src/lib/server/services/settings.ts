import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

export async function getOrganizationSettings(slug: string) {
  return fetchAuthQuery(api.organizations.getOrganizationSettings, { slug });
}
