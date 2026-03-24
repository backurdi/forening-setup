import { ConvexError, v } from "convex/values";

import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

const integrationFieldValidator = v.object({
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
});

const integrationFieldSelectionValidator = v.object({
  enabled: v.boolean(),
  key: v.union(
    v.literal("first_name"),
    v.literal("last_name"),
    v.literal("email"),
    v.literal("phone"),
    v.literal("company"),
    v.literal("notes")
  ),
  required: v.boolean()
});

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

export const listForOrganization = query({
  args: {
    orgSlug: v.string()
  },
  handler: async (ctx, args) => {
    const organization = await getAuthorizedOrganization(ctx, args.orgSlug);
    const integrations = await ctx.db
      .query("integrations")
      .withIndex("by_org", (q) => q.eq("organizationId", organization._id))
      .collect();

    return integrations
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((integration) => ({
        _id: integration._id,
        buttonLabel: integration.buttonLabel ?? "Continue",
        destinationType: integration.destinationType,
        destinationUrl: integration.destinationUrl ?? "",
        fieldCount: integration.fields.length,
        fields: integration.fields,
        integrationType: integration.integrationType,
        name: integration.name,
        slug: integration.slug,
        status: integration.status,
        summary: integration.summary ?? "",
        title: integration.title ?? integration.name,
        updatedAt: integration.updatedAt
      }));
  }
});

export const getForOrganization = query({
  args: {
    orgSlug: v.string(),
    slug: v.string()
  },
  handler: async (ctx, args) => {
    const organization = await getAuthorizedOrganization(ctx, args.orgSlug);
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_org_slug", (q) => q.eq("organizationId", organization._id).eq("slug", args.slug))
      .unique();

    if (!integration) {
      throw new ConvexError("Integration not found.");
    }

    return {
      buttonLabel: integration.buttonLabel ?? "Continue",
      destinationType: integration.destinationType,
      destinationUrl: integration.destinationUrl ?? "",
      fields: integration.fields,
      integrationType: integration.integrationType,
      organizationName: organization.name,
      orgSlug: organization.slug,
      status: integration.status,
      summary: integration.summary ?? "",
      title: integration.title ?? integration.name,
      websiteUrl: organization.websiteUrl ?? ""
    };
  }
});

export const saveIntegration = mutation({
  args: {
    buttonLabel: v.optional(v.string()),
    destinationType: v.union(v.literal("stripe_checkout"), v.literal("external_url")),
    destinationUrl: v.optional(v.string()),
    existingSlug: v.optional(v.string()),
    fieldSelections: v.optional(v.array(integrationFieldSelectionValidator)),
    fields: v.array(integrationFieldValidator),
    integrationType: v.union(v.literal("onboarding_button"), v.literal("onboarding_form")),
    name: v.string(),
    orgSlug: v.string(),
    slug: v.string(),
    status: v.union(v.literal("draft"), v.literal("active")),
    summary: v.optional(v.string()),
    title: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const organization = await getAuthorizedOrganization(ctx, args.orgSlug);
    const currentIntegration = args.existingSlug
      ? await ctx.db
          .query("integrations")
          .withIndex("by_org_slug", (q) => q.eq("organizationId", organization._id).eq("slug", args.existingSlug!))
          .unique()
      : null;
    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_org_slug", (q) => q.eq("organizationId", organization._id).eq("slug", args.slug))
      .unique();

    if (existing && existing._id !== currentIntegration?._id) {
      throw new ConvexError("An integration with that slug already exists.");
    }

    if (args.destinationType === "stripe_checkout" && !organization.stripeConnectAccountId) {
      throw new ConvexError("Connect Stripe in Payment settings before creating a Stripe integration.");
    }

    const now = Date.now();

    const payload = {
      buttonLabel: args.buttonLabel,
      destinationType: args.destinationType,
      destinationUrl: args.destinationType === "external_url" ? args.destinationUrl : undefined,
      fields: args.integrationType === "onboarding_form" ? args.fields : [],
      integrationType: args.integrationType,
      name: args.name,
      slug: args.slug,
      status: args.status,
      summary: args.summary,
      title: args.title,
      updatedAt: now
    };

    if (currentIntegration) {
      await ctx.db.patch(currentIntegration._id, payload);

      return {
        integrationId: currentIntegration._id,
        ok: true as const,
        slug: args.slug
      };
    }

    const integrationId = await ctx.db.insert("integrations", {
      ...payload,
      createdAt: now,
      organizationId: organization._id
    });

    return {
      integrationId,
      ok: true as const,
      slug: args.slug
    };
  }
});

export const updateIntegrationStatus = mutation({
  args: {
    orgSlug: v.string(),
    slug: v.string(),
    status: v.union(v.literal("draft"), v.literal("active"))
  },
  handler: async (ctx, args) => {
    const organization = await getAuthorizedOrganization(ctx, args.orgSlug);
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_org_slug", (q) => q.eq("organizationId", organization._id).eq("slug", args.slug))
      .unique();

    if (!integration) {
      throw new ConvexError("Integration not found.");
    }

    if (args.status === "active") {
      if (integration.destinationType === "external_url" && !integration.destinationUrl) {
        throw new ConvexError("Add an external URL before activating this integration.");
      }

      if (integration.destinationType === "stripe_checkout" && !organization.stripeConnectAccountId) {
        throw new ConvexError("Connect Stripe in Payment settings before activating a Stripe integration.");
      }
    }

    await ctx.db.patch(integration._id, {
      status: args.status,
      updatedAt: Date.now()
    });

    return { ok: true as const };
  }
});

export const getPublicIntegration = query({
  args: {
    orgSlug: v.string(),
    slug: v.string()
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .unique();

    if (!organization) {
      return null;
    }

    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_org_slug", (q) => q.eq("organizationId", organization._id).eq("slug", args.slug))
      .unique();

    if (!integration || integration.status !== "active") {
      return null;
    }

    return {
      buttonLabel: integration.buttonLabel ?? "Continue",
      destinationType: integration.destinationType,
      destinationUrl: integration.destinationUrl ?? "",
      fields: integration.fields,
      integrationType: integration.integrationType,
      organizationName: organization.name,
      orgSlug: organization.slug,
      summary: integration.summary ?? "",
      title: integration.title ?? integration.name,
      websiteUrl: organization.websiteUrl ?? ""
    };
  }
});

export const getPreviewIntegration = query({
  args: {
    orgSlug: v.string(),
    slug: v.string()
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .unique();

    if (!organization) {
      return null;
    }

    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_org_slug", (q) => q.eq("organizationId", organization._id).eq("slug", args.slug))
      .unique();

    if (!integration) {
      return null;
    }

    return {
      buttonLabel: integration.buttonLabel ?? "Continue",
      destinationType: integration.destinationType,
      destinationUrl: integration.destinationUrl ?? "",
      fields: integration.fields,
      integrationType: integration.integrationType,
      organizationName: organization.name,
      orgSlug: organization.slug,
      status: integration.status,
      summary: integration.summary ?? "",
      title: integration.title ?? integration.name,
      websiteUrl: organization.websiteUrl ?? ""
    };
  }
});
