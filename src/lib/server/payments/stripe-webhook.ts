import Stripe from "stripe";

import type { Id } from "@convex/_generated/dataModel";

export type StripeMemberPaymentSyncPayload = {
  amountMinor: number;
  checkoutSessionId: string;
  currency: string;
  customerEmail?: string;
  customerId?: string;
  firstName: string;
  memberId: Id<"members">;
  organizationSlug?: string;
  paymentIntentId?: string;
  personId: Id<"people">;
  subscriptionId?: string;
};

type StripeInvoiceWithPaymentReferences = Stripe.Invoice & {
  payment_intent?: string | Stripe.PaymentIntent | null;
  subscription?: string | Stripe.Subscription | null;
};

function readMetadataValue(metadata: Stripe.Metadata | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getInvoiceMetadata(invoice: StripeInvoiceWithPaymentReferences) {
  if (invoice.parent?.type === "subscription_details") {
    return invoice.parent.subscription_details?.metadata;
  }

  return null;
}

function getInvoiceSubscriptionId(invoice: StripeInvoiceWithPaymentReferences) {
  if (typeof invoice.subscription === "string") {
    return invoice.subscription;
  }

  if (invoice.parent?.type === "subscription_details") {
    const subscription = invoice.parent.subscription_details?.subscription;
    return typeof subscription === "string" ? subscription : undefined;
  }

  return undefined;
}

function buildCheckoutSessionPayload(session: Stripe.Checkout.Session): StripeMemberPaymentSyncPayload | null {
  const memberId = readMetadataValue(session.metadata, "memberId");
  const personId = readMetadataValue(session.metadata, "personId");

  if (!memberId || !personId) {
    return null;
  }

  return {
    amountMinor: session.amount_total ?? 0,
    checkoutSessionId: session.id,
    currency: (session.currency ?? "dkk").toUpperCase(),
    customerEmail: session.customer_email ?? undefined,
    customerId: typeof session.customer === "string" ? session.customer : undefined,
    firstName: readMetadataValue(session.metadata, "firstName") ?? "there",
    memberId: memberId as Id<"members">,
    organizationSlug: readMetadataValue(session.metadata, "organizationSlug"),
    paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
    personId: personId as Id<"people">,
    subscriptionId: typeof session.subscription === "string" ? session.subscription : undefined
  };
}

function buildInvoicePayload(rawInvoice: Stripe.Invoice): StripeMemberPaymentSyncPayload | null {
  const invoice = rawInvoice as StripeInvoiceWithPaymentReferences;
  const metadata = getInvoiceMetadata(invoice);
  const memberId = readMetadataValue(metadata, "memberId");
  const personId = readMetadataValue(metadata, "personId");

  if (!memberId || !personId) {
    return null;
  }

  return {
    amountMinor: invoice.amount_paid || invoice.amount_due || 0,
    checkoutSessionId: invoice.id,
    currency: (invoice.currency ?? "dkk").toUpperCase(),
    customerEmail: invoice.customer_email ?? undefined,
    customerId: typeof invoice.customer === "string" ? invoice.customer : undefined,
    firstName: readMetadataValue(metadata, "firstName") ?? "there",
    memberId: memberId as Id<"members">,
    organizationSlug: readMetadataValue(metadata, "organizationSlug"),
    paymentIntentId: typeof invoice.payment_intent === "string" ? invoice.payment_intent : undefined,
    personId: personId as Id<"people">,
    subscriptionId: getInvoiceSubscriptionId(invoice)
  };
}

export function extractStripeMemberPaymentSyncPayload(event: Stripe.Event): StripeMemberPaymentSyncPayload | null {
  switch (event.type) {
    case "checkout.session.completed":
      return buildCheckoutSessionPayload(event.data.object as Stripe.Checkout.Session);
    case "invoice.paid":
    case "invoice.payment_succeeded":
      return buildInvoicePayload(event.data.object as Stripe.Invoice);
    default:
      return null;
  }
}
