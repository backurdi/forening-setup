import Stripe from "stripe";
import { describe, expect, it } from "vitest";

import { extractStripeMemberPaymentSyncPayload } from "@/lib/server/payments/stripe-webhook";

describe("extractStripeMemberPaymentSyncPayload", () => {
  it("extracts membership sync data from checkout completion events", () => {
    const payload = extractStripeMemberPaymentSyncPayload({
      data: {
        object: {
          amount_total: 5000,
          currency: "dkk",
          customer: "cus_123",
          customer_email: "member@example.com",
          id: "cs_123",
          metadata: {
            firstName: "Amina",
            memberId: "member_123",
            organizationSlug: "munida",
            personId: "person_123"
          },
          payment_intent: null,
          subscription: "sub_123"
        }
      },
      type: "checkout.session.completed"
    } as unknown as Stripe.Event);

    expect(payload).toEqual({
      amountMinor: 5000,
      checkoutSessionId: "cs_123",
      currency: "DKK",
      customerEmail: "member@example.com",
      customerId: "cus_123",
      firstName: "Amina",
      memberId: "member_123",
      organizationSlug: "munida",
      paymentIntentId: undefined,
      personId: "person_123",
      subscriptionId: "sub_123"
    });
  });

  it("extracts membership sync data from paid invoice events", () => {
    const payload = extractStripeMemberPaymentSyncPayload({
      data: {
        object: {
          amount_due: 5000,
          amount_paid: 5000,
          currency: "dkk",
          customer: "cus_123",
          customer_email: "member@example.com",
          id: "in_123",
          parent: {
            quote_details: null,
            subscription_details: {
              metadata: {
                firstName: "Amina",
                memberId: "member_123",
                organizationSlug: "munida",
                personId: "person_123"
              },
              subscription: "sub_123"
            },
            type: "subscription_details"
          },
          payment_intent: "pi_123",
          subscription: "sub_123"
        }
      },
      type: "invoice.payment_succeeded"
    } as unknown as Stripe.Event);

    expect(payload).toEqual({
      amountMinor: 5000,
      checkoutSessionId: "in_123",
      currency: "DKK",
      customerEmail: "member@example.com",
      customerId: "cus_123",
      firstName: "Amina",
      memberId: "member_123",
      organizationSlug: "munida",
      paymentIntentId: "pi_123",
      personId: "person_123",
      subscriptionId: "sub_123"
    });
  });

  it("returns null when membership metadata is missing", () => {
    const payload = extractStripeMemberPaymentSyncPayload({
      data: {
        object: {
          amount_total: 5000,
          currency: "dkk",
          id: "cs_123",
          metadata: {}
        }
      },
      type: "checkout.session.completed"
    } as unknown as Stripe.Event);

    expect(payload).toBeNull();
  });
});
