import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
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

function splitName(name: string) {
  const trimmed = name.trim();

  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ") || "Subscriber"
  };
}

async function upsertPerson(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  input: {
    consentToEmail?: boolean;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }
) {
  const existingPerson = await ctx.db
    .query("people")
    .withIndex("by_org_email", (q) => q.eq("organizationId", organizationId).eq("email", input.email))
    .unique();

  if (existingPerson) {
    await ctx.db.patch(existingPerson._id, {
      consentToEmail: input.consentToEmail ?? existingPerson.consentToEmail,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone || existingPerson.phone
    });

    return existingPerson._id;
  }

  return ctx.db.insert("people", {
    consentToEmail: input.consentToEmail,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    organizationId,
    phone: input.phone
  });
}

export const getOrganizationCrmOverview = query({
  args: {
    slug: v.string()
  },
  handler: async (ctx, args) => {
    const organization = await getAuthorizedOrganization(ctx, args.slug);

    const [members, contacts, payments] = await Promise.all([
      ctx.db.query("members").withIndex("by_org_status", (q) => q.eq("organizationId", organization._id)).collect(),
      ctx.db.query("contacts").withIndex("by_org_kind", (q) => q.eq("organizationId", organization._id)).collect(),
      ctx.db.query("payments").withIndex("by_org_paid_at", (q) => q.eq("organizationId", organization._id)).order("desc").collect()
    ]);
    const emailMessages = await ctx.db
      .query("emailMessages")
      .withIndex("by_org_created_at", (q) => q.eq("organizationId", organization._id))
      .order("desc")
      .collect();

    const typedPersonIds = new Set<Id<"people">>();
    members.forEach((member) => typedPersonIds.add(member.personId));
    contacts.forEach((contact) => typedPersonIds.add(contact.personId));
    payments.forEach((payment) => {
      if (payment.personId) {
        typedPersonIds.add(payment.personId);
      }
    });

    const peopleDocs = await Promise.all([...typedPersonIds].map((personId) => ctx.db.get(personId)));
    const peopleById = new Map(
      peopleDocs
        .filter((person): person is Doc<"people"> => person !== null)
        .map((person) => [person._id, person])
    );
    const membersById = new Map(members.map((member) => [member._id, member]));

    return {
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        supportEmail: organization.supportEmail
      },
      payments: payments.map((payment) => {
        const person = payment.personId ? peopleById.get(payment.personId) : null;
        const member = payment.memberId ? membersById.get(payment.memberId) : null;
        return {
          amountMinor: payment.amountMinor,
          category: payment.category,
          currency: payment.currency,
          email: person?.email ?? "Unlinked",
          id: payment._id,
          memberStatus: member?.status ?? null,
          note: payment.note ?? "",
          paidAt: payment.paidAt,
          provider: payment.provider,
          status: payment.status
        };
      }),
      stats: {
        activeMembers: members.filter((member) => member.status === "active").length,
        newsletterSubscribers: contacts.filter((contact) => contact.kind === "newsletter" && contact.status === "active").length,
        pendingMembers: members.filter((member) => member.status === "pending").length,
        sentEmails: emailMessages.length,
        totalPaymentsMinor: payments.filter((payment) => payment.status === "succeeded").reduce((sum, payment) => sum + payment.amountMinor, 0)
      },
      emails: emailMessages.map((message) => {
        const person = message.personId ? peopleById.get(message.personId) : null;
        return {
          category: message.category,
          createdAt: message.createdAt,
          email: message.recipientEmail,
          externalEmailId: message.externalEmailId ?? "",
          id: message._id,
          name: [person?.firstName, person?.lastName].filter(Boolean).join(" "),
          status: message.status,
          subject: message.subject
        };
      }),
      subscribers: contacts.map((contact) => {
        const person = peopleById.get(contact.personId);
        return {
          email: person?.email ?? "",
          id: contact._id,
          name: [person?.firstName, person?.lastName].filter(Boolean).join(" "),
          source: contact.source,
          status: contact.status
        };
      }),
      members: members.map((member) => {
        const person = peopleById.get(member.personId);
        return {
          email: person?.email ?? "",
          id: member._id,
          name: [person?.firstName, person?.lastName].filter(Boolean).join(" "),
          phone: person?.phone ?? "",
          planName: member.planName,
          source: member.source,
          status: member.status
        };
      })
    };
  }
});

export const createManualMember = mutation({
  args: {
    consentToEmail: v.boolean(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    orgSlug: v.string(),
    phone: v.optional(v.string()),
    planName: v.string(),
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("past_due"), v.literal("canceled"), v.literal("expired"))
  },
  handler: async (ctx, args) => {
    const organization = await getAuthorizedOrganization(ctx, args.orgSlug);
    const personId = await upsertPerson(ctx, organization._id, {
      consentToEmail: args.consentToEmail,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone
    });

    const existingMember = await ctx.db
      .query("members")
      .withIndex("by_org_person", (q) => q.eq("organizationId", organization._id).eq("personId", personId))
      .unique();

    if (existingMember) {
      await ctx.db.patch(existingMember._id, {
        planName: args.planName,
        source: "admin_manual",
        status: args.status
      });

      return { memberId: existingMember._id, ok: true as const, personId };
    }

    const memberId = await ctx.db.insert("members", {
      organizationId: organization._id,
      personId,
      planName: args.planName,
      source: "admin_manual",
      status: args.status
    });

    return { memberId, ok: true as const, personId };
  }
});

export const createSubscriber = mutation({
  args: {
    email: v.string(),
    fullName: v.string(),
    orgSlug: v.string(),
    phone: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const organization = await getAuthorizedOrganization(ctx, args.orgSlug);
    const parsedName = splitName(args.fullName);
    const personId = await upsertPerson(ctx, organization._id, {
      consentToEmail: true,
      email: args.email,
      firstName: parsedName.firstName,
      lastName: parsedName.lastName,
      phone: args.phone
    });

    const existingContact = await ctx.db
      .query("contacts")
      .withIndex("by_org_person_kind", (q) =>
        q.eq("organizationId", organization._id).eq("personId", personId).eq("kind", "newsletter")
      )
      .unique();

    if (existingContact) {
      await ctx.db.patch(existingContact._id, {
        source: "admin_manual",
        status: "active"
      });

      return { contactId: existingContact._id, ok: true as const, personId };
    }

    const contactId = await ctx.db.insert("contacts", {
      kind: "newsletter",
      organizationId: organization._id,
      personId,
      source: "admin_manual",
      status: "active"
    });

    return { contactId, ok: true as const, personId };
  }
});

export const recordManualPayment = mutation({
  args: {
    amountMinor: v.number(),
    category: v.union(v.literal("membership"), v.literal("support"), v.literal("donation")),
    currency: v.string(),
    email: v.string(),
    fullName: v.string(),
    note: v.optional(v.string()),
    orgSlug: v.string(),
    provider: v.union(v.literal("manual"), v.literal("stripe"), v.literal("mobilepay")),
    status: v.union(v.literal("pending"), v.literal("succeeded"), v.literal("failed"), v.literal("refunded"))
  },
  handler: async (ctx, args) => {
    const organization = await getAuthorizedOrganization(ctx, args.orgSlug);
    const parsedName = splitName(args.fullName);
    const personId = await upsertPerson(ctx, organization._id, {
      consentToEmail: true,
      email: args.email,
      firstName: parsedName.firstName,
      lastName: parsedName.lastName
    });

    const member = await ctx.db
      .query("members")
      .withIndex("by_org_person", (q) => q.eq("organizationId", organization._id).eq("personId", personId))
      .unique();

    const paymentId = await ctx.db.insert("payments", {
      amountMinor: args.amountMinor,
      category: args.category,
      currency: args.currency,
      externalCheckoutSessionId: undefined,
      externalCustomerId: undefined,
      externalPaymentId: undefined,
      externalSubscriptionId: undefined,
      memberId: member?._id,
      note: args.note || undefined,
      organizationId: organization._id,
      paidAt: Date.now(),
      personId,
      provider: args.provider,
      status: args.status
    });

    return { ok: true as const, paymentId };
  }
});

export const syncStripeCheckoutCompleted = mutation({
  args: {
    amountMinor: v.number(),
    checkoutSessionId: v.string(),
    currency: v.string(),
    customerId: v.optional(v.string()),
    memberId: v.id("members"),
    paymentIntentId: v.optional(v.string()),
    personId: v.id("people"),
    subscriptionId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    const person = await ctx.db.get(args.personId);

    if (!member || !person) {
      throw new ConvexError("Member or person not found.");
    }

    const organizationId = member.organizationId;
    const existingPayment = await ctx.db
      .query("payments")
      .withIndex("by_external_checkout_session", (q) => q.eq("externalCheckoutSessionId", args.checkoutSessionId))
      .unique();

    if (existingPayment) {
      await ctx.db.patch(existingPayment._id, {
        amountMinor: args.amountMinor,
        currency: args.currency,
        externalCustomerId: args.customerId,
        externalPaymentId: args.paymentIntentId,
        externalSubscriptionId: args.subscriptionId,
        paidAt: Date.now(),
        status: "succeeded"
      });
    } else {
      await ctx.db.insert("payments", {
        amountMinor: args.amountMinor,
        category: "membership",
        currency: args.currency,
        externalCheckoutSessionId: args.checkoutSessionId,
        externalCustomerId: args.customerId,
        externalPaymentId: args.paymentIntentId,
        externalSubscriptionId: args.subscriptionId,
        memberId: member._id,
        note: "Stripe checkout",
        organizationId,
        paidAt: Date.now(),
        personId: person._id,
        provider: "stripe",
        status: "succeeded"
      });
    }

    await ctx.db.patch(member._id, {
      status: "active"
    });

    return {
      ok: true as const,
      organizationId,
      organizationSlug: undefined,
      personEmail: person.email
    };
  }
});
