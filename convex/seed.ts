import { mutation } from "./_generated/server";

export const seedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", "demo-union"))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        adminNotificationEmail: existing.adminNotificationEmail ?? "demo-union@example.com",
        defaultCurrency: existing.defaultCurrency ?? "DKK",
        defaultMembershipAmountMinor: existing.defaultMembershipAmountMinor ?? 7900,
        emailFromAddress: existing.emailFromAddress ?? "demo-union@example.com",
        emailFromName: existing.emailFromName ?? "Demo Union",
        emailReplyTo: existing.emailReplyTo ?? "demo-union@example.com",
        paymentProvider: existing.paymentProvider ?? "stripe",
        stripeProductName: existing.stripeProductName ?? "Monthly member",
        subscriberEmailBody: existing.subscriberEmailBody ?? "Hi {{firstName}}, thanks for subscribing to updates from {{organizationName}}.",
        subscriberEmailEnabled: existing.subscriberEmailEnabled ?? true,
        subscriberEmailSubject: existing.subscriberEmailSubject ?? "You're on the list for {{organizationName}}",
        welcomeEmailBody: existing.welcomeEmailBody ?? "Hi {{firstName}}, welcome to {{organizationName}}.",
        welcomeEmailEnabled: existing.welcomeEmailEnabled ?? true,
        welcomeEmailSubject: existing.welcomeEmailSubject ?? "Welcome to {{organizationName}}"
      });

      return {
        ok: true as const,
        organizationId: existing._id,
        slug: existing.slug
      };
    }

    const organizationId = await ctx.db.insert("organizations", {
      adminNotificationEmail: "demo-union@example.com",
      brandPrimaryColor: "#7c4a21",
      defaultCurrency: "DKK",
      defaultMembershipAmountMinor: 7900,
      emailFromAddress: "demo-union@example.com",
      emailFromName: "Demo Union",
      emailReplyTo: "demo-union@example.com",
      name: "Demo Union",
      paymentProvider: "stripe",
      publicDescription: "A demo organization used to test the hosted membership signup flow.",
      publicHeadline: "Support the union with a simple monthly membership.",
      slug: "demo-union",
      stripeProductName: "Monthly member",
      subscriberEmailBody: "Hi {{firstName}}, thanks for subscribing to updates from {{organizationName}}.",
      subscriberEmailEnabled: true,
      subscriberEmailSubject: "You're on the list for {{organizationName}}",
      supportEmail: "demo-union@example.com",
      welcomeEmailBody: "Hi {{firstName}}, welcome to {{organizationName}}.",
      welcomeEmailEnabled: true,
      welcomeEmailSubject: "Welcome to {{organizationName}}",
      websiteUrl: "https://example.com"
    });

    await ctx.db.insert("publicForms", {
      defaultPlanName: "Monthly member",
      description: "Join the demo union using the hosted form.",
      organizationId,
      slug: "demo-union-join",
      submitLabel: "Continue",
      title: "Join Demo Union"
    });

    const memberPersonId = await ctx.db.insert("people", {
      consentToEmail: true,
      email: "member@demo-union.dk",
      firstName: "Amina",
      lastName: "Sørensen",
      organizationId,
      phone: "28123456"
    });

    const memberId = await ctx.db.insert("members", {
      organizationId,
      personId: memberPersonId,
      planName: "Monthly member",
      source: "admin_manual",
      status: "active"
    });

    const subscriberPersonId = await ctx.db.insert("people", {
      consentToEmail: true,
      email: "subscriber@demo-union.dk",
      firstName: "Jonas",
      lastName: "Mikkelsen",
      organizationId,
      phone: "28765432"
    });

    await ctx.db.insert("contacts", {
      kind: "newsletter",
      organizationId,
      personId: subscriberPersonId,
      source: "admin_manual",
      status: "active"
    });

    await ctx.db.insert("payments", {
      amountMinor: 7900,
      category: "membership",
      currency: "DKK",
      externalCheckoutSessionId: undefined,
      externalCustomerId: undefined,
      externalPaymentId: undefined,
      externalSubscriptionId: undefined,
      memberId,
      note: "Imported opening payment",
      organizationId,
      paidAt: Date.now() - 86400000,
      personId: memberPersonId,
      provider: "manual",
      status: "succeeded"
    });

    await ctx.db.insert("emailMessages", {
      bodyPreview: "Hi Amina, welcome to Demo Union.",
      category: "welcome_member",
      createdAt: Date.now() - 3600000,
      externalEmailId: "email_demo_welcome",
      memberId,
      organizationId,
      personId: memberPersonId,
      provider: "resend",
      recipientEmail: "member@demo-union.dk",
      status: "delivered",
      subject: "Welcome to Demo Union",
      updatedAt: Date.now() - 3500000
    });

    return {
      ok: true as const,
      organizationId,
      slug: "demo-union"
    };
  }
});
