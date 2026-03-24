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
            <section className="section-card">
              <p className="eyebrow">Members</p>
              <h2 className="panel-title">Registry</h2>
              <p className="body-copy">View and register members on the dedicated Members page.</p>
              <Link className="link-button" href={`/dashboard/members?org=${crmOverview.organization.slug}`}>
                Open Members
              </Link>
            </section>
            <section className="section-card">
              <p className="eyebrow">Payments</p>
              <h2 className="panel-title">Billing desk</h2>
              <p className="body-copy">Keep payment intake and history on their own focused page.</p>
              <Link className="link-button" href={`/dashboard/payments?org=${crmOverview.organization.slug}`}>
                Open Payments
              </Link>
            </section>
            <section className="section-card">
              <p className="eyebrow">Emails</p>
              <h2 className="panel-title">Audience</h2>
              <p className="body-copy">Capture and manage subscriber lists without crowding member operations.</p>
              <Link className="link-button" href={`/dashboard/emails?org=${crmOverview.organization.slug}`}>
                Open Emails
              </Link>
            </section>
            <section className="section-card">
              <p className="eyebrow">Settings</p>
              <h2 className="panel-title">Workspace controls</h2>
              <p className="body-copy">Organization creation and settings now live in a separate configuration page.</p>
              <Link className="link-button" href={`/dashboard/settings?org=${crmOverview.organization.slug}`}>
                Open Settings
              </Link>
            </section>
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
