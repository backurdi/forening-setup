import { CrmTableCard } from "@/components/dashboard/crm-table-card";
import { PaymentIcon } from "@/components/dashboard/icons";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAdminContext } from "@/lib/server/services/admin";

type PaymentsPageProps = {
  searchParams: Promise<{
    org?: string;
  }>;
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

function getCalendarMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

function getNextCalendarMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const params = await searchParams;
  const { crmOverview } = await getAdminContext(params.org);

  if (!crmOverview) {
    return (
      <main className="admin-main">
        <section className="hero-card">
          <p className="eyebrow">Payments</p>
          <h1 className="headline">No organization selected yet.</h1>
        </section>
      </main>
    );
  }

  const now = new Date();
  const currentMonthStart = getCalendarMonthStart(now);
  const nextMonthStart = getNextCalendarMonthStart(now);
  const previousMonthReference = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthStart = getCalendarMonthStart(previousMonthReference);
  const successfulPayments = crmOverview.payments.filter((payment) => payment.status === "succeeded");
  const currentMonthPayments = crmOverview.payments.filter(
    (payment) => payment.paidAt >= currentMonthStart && payment.paidAt < nextMonthStart
  );
  const previousMonthPayments = crmOverview.payments.filter(
    (payment) => payment.paidAt >= previousMonthStart && payment.paidAt < currentMonthStart
  );
  const paymentDelta = currentMonthPayments.length - previousMonthPayments.length;
  const paymentGrowthPercentage =
    previousMonthPayments.length === 0
      ? currentMonthPayments.length === 0
        ? 0
        : 100
      : (paymentDelta / previousMonthPayments.length) * 100;
  const paymentGrowthLabel = `${paymentGrowthPercentage >= 0 ? "+" : ""}${paymentGrowthPercentage.toFixed(0)}%`;
  const paymentDeltaLabel = `${paymentDelta >= 0 ? "+" : ""}${paymentDelta}`;

  return (
    <main className="admin-main">
      <PageHeader icon={<PaymentIcon />} title="Payments" />

      <section className="stats-grid">
        <article className="stat-card">
          <p className="eyebrow">Revenue</p>
          <p className="stat-value">{currencyFormatter.format(crmOverview.stats.totalPaymentsMinor / 100)}</p>
          <p className="body-copy">
            From {successfulPayments.length} successful {successfulPayments.length === 1 ? "payment" : "payments"}
          </p>
        </article>

        <article className="stat-card">
          <p className="eyebrow">Total payments</p>
          <p className="stat-value">{crmOverview.payments.length}</p>
          <p className="body-copy">All recorded Stripe payments in this workspace</p>
        </article>

        <article className="stat-card">
          <p className="eyebrow">This month vs last month</p>
          <p className="stat-value">{paymentGrowthLabel}</p>
          <p className="body-copy">
            {paymentDeltaLabel} payments vs last month
            {previousMonthPayments.length > 0 || currentMonthPayments.length > 0
              ? ` · ${currentMonthPayments.length} this month and ${previousMonthPayments.length} last month`
              : ""}
          </p>
        </article>
      </section>

      <CrmTableCard
        caption="Payment history"
        columns={["Email", "Amount", "Provider", "Category", "Status", "Date", "Note"]}
        emptyMessage="No payments recorded yet."
        rows={crmOverview.payments.map((payment) => [
          payment.email,
          currencyFormatter.format(payment.amountMinor / 100),
          payment.provider,
          payment.category,
          payment.status,
          formatDate(payment.paidAt),
          payment.note || "—"
        ])}
        title="Payments"
      />
    </main>
  );
}
