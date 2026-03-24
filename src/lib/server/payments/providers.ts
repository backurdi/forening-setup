export type BillingProvider = "stripe" | "mobilepay";

export type NormalizedPaymentEvent = {
  provider: BillingProvider;
  externalEventId: string;
  externalCustomerId?: string;
  externalSubscriptionId?: string;
  externalPaymentId?: string;
  status: "pending" | "succeeded" | "failed" | "canceled" | "refunded";
  amountMinor?: number;
  currency?: string;
  occurredAt: string;
  rawPayload: unknown;
};

export function normalizeProviderEvent(event: NormalizedPaymentEvent) {
  return event;
}
