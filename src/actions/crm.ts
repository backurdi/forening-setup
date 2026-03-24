"use server";

import { revalidatePath } from "next/cache";

import { fetchAuthMutation } from "@/lib/auth-server";
import {
  sendBulkMemberBroadcastEmail,
  sendSubscriberWelcomeEmail,
  sendWelcomeMemberEmail,
} from "@/lib/server/email/resend";
import { refundStripePayment } from "@/lib/server/payments/stripe";
import { api } from "@convex/_generated/api";
import { getOrganizationCrmOverview } from "@/lib/server/services/crm";
import { getOrganizationSettings } from "@/lib/server/services/settings";
import {
  bulkMemberEmailSchema,
  memberDeleteSchema,
  memberStatusUpdateSchema,
  memberUpdateSchema,
  manualMemberSchema,
  manualPaymentSchema,
  newsletterSubscriberSchema,
  paymentLinkSchema,
  refundPaymentSchema,
  type BulkMemberEmailInput,
  type MemberDeleteInput,
  type MemberStatusUpdateInput,
  type MemberUpdateInput,
  type ManualMemberInput,
  type ManualPaymentInput,
  type PaymentLinkInput,
  type RefundPaymentInput,
  type NewsletterSubscriberInput,
} from "@/lib/validations/crm";

function revalidateOrganizationDashboardPaths(orgSlug: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/members?org=${orgSlug}`);
  revalidatePath(`/dashboard/payments?org=${orgSlug}`);
  revalidatePath(`/dashboard/settings/email?org=${orgSlug}`);
}

function revalidateMemberDetailPath(orgSlug: string, memberId: string) {
  revalidatePath(`/dashboard/members/${memberId}`);
  revalidatePath(`/dashboard/members/${memberId}?org=${orgSlug}`);
}

export async function createManualMember(input: ManualMemberInput) {
  const parsed = manualMemberSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten(),
    };
  }

  const result = await fetchAuthMutation(
    api.crm.createManualMember,
    parsed.data,
  );
  revalidateOrganizationDashboardPaths(parsed.data.orgSlug);

  if (parsed.data.status === "active") {
    await sendWelcomeMemberEmail({
      firstName: parsed.data.firstName,
      memberId: result.memberId,
      orgSlug: parsed.data.orgSlug,
      personId: result.personId,
      recipientEmail: parsed.data.email,
    });
  }

  return {
    ok: true as const,
    result,
  };
}

export async function updateMember(input: MemberUpdateInput) {
  const parsed = memberUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten(),
    };
  }

  try {
    const result = await fetchAuthMutation(api.crm.updateMember, parsed.data);
    revalidateOrganizationDashboardPaths(parsed.data.orgSlug);

    return {
      ok: true as const,
      result,
    };
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Member could not be updated.",
      ok: false as const,
    };
  }
}

export async function updateMemberStatus(input: MemberStatusUpdateInput) {
  const parsed = memberStatusUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten(),
    };
  }

  try {
    const result = await fetchAuthMutation(
      api.crm.updateMemberStatus,
      parsed.data,
    );
    revalidateOrganizationDashboardPaths(parsed.data.orgSlug);

    return {
      ok: true as const,
      result,
    };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Member status could not be updated.",
      ok: false as const,
    };
  }
}

export async function deleteMember(input: MemberDeleteInput) {
  const parsed = memberDeleteSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten(),
    };
  }

  try {
    const result = await fetchAuthMutation(api.crm.deleteMember, parsed.data);
    revalidateOrganizationDashboardPaths(parsed.data.orgSlug);

    return {
      ok: true as const,
      result,
    };
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Member could not be deleted.",
      ok: false as const,
    };
  }
}

export async function createNewsletterSubscriber(
  input: NewsletterSubscriberInput,
) {
  const parsed = newsletterSubscriberSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten(),
    };
  }

  const result = await fetchAuthMutation(api.crm.createSubscriber, parsed.data);
  revalidatePath("/dashboard");

  await sendSubscriberWelcomeEmail({
    firstName: parsed.data.fullName.split(/\s+/)[0] ?? "there",
    orgSlug: parsed.data.orgSlug,
    personId: result.personId,
    recipientEmail: parsed.data.email,
  });

  return {
    ok: true as const,
    result,
  };
}

export async function recordManualPayment(input: ManualPaymentInput) {
  const parsed = manualPaymentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten(),
    };
  }

  const result = await fetchAuthMutation(
    api.crm.recordManualPayment,
    parsed.data,
  );
  revalidateOrganizationDashboardPaths(parsed.data.orgSlug);

  return {
    ok: true as const,
    result,
  };
}

export async function sendBulkMemberEmail(input: BulkMemberEmailInput) {
  const parsed = bulkMemberEmailSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten(),
    };
  }

  const crmOverview = await getOrganizationCrmOverview(parsed.data.orgSlug);
  const selectedMemberIds = new Set(parsed.data.memberIds);
  const recipients = crmOverview.members
    .filter((member) => {
      if (!member.email || !member.consentToEmail) {
        return false;
      }

      switch (parsed.data.audience) {
        case "all":
          return true;
        case "active":
        case "pending":
          return member.status === parsed.data.audience;
        case "filtered":
        case "selected":
          return selectedMemberIds.has(member.id);
        default:
          return false;
      }
    })
    .map((member) => ({
      email: member.email,
      firstName: member.firstName || member.name.split(/\s+/)[0] || "there",
      memberId: member.id,
    }));

  if (recipients.length === 0) {
    return {
      message: "No members match that audience filter.",
      ok: false as const,
    };
  }

  const result = await sendBulkMemberBroadcastEmail({
    body: parsed.data.body,
    orgSlug: parsed.data.orgSlug,
    recipients,
    subject: parsed.data.subject,
  });

  revalidateOrganizationDashboardPaths(parsed.data.orgSlug);

  return {
    message:
      result.failed > 0
        ? `Sent ${result.succeeded} emails. ${result.failed} failed.`
        : `Sent ${result.succeeded} emails successfully.`,
    ok: result.succeeded > 0,
  };
}

export async function sendMemberPaymentLink(input: PaymentLinkInput) {
  const parsed = paymentLinkSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten(),
    };
  }

  const crmOverview = await getOrganizationCrmOverview(parsed.data.orgSlug);
  const member = crmOverview.members.find(
    (entry) => entry.id === parsed.data.memberId,
  );

  if (!member || !member.email) {
    return {
      message: "Member email could not be found.",
      ok: false as const,
    };
  }

  if (!member.consentToEmail) {
    return {
      message: "This member cannot be emailed because consent is disabled.",
      ok: false as const,
    };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://f690-91-214-20-140.ngrok-free.app";
  const paymentLink = `${siteUrl}/${parsed.data.orgSlug}/join`;
  const result = await sendBulkMemberBroadcastEmail({
    body:
      "Hi {{firstName}},\n\n" +
      `You can complete your payment securely with Stripe here:\n${paymentLink}\n\n` +
      "If you already paid, you can ignore this email.\n\n" +
      "Best,\n{{organizationName}}",
    orgSlug: parsed.data.orgSlug,
    recipients: [
      {
        email: member.email,
        firstName: member.firstName || member.name.split(/\s+/)[0] || "there",
        memberId: member.id,
      },
    ],
    subject: "Complete your payment for {{organizationName}}",
  });

  revalidateOrganizationDashboardPaths(parsed.data.orgSlug);
  revalidateMemberDetailPath(parsed.data.orgSlug, member.id);

  return {
    message: result.ok ? "Payment link sent." : "Payment link email failed.",
    ok: result.ok,
  };
}

export async function refundMemberPayment(input: RefundPaymentInput) {
  const parsed = refundPaymentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten(),
    };
  }

  const settings = await getOrganizationSettings(parsed.data.orgSlug);
  const crmOverview = await getOrganizationCrmOverview(parsed.data.orgSlug);
  const payment = crmOverview.payments.find(
    (entry) => entry.id === parsed.data.paymentId,
  );

  if (!payment) {
    return {
      message: "Payment not found.",
      ok: false as const,
    };
  }

  if (payment.status !== "succeeded") {
    return {
      message: "Only successful payments can be refunded.",
      ok: false as const,
    };
  }

  if (payment.provider !== "stripe" || !payment.externalPaymentId) {
    return {
      message:
        "Only Stripe payments with a payment intent can be refunded here.",
      ok: false as const,
    };
  }

  try {
    await refundStripePayment({
      connectedAccountId: settings.stripeConnectAccountId,
      paymentIntentId: payment.externalPaymentId,
    });
    await fetchAuthMutation(api.crm.markPaymentRefunded, parsed.data);
    revalidateOrganizationDashboardPaths(parsed.data.orgSlug);

    return {
      ok: true as const,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Refund failed.",
      ok: false as const,
    };
  }
}
