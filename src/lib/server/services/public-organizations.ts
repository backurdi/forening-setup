import { fetchPublicQuery } from "@/lib/server/convex/client";
import { api } from "@convex/_generated/api";

export async function getPublicOrganizationBySlug(slug: string) {
  return fetchPublicQuery(api.publicForms.getPublicOrganizationBySlug, { slug });
}
