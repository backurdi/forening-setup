"use server";

import { revalidatePath } from "next/cache";

import { fetchAuthMutation } from "@/lib/auth-server";
import { sendBulkMemberBroadcastEmail, sendSubscriberWelcomeEmail, sendWelcomeMemberEmail } from "@/lib/server/email/resend";
import { api } from "@convex/_generated/api";
import { getOrganizationCrmOverview } from "@/lib/server/services/crm";
import {
  bulkMemberEmailSchema,
  manualMemberSchema,
  manualPaymentSchema,
  newsletterSubscriberSchema,
  type BulkMemberEmailInput,
  type ManualMemberInput,
  type ManualPaymentInput,
  type NewsletterSubscriberInput
} from "@/lib/validations/crm";

export async function createManualMember(input: ManualMemberInput) {
  const parsed = manualMemberSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten()
    };
  }

  const result = await fetchAuthMutation(api.crm.createManualMember, parsed.data);
  revalidatePath("/dashboard");

  if (parsed.data.status === "active") {
    await sendWelcomeMemberEmail({
      firstName: parsed.data.firstName,
      memberId: result.memberId,
      orgSlug: parsed.data.orgSlug,
      personId: result.personId,
      recipientEmail: parsed.data.email
    });
  }

  return {
    ok: true as const,
    result
  };
}

export async function createNewsletterSubscriber(input: NewsletterSubscriberInput) {
  const parsed = newsletterSubscriberSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten()
    };
  }

  const result = await fetchAuthMutation(api.crm.createSubscriber, parsed.data);
  revalidatePath("/dashboard");

  await sendSubscriberWelcomeEmail({
    firstName: parsed.data.fullName.split(/\s+/)[0] ?? "there",
    orgSlug: parsed.data.orgSlug,
    personId: result.personId,
    recipientEmail: parsed.data.email
  });

  return {
    ok: true as const,
    result
  };
}

export async function recordManualPayment(input: ManualPaymentInput) {
  const parsed = manualPaymentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten()
    };
  }

  const result = await fetchAuthMutation(api.crm.recordManualPayment, parsed.data);
  revalidatePath("/dashboard");

  return {
    ok: true as const,
    result
  };
}

export async function sendBulkMemberEmail(input: BulkMemberEmailInput) {
  const parsed = bulkMemberEmailSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten()
    };
  }

  const crmOverview = await getOrganizationCrmOverview(parsed.data.orgSlug);
  const recipients = crmOverview.members
    .filter((member) => {
      if (parsed.data.audience === "all") {
        return true;
      }

      return member.status === parsed.data.audience;
    })
    .map((member) => ({
      email: member.email,
      firstName: member.name.split(/\s+/)[0] ?? "there",
      memberId: member.id
    }));

  if (recipients.length === 0) {
    return {
      message: "No members match that audience filter.",
      ok: false as const
    };
  }

  const result = await sendBulkMemberBroadcastEmail({
    body: parsed.data.body,
    orgSlug: parsed.data.orgSlug,
    recipients,
    subject: parsed.data.subject
  });

  revalidatePath(`/dashboard/members?org=${parsed.data.orgSlug}`);
  revalidatePath(`/dashboard/settings/email?org=${parsed.data.orgSlug}`);

  return {
    message:
      result.failed > 0
        ? `Sent ${result.succeeded} emails. ${result.failed} failed.`
        : `Sent ${result.succeeded} emails successfully.`,
    ok: result.succeeded > 0
  };
}
