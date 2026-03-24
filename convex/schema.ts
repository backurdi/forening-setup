import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  organizations: defineTable({
    brandPrimaryColor: v.optional(v.string()),
    defaultCurrency: v.optional(v.string()),
    defaultMembershipAmountMinor: v.optional(v.number()),
    paymentProvider: v.optional(v.union(v.literal("manual"), v.literal("stripe"))),
    name: v.string(),
    publicDescription: v.optional(v.string()),
    publicHeadline: v.optional(v.string()),
    slug: v.string(),
    stripeConnectAccountId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    stripeProductName: v.optional(v.string()),
    supportEmail: v.string(),
    adminNotificationEmail: v.optional(v.string()),
    emailFromAddress: v.optional(v.string()),
    emailFromName: v.optional(v.string()),
    emailReplyTo: v.optional(v.string()),
    subscriberEmailBody: v.optional(v.string()),
    subscriberEmailEnabled: v.optional(v.boolean()),
    subscriberEmailSubject: v.optional(v.string()),
    welcomeEmailBody: v.optional(v.string()),
    welcomeEmailEnabled: v.optional(v.boolean()),
    welcomeEmailSubject: v.optional(v.string()),
    websiteUrl: v.optional(v.string())
  }).index("by_slug", ["slug"]),
  organizationUsers: defineTable({
    authUserId: v.string(),
    organizationId: v.id("organizations"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("support"))
  })
    .index("by_auth_user", ["authUserId"])
    .index("by_org_auth_user", ["organizationId", "authUserId"]),
  publicForms: defineTable({
    defaultPlanName: v.string(),
    description: v.optional(v.string()),
    organizationId: v.id("organizations"),
    slug: v.string(),
    submitLabel: v.optional(v.string()),
    title: v.string()
  })
    .index("by_org", ["organizationId"])
    .index("by_slug", ["slug"]),
  integrations: defineTable({
    buttonLabel: v.optional(v.string()),
    createdAt: v.number(),
    destinationType: v.union(v.literal("stripe_checkout"), v.literal("external_url")),
    destinationUrl: v.optional(v.string()),
    fields: v.array(
      v.object({
        fieldType: v.union(v.literal("text"), v.literal("email"), v.literal("phone"), v.literal("textarea")),
        key: v.union(
          v.literal("first_name"),
          v.literal("last_name"),
          v.literal("email"),
          v.literal("phone"),
          v.literal("company"),
          v.literal("notes")
        ),
        label: v.string(),
        required: v.boolean()
      })
    ),
    integrationType: v.union(v.literal("onboarding_button"), v.literal("onboarding_form")),
    name: v.string(),
    organizationId: v.id("organizations"),
    slug: v.string(),
    status: v.union(v.literal("draft"), v.literal("active")),
    summary: v.optional(v.string()),
    title: v.optional(v.string()),
    updatedAt: v.number()
  })
    .index("by_org", ["organizationId"])
    .index("by_org_slug", ["organizationId", "slug"]),
  people: defineTable({
    consentToEmail: v.optional(v.boolean()),
    organizationId: v.id("organizations"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string())
  }).index("by_org_email", ["organizationId", "email"]),
  contacts: defineTable({
    organizationId: v.id("organizations"),
    personId: v.id("people"),
    kind: v.union(v.literal("newsletter"), v.literal("lead"), v.literal("supporter")),
    source: v.union(v.literal("website"), v.literal("admin_manual"), v.literal("import")),
    status: v.union(v.literal("active"), v.literal("inactive"))
  })
    .index("by_org_kind", ["organizationId", "kind"])
    .index("by_org_person_kind", ["organizationId", "personId", "kind"]),
  members: defineTable({
    organizationId: v.id("organizations"),
    personId: v.id("people"),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("expired")
    ),
    planName: v.string(),
    source: v.union(v.literal("hosted_form"), v.literal("embed"), v.literal("admin_manual"), v.literal("admin_import"))
  })
    .index("by_org_person", ["organizationId", "personId"])
    .index("by_org_status", ["organizationId", "status"]),
  payments: defineTable({
    organizationId: v.id("organizations"),
    personId: v.optional(v.id("people")),
    memberId: v.optional(v.id("members")),
    provider: v.union(v.literal("manual"), v.literal("stripe"), v.literal("mobilepay")),
    status: v.union(v.literal("pending"), v.literal("succeeded"), v.literal("failed"), v.literal("refunded")),
    category: v.union(v.literal("membership"), v.literal("support"), v.literal("donation")),
    amountMinor: v.number(),
    currency: v.string(),
    externalCheckoutSessionId: v.optional(v.string()),
    externalCustomerId: v.optional(v.string()),
    externalPaymentId: v.optional(v.string()),
    externalSubscriptionId: v.optional(v.string()),
    note: v.optional(v.string()),
    paidAt: v.number()
  })
    .index("by_org_paid_at", ["organizationId", "paidAt"])
    .index("by_org_member", ["organizationId", "memberId"])
    .index("by_external_checkout_session", ["externalCheckoutSessionId"])
    .index("by_external_payment_id", ["externalPaymentId"]),
  emailMessages: defineTable({
    bodyPreview: v.optional(v.string()),
    category: v.union(
      v.literal("welcome_member"),
      v.literal("newsletter_subscriber"),
      v.literal("payment_receipt"),
      v.literal("admin_notification"),
      v.literal("member_broadcast")
    ),
    createdAt: v.number(),
    errorMessage: v.optional(v.string()),
    externalEmailId: v.optional(v.string()),
    memberId: v.optional(v.id("members")),
    organizationId: v.id("organizations"),
    personId: v.optional(v.id("people")),
    provider: v.literal("resend"),
    recipientEmail: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("bounced"),
      v.literal("complained"),
      v.literal("failed")
    ),
    subject: v.string(),
    updatedAt: v.number()
  })
    .index("by_org_created_at", ["organizationId", "createdAt"])
    .index("by_external_email_id", ["externalEmailId"])
});
