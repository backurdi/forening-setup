import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const getPublicOrganizationBySlug = query({
  args: {
    slug: v.string()
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!organization) {
      return null;
    }

    const form = await ctx.db
      .query("publicForms")
      .withIndex("by_org", (q) => q.eq("organizationId", organization._id))
      .first();

    if (!form) {
      return null;
    }

    return {
      defaultCurrency: organization.defaultCurrency ?? "DKK",
      defaultMembershipAmountMinor: organization.defaultMembershipAmountMinor ?? 5000,
      defaultPlanName: form.defaultPlanName,
      description:
        organization.publicDescription ?? form.description ?? "Support the organization through a simple hosted membership flow.",
      formSlug: form.slug,
      headline: organization.publicHeadline ?? form.title,
      name: organization.name,
      paymentProvider: organization.paymentProvider ?? "manual",
      slug: organization.slug
    };
  }
});

export const submitSignup = mutation({
  args: {
    consentToEmail: v.boolean(),
    email: v.string(),
    firstName: v.string(),
    formSlug: v.string(),
    lastName: v.string(),
    phone: v.string()
  },
  handler: async (ctx, args) => {
    const form = await ctx.db
      .query("publicForms")
      .withIndex("by_slug", (q) => q.eq("slug", args.formSlug))
      .unique();

    if (!form) {
      throw new ConvexError("Signup form not found.");
    }

    const organization = await ctx.db.get(form.organizationId);

    if (!organization) {
      throw new ConvexError("Organization not found.");
    }

    const existingPerson = await ctx.db
      .query("people")
      .withIndex("by_org_email", (q) => q.eq("organizationId", organization._id).eq("email", args.email))
      .unique();

    const personId =
      existingPerson?._id ??
      (await ctx.db.insert("people", {
        consentToEmail: args.consentToEmail,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        organizationId: organization._id,
        phone: args.phone
      }));

    if (existingPerson) {
      await ctx.db.patch(existingPerson._id, {
        consentToEmail: args.consentToEmail,
        firstName: args.firstName,
        lastName: args.lastName,
        phone: args.phone
      });
    }

    const existingMember = await ctx.db
      .query("members")
      .withIndex("by_org_person", (q) => q.eq("organizationId", organization._id).eq("personId", personId))
      .unique();

    const memberId =
      existingMember?._id ??
      (await ctx.db.insert("members", {
        organizationId: organization._id,
        personId,
        planName: form.defaultPlanName,
        source: "hosted_form",
        status: "pending"
      }));

    return {
      amountMinor: organization.defaultMembershipAmountMinor ?? 5000,
      currency: organization.defaultCurrency ?? "DKK",
      memberId,
      message: `Thanks for signing up for ${organization.name}. We have registered your membership details.`,
      ok: true as const,
      organizationName: organization.name,
      organizationSlug: organization.slug,
      paymentProvider: organization.paymentProvider ?? "manual",
      personEmail: args.email,
      personId,
      planName: form.defaultPlanName,
      stripeConnectAccountId: organization.stripeConnectAccountId,
      stripePriceId: organization.stripePriceId,
      stripeProductName: organization.stripeProductName
    };
  }
});
