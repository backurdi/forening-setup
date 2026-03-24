"use server";

import { revalidatePath } from "next/cache";

import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";
import {
  integrationBuilderSchema,
  normalizeIntegrationBuilderInput,
  type IntegrationBuilderInput
} from "@/lib/validations/integrations";

function revalidateIntegrationPaths(orgSlug: string, slug?: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard?org=${orgSlug}`);
  revalidatePath(`/dashboard/settings/integrations?org=${orgSlug}`);
  revalidatePath(`/${orgSlug}/integrations`);
  if (slug) {
    revalidatePath(`/${orgSlug}/integrations/${slug}`);
    revalidatePath(`/${orgSlug}/integrations/${slug}/preview`);
  }
}

export async function saveIntegration(input: IntegrationBuilderInput) {
  const parsed = integrationBuilderSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }

  try {
    const normalized = normalizeIntegrationBuilderInput(parsed.data);
    const result = await fetchAuthMutation(api.integrations.saveIntegration, {
      buttonLabel: normalized.buttonLabel,
      destinationType: normalized.destinationType,
      destinationUrl: normalized.destinationUrl,
      existingSlug: normalized.existingSlug,
      fields: normalized.fields,
      integrationType: normalized.integrationType,
      name: normalized.name,
      orgSlug: normalized.orgSlug,
      slug: normalized.slug,
      status: normalized.status,
      summary: normalized.summary,
      title: normalized.title
    });

    revalidateIntegrationPaths(parsed.data.orgSlug, result.slug);

    return {
      ok: true as const,
      slug: result.slug
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Integration could not be created.",
      ok: false as const
    };
  }
}

export async function updateIntegrationStatus(input: {
  orgSlug: string;
  slug: string;
  status: "active" | "draft";
}) {
  try {
    await fetchAuthMutation(api.integrations.updateIntegrationStatus, input);
    revalidateIntegrationPaths(input.orgSlug, input.slug);

    return { ok: true as const };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Integration status could not be updated.",
      ok: false as const
    };
  }
}
