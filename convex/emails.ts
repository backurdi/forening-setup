import { ConvexError, v } from "convex/values";

import { mutation } from "./_generated/server";

export const recordEmailMessage = mutation({
  args: {
    bodyPreview: v.optional(v.string()),
    category: v.union(
      v.literal("welcome_member"),
      v.literal("newsletter_subscriber"),
      v.literal("payment_receipt"),
      v.literal("admin_notification"),
      v.literal("member_broadcast")
    ),
    externalEmailId: v.optional(v.string()),
    memberId: v.optional(v.id("members")),
    organizationId: v.id("organizations"),
    personId: v.optional(v.id("people")),
    recipientEmail: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("bounced"),
      v.literal("complained"),
      v.literal("failed")
    ),
    subject: v.string()
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return ctx.db.insert("emailMessages", {
      bodyPreview: args.bodyPreview,
      category: args.category,
      createdAt: now,
      externalEmailId: args.externalEmailId,
      memberId: args.memberId,
      organizationId: args.organizationId,
      personId: args.personId,
      provider: "resend",
      recipientEmail: args.recipientEmail,
      status: args.status,
      subject: args.subject,
      updatedAt: now
    });
  }
});

export const updateEmailMessageStatus = mutation({
  args: {
    errorMessage: v.optional(v.string()),
    externalEmailId: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("bounced"),
      v.literal("complained"),
      v.literal("failed")
    )
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailMessages")
      .withIndex("by_external_email_id", (q) => q.eq("externalEmailId", args.externalEmailId))
      .unique();

    if (!existing) {
      throw new ConvexError("Email message not found.");
    }

    await ctx.db.patch(existing._id, {
      errorMessage: args.errorMessage,
      status: args.status,
      updatedAt: Date.now()
    });

    return { ok: true as const };
  }
});
