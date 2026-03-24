"use server";

import { revalidatePath } from "next/cache";

import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";
import { organizationSettingsSchema, type OrganizationSettingsInput } from "@/lib/validations/organization";

export async function saveOrganizationSettings(input: OrganizationSettingsInput) {
  const parsed = organizationSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten()
    };
  }

  const organization = await fetchAuthMutation(api.organizations.createOrganization, parsed.data);
  revalidatePath("/dashboard");

  return {
    ok: true as const,
    organization
  };
}
