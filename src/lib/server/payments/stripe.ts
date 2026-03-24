import Stripe from "stripe";

import type { Id } from "@convex/_generated/dataModel";

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey);
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}

export async function createStripeConnectOnboardingLink(input: {
  defaultCurrency: string;
  existingAccountId?: string;
  organizationName: string;
  orgSlug: string;
  returnUrl: string;
  supportEmail: string;
  websiteUrl?: string;
}) {
  const stripe = getStripeClient();

  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  const accountId =
    input.existingAccountId ||
    (
      await stripe.accounts.create({
        business_profile: {
          name: input.organizationName,
          support_email: input.supportEmail,
          url: input.websiteUrl || undefined
        },
        capabilities: {
          card_payments: {
            requested: true
          },
          transfers: {
            requested: true
          }
        },
        default_currency: input.defaultCurrency.toLowerCase(),
        email: input.supportEmail,
        metadata: {
          organizationName: input.organizationName,
          organizationSlug: input.orgSlug
        },
        type: "standard"
      })
    ).id;

  const refreshUrl = new URL("/api/stripe/connect/onboarding", input.returnUrl);
  refreshUrl.searchParams.set("org", input.orgSlug);

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    collection_options: {
      fields: "eventually_due",
      future_requirements: "include"
    },
    refresh_url: refreshUrl.toString(),
    return_url: input.returnUrl,
    type: "account_onboarding"
  });

  return {
    accountId,
    url: accountLink.url
  };
}

export async function getStripeConnectAccountStatus(accountId: string) {
  const stripe = getStripeClient();

  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  const account = await stripe.accounts.retrieve(accountId);

  return {
    chargesEnabled: account.charges_enabled,
    detailsSubmitted: account.details_submitted,
    payoutsEnabled: account.payouts_enabled,
    requirementsDueCount: account.requirements?.currently_due?.length ?? 0
  };
}

export async function createStripeMembershipCheckout(input: {
  amountMinor: number;
  cancelUrl: string;
  connectedAccountId?: string;
  currency: string;
  customerEmail: string;
  firstName: string;
  memberId: Id<"members">;
  organizationName: string;
  organizationSlug: string;
  personId: Id<"people">;
  planName: string;
  priceId?: string;
  productName?: string;
  successUrl: string;
}) {
  const stripe = getStripeClient();

  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!input.connectedAccountId) {
    throw new Error("Stripe is not connected for this organization yet.");
  }

  const session = await stripe.checkout.sessions.create({
    cancel_url: input.cancelUrl,
    customer_email: input.customerEmail,
    line_items: input.priceId
      ? [
          {
            price: input.priceId,
            quantity: 1
          }
        ]
      : [
          {
            price_data: {
              currency: input.currency.toLowerCase(),
              product_data: {
                name: input.productName || input.planName
              },
              recurring: {
                interval: "month"
              },
              unit_amount: input.amountMinor
            },
            quantity: 1
          }
        ],
    metadata: {
      firstName: input.firstName,
      memberId: input.memberId,
      organizationName: input.organizationName,
      organizationSlug: input.organizationSlug,
      personId: input.personId,
      planName: input.planName
    },
    mode: "subscription",
    subscription_data: {
      metadata: {
        firstName: input.firstName,
        memberId: input.memberId,
        organizationName: input.organizationName,
        organizationSlug: input.organizationSlug,
        personId: input.personId,
        planName: input.planName
      }
    },
    success_url: input.successUrl
  }, {
    stripeAccount: input.connectedAccountId
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return session;
}

export async function constructStripeEvent(payload: string, signature: string) {
  const stripe = getStripeClient();
  const webhookSecret = getStripeWebhookSecret();

  if (!stripe || !webhookSecret) {
    throw new Error("Stripe webhook credentials are not configured.");
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
