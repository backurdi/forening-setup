import { fetchAuthQuery } from "@/lib/auth-server";
import { fetchPublicQuery } from "@/lib/server/convex/client";
import { api } from "@convex/_generated/api";

export async function listOrganizationIntegrations(orgSlug: string) {
  return fetchAuthQuery(api.integrations.listForOrganization, { orgSlug });
}

export async function getOrganizationIntegration(orgSlug: string, slug: string) {
  return fetchAuthQuery(api.integrations.getForOrganization, { orgSlug, slug });
}

export async function getPublicIntegration(orgSlug: string, slug: string) {
  return fetchPublicQuery(api.integrations.getPublicIntegration, { orgSlug, slug });
}

export async function getPreviewIntegration(orgSlug: string, slug: string) {
  return fetchPublicQuery(api.integrations.getPreviewIntegration, { orgSlug, slug });
}
