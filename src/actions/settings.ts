"use server";

import { revalidatePath } from "next/cache";

import { fetchAuthMutation } from "@/lib/auth-server";
import { sendTestOrganizationEmail } from "@/lib/server/email/resend";
import { api } from "@convex/_generated/api";
import {
  emailSettingsSchema,
  generalSettingsSchema,
  paymentSettingsSchema,
  sendTestEmailSchema,
  type EmailSettingsInput,
  type GeneralSettingsInput,
  type PaymentSettingsInput,
  type SendTestEmailInput
} from "@/lib/validations/settings";

function revalidateSettingsPaths(orgSlug: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard?org=${orgSlug}`);
  revalidatePath(`/dashboard/settings?org=${orgSlug}`);
  revalidatePath(`/dashboard/settings/payments?org=${orgSlug}`);
  revalidatePath(`/dashboard/settings/email?org=${orgSlug}`);
  revalidatePath(`/dashboard/emails?org=${orgSlug}`);
}

export async function updateGeneralSettings(input: GeneralSettingsInput) {
  const parsed = generalSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }

  await fetchAuthMutation(api.organizations.updateGeneralSettings, parsed.data);
  revalidateSettingsPaths(parsed.data.orgSlug);

  return { ok: true as const };
}

export async function updatePaymentSettings(input: PaymentSettingsInput) {
  const parsed = paymentSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }

  await fetchAuthMutation(api.organizations.updatePaymentSettings, parsed.data);
  revalidateSettingsPaths(parsed.data.orgSlug);

  return { ok: true as const };
}

export async function updateEmailSettings(input: EmailSettingsInput) {
  const parsed = emailSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }

  await fetchAuthMutation(api.organizations.updateEmailSettings, parsed.data);
  revalidateSettingsPaths(parsed.data.orgSlug);

  return { ok: true as const };
}

export async function sendSettingsTestEmail(input: SendTestEmailInput) {
  const parsed = sendTestEmailSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }

  const result = await sendTestOrganizationEmail(parsed.data.orgSlug, parsed.data.recipientEmail);
  revalidateSettingsPaths(parsed.data.orgSlug);

  return result;
}
