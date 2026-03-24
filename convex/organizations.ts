import { ConvexError, v } from "convex/values";

import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

async function requireAuthUserId(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("Unauthenticated");
  }

  return identity.subject;
}

async function getAuthorizedOrganization(ctx: QueryCtx | MutationCtx, slug: string) {
  const authUserId = await requireAuthUserId(ctx);
  const organization = await ctx.db
    .query("organizations")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();

  if (!organization) {
    throw new ConvexError("Organization not found.");
  }

  const membership = await ctx.db
    .query("organizationUsers")
    .withIndex("by_org_auth_user", (q) => q.eq("organizationId", organization._id).eq("authUserId", authUserId))
    .unique();

  if (!membership) {
    throw new ConvexError("Unauthorized.");
  }

  return organization;
}

export const listForViewer = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await requireAuthUserId(ctx);
    const memberships = await ctx.db
      .query("organizationUsers")
      .withIndex("by_auth_user", (q) => q.eq("authUserId", authUserId))
      .collect();

    const organizations = await Promise.all(
      memberships.map(async (membership) => {
        const organization = await ctx.db.get(membership.organizationId);

        if (!organization) {
          return null;
        }

        return {
          id: organization._id,
          name: organization.name,
          role: membership.role,
          slug: organization.slug,
          summary:
            organization.publicDescription ??
            "Member CRM, billing, and hosted forms will be configured for this organization."
        };
      })
    );

    return organizations.filter((organization) => organization !== null);
  }
});

export const createOrganization = mutation({
  args: {
    defaultPlanName: v.optional(v.string()),
    name: v.string(),
    primaryColor: v.string(),
    publicDescription: v.optional(v.string()),
    publicHeadline: v.optional(v.string()),
    slug: v.string(),
    supportEmail: v.string(),
    websiteUrl: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      throw new ConvexError("An organization with that slug already exists.");
    }

    const organizationId = await ctx.db.insert("organizations", {
      adminNotificationEmail: args.supportEmail,
      brandPrimaryColor: args.primaryColor,
      defaultCurrency: "DKK",
      defaultMembershipAmountMinor: 5000,
      emailFromAddress: args.supportEmail,
      emailFromName: args.name,
      emailReplyTo: args.supportEmail,
      name: args.name,
      paymentProvider: "manual",
      publicDescription: args.publicDescription || undefined,
      publicHeadline: args.publicHeadline || undefined,
      slug: args.slug,
      stripeProductName: args.defaultPlanName || "Monthly member",
      subscriberEmailBody:
        "Hi {{firstName}}, thanks for subscribing to updates from {{organizationName}}. We will keep you posted.",
      subscriberEmailEnabled: true,
      subscriberEmailSubject: "You're on the list for {{organizationName}}",
      supportEmail: args.supportEmail,
      welcomeEmailBody:
        "Hi {{firstName}}, welcome to {{organizationName}}. We have your membership details and will reach out if we need anything else.",
      welcomeEmailEnabled: true,
      welcomeEmailSubject: "Welcome to {{organizationName}}",
      websiteUrl: args.websiteUrl || undefined
    });

    await ctx.db.insert("organizationUsers", {
      authUserId,
      organizationId,
      role: "owner"
    });

    await ctx.db.insert("publicForms", {
      defaultPlanName: args.defaultPlanName || "Monthly member",
      description: args.publicDescription || "Join the organization through this hosted membership form.",
      organizationId,
      slug: `${args.slug}-join`,
      submitLabel: "Continue",
      title: args.publicHeadline || `Join ${args.name}`
    });

    return {
      organizationId,
      slug: args.slug
    };
  }
});

export const getOrganizationSettings = query({
  args: {
    slug: v.string()
  },
  handler: async (ctx, args) => {
    const organization = await getAuthorizedOrganization(ctx, args.slug);
    const form = await ctx.db
      .query("publicForms")
      .withIndex("by_org", (q) => q.eq("organizationId", organization._id))
      .first();

    return {
      defaultCurrency: organization.defaultCurrency ?? "DKK",
      defaultMembershipAmountMinor: organization.defaultMembershipAmountMinor ?? 5000,
      defaultPlanName: form?.defaultPlanName ?? "Monthly member",
      emailFromAddress: organization.emailFromAddress ?? "",
      emailFromName: organization.emailFromName ?? "",
      emailReplyTo: organization.emailReplyTo ?? "",
      adminNotificationEmail: organization.adminNotificationEmail ?? "",
      name: organization.name,
      paymentProvider: organization.paymentProvider ?? "manual",
      primaryColor: organization.brandPrimaryColor ?? "#7c4a21",
      publicDescription: organization.publicDescription ?? "",
      publicHeadline: organization.publicHeadline ?? "",
      slug: organization.slug,
      stripeConnectAccountId: organization.stripeConnectAccountId ?? "",
      stripePriceId: organization.stripePriceId ?? "",
      stripeProductName: organization.stripeProductName ?? form?.defaultPlanName ?? "Monthly member",
      subscriberEmailBody: organization.subscriberEmailBody ?? "",
      subscriberEmailEnabled: organization.subscriberEmailEnabled ?? true,
      subscriberEmailSubject: organization.subscriberEmailSubject ?? "",
      supportEmail: organization.supportEmail,
      welcomeEmailBody: organization.welcomeEmailBody ?? "",
      welcomeEmailEnabled: organization.welcomeEmailEnabled ?? true,
      welcomeEmailSubject: organization.welcomeEmailSubject ?? "",
      websiteUrl: organization.websiteUrl ?? ""
    };
  }
});

export const getStripeConnectSetup = query({
  args: {
    slug: v.string()
  },
  handler: async (ctx, args) => {
    const organization = await getAuthorizedOrganization(ctx, args.slug);

    return {
      defaultCurrency: organization.defaultCurrency ?? "DKK",
      name: organization.name,
      slug: organization.slug,
      stripeConnectAccountId: organization.stripeConnectAccountId ?? "",
      supportEmail: organization.supportEmail,
      websiteUrl: organization.websiteUrl ?? ""
    };
  }
});

export const saveStripeConnectAccount = mutation({
  args: {
    orgSlug: v.string(),
    stripeConnectAccountId: v.string()
  },
  handler: async (ctx, args) => {
    const organization = await getAuthorizedOrganization(ctx, args.orgSlug);

    await ctx.db.patch(organization._id, {
      stripeConnectAccountId: args.stripeConnectAccountId
    });

    return {
      ok: true as const,
      stripeConnectAccountId: args.stripeConnectAccountId
    };
  }
});

export const getOrganizationMailProfile = query({
  args: {
    slug: v.string()
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!organization) {
      throw new ConvexError("Organization not found.");
    }

    return {
      adminNotificationEmail: organization.adminNotificationEmail ?? "",
      emailFromAddress: organization.emailFromAddress ?? organization.supportEmail,
      emailFromName: organization.emailFromName ?? organization.name,
      emailReplyTo: organization.emailReplyTo ?? organization.supportEmail,
      name: organization.name,
      organizationId: organization._id,
      slug: organization.slug,
      subscriberEmailBody: organization.subscriberEmailBody ?? "",
      subscriberEmailEnabled: organization.subscriberEmailEnabled ?? true,
      subscriberEmailSubject: organization.subscriberEmailSubject ?? "",
      supportEmail: organization.supportEmail,
      welcomeEmailBody: organization.welcomeEmailBody ?? "",
      welcomeEmailEnabled: organization.welcomeEmailEnabled ?? true,
      welcomeEmailSubject: organization.welcomeEmailSubject ?? ""
    };
  }
});

export const updateGeneralSettings = mutation({
  args: {
    defaultPlanName: v.string(),
    name: v.string(),
    orgSlug: v.string(),
    primaryColor: v.string(),
    publicDescription: v.optional(v.string()),
    publicHeadline: v.optional(v.string()),
    supportEmail: v.string(),
    websiteUrl: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const organization = await getAuthorizedOrganization(ctx, args.orgSlug);
    const form = await ctx.db
      .query("publicForms")
      .withIndex("by_org", (q) => q.eq("organizationId", organization._id))
      .first();

    await ctx.db.patch(organization._id, {
      adminNotificationEmail: organization.adminNotificationEmail ?? args.supportEmail,
      brandPrimaryColor: args.primaryColor,
      emailFromAddress: organization.emailFromAddress ?? args.supportEmail,
      emailReplyTo: organization.emailReplyTo ?? args.supportEmail,
      name: args.name,
      publicDescription: args.publicDescription || undefined,
      publicHeadline: args.publicHeadline || undefined,
      supportEmail: args.supportEmail,
      websiteUrl: args.websiteUrl || undefined
    });

    if (form) {
      await ctx.db.patch(form._id, {
        defaultPlanName: args.defaultPlanName,
        description: args.publicDescription || form.description,
        title: args.publicHeadline || form.title
      });
    }

    return { ok: true as const };
  }
});

export const updatePaymentSettings = mutation({
  args: {
    defaultCurrency: v.string(),
    defaultMembershipAmountMinor: v.number(),
    defaultPlanName: v.string(),
    orgSlug: v.string(),
    paymentProvider: v.union(v.literal("manual"), v.literal("stripe")),
    stripePriceId: v.optional(v.string()),
    stripeProductName: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const organization = await getAuthorizedOrganization(ctx, args.orgSlug);
    const form = await ctx.db
      .query("publicForms")
      .withIndex("by_org", (q) => q.eq("organizationId", organization._id))
      .first();

    if (args.paymentProvider === "stripe" && !organization.stripeConnectAccountId) {
      throw new ConvexError("Connect Stripe before enabling Stripe checkout.");
    }

    await ctx.db.patch(organization._id, {
      defaultCurrency: args.defaultCurrency,
      defaultMembershipAmountMinor: args.defaultMembershipAmountMinor,
      paymentProvider: args.paymentProvider,
      stripePriceId: args.stripePriceId || undefined,
      stripeProductName: args.stripeProductName || args.defaultPlanName
    });

    if (form) {
      await ctx.db.patch(form._id, {
        defaultPlanName: args.defaultPlanName
      });
    }

    return { ok: true as const };
  }
});

export const updateEmailSettings = mutation({
  args: {
    adminNotificationEmail: v.optional(v.string()),
    emailFromAddress: v.optional(v.string()),
    emailFromName: v.optional(v.string()),
    emailReplyTo: v.optional(v.string()),
    orgSlug: v.string(),
    subscriberEmailBody: v.optional(v.string()),
    subscriberEmailEnabled: v.boolean(),
    subscriberEmailSubject: v.optional(v.string()),
    welcomeEmailBody: v.optional(v.string()),
    welcomeEmailEnabled: v.boolean(),
    welcomeEmailSubject: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const organization = await getAuthorizedOrganization(ctx, args.orgSlug);

    await ctx.db.patch(organization._id, {
      adminNotificationEmail: args.adminNotificationEmail || undefined,
      emailFromAddress: args.emailFromAddress || undefined,
      emailFromName: args.emailFromName || undefined,
      emailReplyTo: args.emailReplyTo || undefined,
      subscriberEmailBody: args.subscriberEmailBody || undefined,
      subscriberEmailEnabled: args.subscriberEmailEnabled,
      subscriberEmailSubject: args.subscriberEmailSubject || undefined,
      welcomeEmailBody: args.welcomeEmailBody || undefined,
      welcomeEmailEnabled: args.welcomeEmailEnabled,
      welcomeEmailSubject: args.welcomeEmailSubject || undefined
    });

    return { ok: true as const };
  }
});
