import { getOrganizationCrmOverview } from "@/lib/server/services/crm";
import { listOrganizationSummaries } from "@/lib/server/services/organizations";

export async function getAdminContext(requestedSlug?: string) {
  const organizations = await listOrganizationSummaries();
  const selectedSlug = requestedSlug ?? organizations[0]?.slug ?? null;
  const crmOverview = selectedSlug ? await getOrganizationCrmOverview(selectedSlug) : null;

  return {
    crmOverview,
    organizations,
    selectedSlug
  };
}
