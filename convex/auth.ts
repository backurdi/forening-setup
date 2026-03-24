import { ConvexError, v } from "convex/values";

import { query } from "./_generated/server";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError("Unauthenticated");
    }

    const memberships = await ctx.db
      .query("organizationUsers")
      .withIndex("by_auth_user", (q) => q.eq("authUserId", identity.subject))
      .collect();

    return {
      organizationIds: memberships.map((membership) => membership.organizationId),
      organizationRoles: memberships.map((membership) => ({
        organizationId: membership.organizationId,
        role: membership.role
      })),
      userId: identity.subject
    };
  }
});
