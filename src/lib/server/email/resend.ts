import { Resend } from "resend";

import { fetchPublicMutation, fetchPublicQuery } from "@/lib/server/convex/client";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

type EmailCategory =
  | "welcome_member"
  | "newsletter_subscriber"
  | "payment_receipt"
  | "admin_notification"
  | "member_broadcast";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

function renderTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => variables[key] ?? "");
}

async function getMailProfile(orgSlug: string) {
  return fetchPublicQuery(api.organizations.getOrganizationMailProfile, { slug: orgSlug });
}

async function recordEmailMessage(input: {
  bodyPreview: string;
  category: EmailCategory;
  externalEmailId?: string;
  memberId?: Id<"members">;
  organizationId: Id<"organizations">;
  personId?: Id<"people">;
  recipientEmail: string;
  status: "sent" | "failed";
  subject: string;
}) {
  await fetchPublicMutation(api.emails.recordEmailMessage, input);
}

async function sendOrganizationEmail(input: {
  bodyTemplate: string;
  category: EmailCategory;
  memberId?: Id<"members">;
  orgSlug: string;
  personId?: Id<"people">;
  recipientEmail: string;
  subjectTemplate: string;
  variables: Record<string, string>;
}) {
  const resend = getResendClient();

  if (!resend) {
    return {
      message: "RESEND_API_KEY is not configured.",
      ok: false as const
    };
  }

  const profile = await getMailProfile(input.orgSlug);
  const subject = renderTemplate(input.subjectTemplate, input.variables);
  const html = renderTemplate(input.bodyTemplate, input.variables).replace(/\n/g, "<br />");
  const text = renderTemplate(input.bodyTemplate, input.variables);

  try {
    const response = await resend.emails.send({
      from: `${profile.emailFromName} <${profile.emailFromAddress}>`,
      html,
      replyTo: profile.emailReplyTo || undefined,
      subject,
      text,
      to: input.recipientEmail
    });

    await recordEmailMessage({
      bodyPreview: text.slice(0, 220),
      category: input.category,
      externalEmailId: response.data?.id,
      memberId: input.memberId,
      organizationId: profile.organizationId,
      personId: input.personId,
      recipientEmail: input.recipientEmail,
      status: "sent",
      subject
    });

    return { ok: true as const };
  } catch (error) {
    await recordEmailMessage({
      bodyPreview: text.slice(0, 220),
      category: input.category,
      memberId: input.memberId,
      organizationId: profile.organizationId,
      personId: input.personId,
      recipientEmail: input.recipientEmail,
      status: "failed",
      subject
    });

    return {
      message: error instanceof Error ? error.message : "Email send failed.",
      ok: false as const
    };
  }
}

export async function sendWelcomeMemberEmail(input: {
  firstName: string;
  memberId?: Id<"members">;
  orgSlug: string;
  personId?: Id<"people">;
  recipientEmail: string;
}) {
  const profile = await getMailProfile(input.orgSlug);

  if (!profile.welcomeEmailEnabled || !profile.welcomeEmailSubject || !profile.welcomeEmailBody) {
    return { ok: true as const, skipped: true as const };
  }

  return sendOrganizationEmail({
    bodyTemplate: profile.welcomeEmailBody,
    category: "welcome_member",
    memberId: input.memberId,
    orgSlug: input.orgSlug,
    personId: input.personId,
    recipientEmail: input.recipientEmail,
    subjectTemplate: profile.welcomeEmailSubject,
    variables: {
      firstName: input.firstName,
      organizationName: profile.name,
      supportEmail: profile.supportEmail
    }
  });
}

export async function sendSubscriberWelcomeEmail(input: {
  firstName: string;
  orgSlug: string;
  personId?: Id<"people">;
  recipientEmail: string;
}) {
  const profile = await getMailProfile(input.orgSlug);

  if (!profile.subscriberEmailEnabled || !profile.subscriberEmailSubject || !profile.subscriberEmailBody) {
    return { ok: true as const, skipped: true as const };
  }

  return sendOrganizationEmail({
    bodyTemplate: profile.subscriberEmailBody,
    category: "newsletter_subscriber",
    orgSlug: input.orgSlug,
    personId: input.personId,
    recipientEmail: input.recipientEmail,
    subjectTemplate: profile.subscriberEmailSubject,
    variables: {
      firstName: input.firstName,
      organizationName: profile.name,
      supportEmail: profile.supportEmail
    }
  });
}

export async function sendTestOrganizationEmail(orgSlug: string, recipientEmail: string) {
  const profile = await getMailProfile(orgSlug);

  return sendOrganizationEmail({
    bodyTemplate:
      profile.welcomeEmailBody ||
      "Hi {{firstName}}, this is a test email from {{organizationName}}. Reply to {{supportEmail}} if anything looks wrong.",
    category: "admin_notification",
    orgSlug,
    recipientEmail,
    subjectTemplate: `Test email from ${profile.name}`,
    variables: {
      firstName: "there",
      organizationName: profile.name,
      supportEmail: profile.supportEmail
    }
  });
}

export async function sendBulkMemberBroadcastEmail(input: {
  body: string;
  orgSlug: string;
  recipients: Array<{
    email: string;
    firstName: string;
    memberId?: Id<"members">;
    personId?: Id<"people">;
  }>;
  subject: string;
}) {
  const profile = await getMailProfile(input.orgSlug);

  const results = await Promise.all(
    input.recipients.map((recipient) =>
      sendOrganizationEmail({
        bodyTemplate: input.body,
        category: "member_broadcast",
        memberId: recipient.memberId,
        orgSlug: input.orgSlug,
        personId: recipient.personId,
        recipientEmail: recipient.email,
        subjectTemplate: input.subject,
        variables: {
          firstName: recipient.firstName || "there",
          organizationName: profile.name,
          supportEmail: profile.supportEmail
        }
      })
    )
  );

  const succeeded = results.filter((result) => result.ok).length;
  const failed = results.length - succeeded;

  return {
    failed,
    ok: failed === 0,
    succeeded,
    total: results.length
  };
}

export async function updateEmailMessageStatus(input: {
  externalEmailId: string;
  errorMessage?: string;
  status: "queued" | "sent" | "delivered" | "bounced" | "complained" | "failed";
}) {
  return fetchPublicMutation(api.emails.updateEmailMessageStatus, input);
}
