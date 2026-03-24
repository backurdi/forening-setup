import { ActionDialog } from "@/components/dashboard/action-dialog";
import { CrmTableCard } from "@/components/dashboard/crm-table-card";
import { PaymentIcon } from "@/components/dashboard/icons";
import { PageHeader } from "@/components/dashboard/page-header";
import { PaymentEntryForm } from "@/components/dashboard/payment-entry-form";
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

  return (
    <main className="admin-main">
      <PageHeader
        action={
          <ActionDialog
            buttonLabel="Add payment"
            description="Create a manual payment row without leaving the payment ledger."
            title="Record payment"
          >
            <PaymentEntryForm orgSlug={crmOverview.organization.slug} variant="dialog" />
          </ActionDialog>
        }
        description={`Recorded revenue: ${currencyFormatter.format(crmOverview.stats.totalPaymentsMinor / 100)}.`}
        icon={<PaymentIcon />}
        title="Payments"
      />

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
