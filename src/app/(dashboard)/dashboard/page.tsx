import { CrmTableCard } from "@/components/dashboard/crm-table-card";
import Link from "next/link";

import { GridIcon } from "@/components/dashboard/icons";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAdminContext } from "@/lib/server/services/admin";

type DashboardPageProps = {
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

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const { crmOverview } = await getAdminContext(params.org);
  const sentEmailCount = crmOverview ? (crmOverview.stats.sentEmails ?? (crmOverview.emails?.length ?? 0)) : 0;

  return (
    <main className="admin-main">
      <PageHeader
        description="A lighter control room for memberships, payments, and workspace settings."
        icon={<GridIcon />}
        title="Overview"
      />

      {crmOverview ? (
        <>
          <section className="stats-grid">
            <article className="stat-card">
              <p className="eyebrow">Active members</p>
              <p className="stat-value">{crmOverview.stats.activeMembers}</p>
            </article>
            <article className="stat-card">
              <p className="eyebrow">Pending members</p>
              <p className="stat-value">{crmOverview.stats.pendingMembers}</p>
            </article>
            <article className="stat-card">
              <p className="eyebrow">Subscribers</p>
              <p className="stat-value">{crmOverview.stats.newsletterSubscribers}</p>
            </article>
            <article className="stat-card">
              <p className="eyebrow">Recorded revenue</p>
              <p className="stat-value">{currencyFormatter.format(crmOverview.stats.totalPaymentsMinor / 100)}</p>
            </article>
            <article className="stat-card">
              <p className="eyebrow">Email activity</p>
              <p className="stat-value">{sentEmailCount}</p>
            </article>
          </section>

          <section className="section-grid">
            <CrmTableCard
              caption="Recent members"
              columns={["Name", "Email", "Plan", "Status", "Source"]}
              emptyMessage="No members yet."
              rows={crmOverview.members.slice(0, 4).map((member) => [member.name || "Unnamed", member.email, member.planName, member.status, member.source])}
              title="Member snapshot"
            />
            <CrmTableCard
              caption="Recent payments"
              columns={["Email", "Amount", "Provider", "Status", "Date"]}
              emptyMessage="No payments yet."
              rows={crmOverview.payments.slice(0, 4).map((payment) => [payment.email, currencyFormatter.format(payment.amountMinor / 100), payment.provider, payment.status, formatDate(payment.paidAt)])}
              title="Payment snapshot"
            />
          </section>
        </>
      ) : (
        <section className="section-card">
          <p className="eyebrow">Get started</p>
          <h2 className="panel-title">No organization selected</h2>
          <p className="body-copy">Go to Settings to create your first workspace and start structuring the admin system.</p>
          <Link className="link-button" href="/dashboard/settings">
            Open Settings
          </Link>
        </section>
      )}
    </main>
  );
}
