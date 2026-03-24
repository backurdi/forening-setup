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

export async function createStripeMembershipCheckout(input: {
  amountMinor: number;
  cancelUrl: string;
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
