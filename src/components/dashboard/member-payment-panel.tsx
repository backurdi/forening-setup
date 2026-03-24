import { RefundMemberPaymentButton } from "@/components/dashboard/refund-member-payment-button";
import { SendPaymentLinkButton } from "@/components/dashboard/send-payment-link-button";

type MemberPaymentPanelProps = {
  member: {
    email: string;
    id: string;
    name: string;
    planName: string;
    status: "active" | "canceled" | "expired" | "past_due" | "pending";
  };
  orgSlug: string;
  payments: Array<{
    amountMinor: number;
    externalPaymentId: string;
    id: string;
    note: string;
    paidAt: number;
    provider: "manual" | "mobilepay" | "stripe";
    status: "failed" | "pending" | "refunded" | "succeeded";
  }>;
  totalPaidLabel: string;
};

const currencyFormatter = new Intl.NumberFormat("da-DK", {
  currency: "DKK",
  style: "currency"
});

function formatDate(value: number) {
  return new Intl.DateTimeFormat("da-DK", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function MemberPaymentPanel({
  member,
  orgSlug,
  payments,
  totalPaidLabel
}: MemberPaymentPanelProps) {
  const latestPayment = payments[0] ?? null;
  const latestSuccessfulStripePayment =
    payments.find((payment) => payment.status === "succeeded" && payment.provider === "stripe" && payment.externalPaymentId) ?? null;
  const needsAttention =
    member.status === "expired" ||
    member.status === "past_due" ||
    latestPayment?.status === "failed" ||
    latestPayment?.status === "pending";

  return (
    <section className="section-card member-payment-panel">
      <div className="member-payment-header">
        <div className="member-section-heading">
          <p className="eyebrow">Payments</p>
          <h2 className="panel-title">Payment information</h2>
        </div>
        <div className="member-payment-actions">
          <SendPaymentLinkButton
            member={{ email: member.email, id: member.id, name: member.name || member.email }}
            orgSlug={orgSlug}
          />
          {latestSuccessfulStripePayment ? (
            <RefundMemberPaymentButton
              amountLabel={currencyFormatter.format(latestSuccessfulStripePayment.amountMinor / 100)}
              orgSlug={orgSlug}
              paidAtLabel={formatDate(latestSuccessfulStripePayment.paidAt)}
              paymentId={latestSuccessfulStripePayment.id}
            />
          ) : null}
        </div>
      </div>

      {needsAttention ? (
        <div className="member-payment-alert">
          <strong>Billing attention needed</strong>
          <p>
            {member.status === "expired" || member.status === "past_due"
              ? `This member is currently marked ${formatLabel(member.status)}.`
              : latestPayment?.status === "failed"
                ? "The latest Stripe payment failed."
                : "The latest Stripe payment is still pending."}
          </p>
        </div>
      ) : null}

      <div className="member-payment-card-grid">
        <article className="member-payment-card">
          <span>Latest payment</span>
          <strong>{latestPayment ? currencyFormatter.format(latestPayment.amountMinor / 100) : "No payments yet"}</strong>
          <small>
            {latestPayment
              ? `${formatLabel(latestPayment.status)} via ${formatLabel(latestPayment.provider)} on ${formatDate(latestPayment.paidAt)}`
              : "Waiting for the first Stripe charge."}
          </small>
        </article>

        <article className="member-payment-card">
          <span>Total collected</span>
          <strong>{totalPaidLabel}</strong>
          <small>
            {payments.filter((payment) => payment.status === "succeeded").length} successful payment
            {payments.filter((payment) => payment.status === "succeeded").length === 1 ? "" : "s"}
          </small>
        </article>

        <article className="member-payment-card member-payment-card-secure">
          <span>Card details</span>
          <strong>Stored in Stripe</strong>
          <small>We do not keep raw card details here. Sensitive payment data stays inside Stripe.</small>
        </article>
      </div>

      <div className="member-payment-footnote">
        <span>Plan</span>
        <strong>{member.planName}</strong>
        {latestPayment?.note ? <small>{latestPayment.note}</small> : null}
      </div>
    </section>
  );
}
