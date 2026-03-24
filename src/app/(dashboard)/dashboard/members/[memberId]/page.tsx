import Link from "next/link";
import { notFound } from "next/navigation";

import { MemberContactDialogButton } from "@/components/dashboard/member-contact-dialog-button";
import { MemberEntryForm } from "@/components/dashboard/member-entry-form";
import { MemberPaymentPanel } from "@/components/dashboard/member-payment-panel";
import { MembersIcon, PaymentIcon, ReceiptIcon } from "@/components/dashboard/icons";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAdminContext } from "@/lib/server/services/admin";

type MemberDetailPageProps = {
  params: Promise<{
    memberId: string;
  }>;
  searchParams: Promise<{
    org?: string;
  }>;
};

const currencyFormatter = new Intl.NumberFormat("da-DK", {
  currency: "DKK",
  style: "currency"
});

function formatDate(value: number | null) {
  if (!value) {
    return "No activity yet";
  }

  return new Intl.DateTimeFormat("da-DK", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function sourceLabel(source: "admin_import" | "admin_manual" | "embed" | "hosted_form") {
  switch (source) {
    case "admin_import":
      return "Admin import";
    case "admin_manual":
      return "Manual";
    case "embed":
      return "Embed";
    case "hosted_form":
      return "Hosted form";
  }
}

export default async function MemberDetailPage({ params, searchParams }: MemberDetailPageProps) {
  const [{ memberId }, query] = await Promise.all([params, searchParams]);
  const { crmOverview } = await getAdminContext(query.org);

  if (!crmOverview) {
    return (
      <main className="admin-main">
        <section className="hero-card">
          <p className="eyebrow">Members</p>
          <h1 className="headline">No organization selected yet.</h1>
        </section>
      </main>
    );
  }

  const member = crmOverview.members.find((entry) => entry.id === memberId);

  if (!member) {
    notFound();
  }

  const memberPayments = crmOverview.payments.filter((payment) => payment.email === member.email);
  const memberEmails = crmOverview.emails.filter((message) => message.email === member.email);
  const successfulPayments = memberPayments.filter((payment) => payment.status === "succeeded");
  const totalPaidMinor = successfulPayments.reduce((sum, payment) => sum + payment.amountMinor, 0);
  const lastPayment = memberPayments[0] ?? null;
  const lastEmail = memberEmails[0] ?? null;

  return (
    <main className="admin-main member-detail-shell">
      <PageHeader
        action={
          <div className="header-action-group">
            <Link className="link-button compact-link" href={`/dashboard/members?org=${crmOverview.organization.slug}`}>
              Back to members
            </Link>
            <MemberContactDialogButton
              activeCount={crmOverview.stats.activeMembers}
              member={{ email: member.email, id: member.id, name: member.name }}
              orgSlug={crmOverview.organization.slug}
              pendingCount={crmOverview.stats.pendingMembers}
              totalCount={crmOverview.members.length}
            />
          </div>
        }
        description="Review the full member record, update profile and plan details, inspect Stripe payment information, and follow up when billing needs attention."
        icon={<MembersIcon />}
        title={member.name || member.email}
      />

      <section className="section-card member-detail-hero">
        <div className="member-detail-hero-top">
          <div className="member-detail-title-block">
            <p className="eyebrow">Member record</p>
            <h2 className="member-detail-name">{member.name || "Unnamed member"}</h2>
            <p className="member-detail-subtitle">
              {member.email}
              {member.phone ? ` · ${member.phone}` : ""}
            </p>
          </div>
          <div className="member-detail-badges">
            <span className={`status-pill status-${member.status}`}>{formatLabel(member.status)}</span>
            <span className="member-detail-badge">{member.planName}</span>
            <span className="member-detail-badge">{sourceLabel(member.source)}</span>
          </div>
        </div>

        <div className="member-detail-stats">
          <article className="member-detail-stat">
            <span>Total collected</span>
            <strong>{currencyFormatter.format(totalPaidMinor / 100)}</strong>
            <small>{successfulPayments.length} successful payments</small>
          </article>
          <article className="member-detail-stat">
            <span>Payment health</span>
            <strong>{lastPayment ? formatLabel(lastPayment.status) : "No payments"}</strong>
            <small>{lastPayment ? `Latest on ${formatDate(lastPayment.paidAt)}` : "Nothing recorded yet"}</small>
          </article>
          <article className="member-detail-stat">
            <span>Email activity</span>
            <strong>{memberEmails.length}</strong>
            <small>{lastEmail ? `Last sent ${formatDate(lastEmail.createdAt)}` : "No tracked messages yet"}</small>
          </article>
          <article className="member-detail-stat">
            <span>Consent</span>
            <strong>{member.consentToEmail ? "Allowed" : "Off"}</strong>
            <small>{member.consentToEmail ? "Can receive membership emails" : "Do not include in sends"}</small>
          </article>
        </div>
      </section>

      <div className="member-detail-grid">
        <MemberEntryForm
          member={{
            consentToEmail: member.consentToEmail,
            email: member.email,
            firstName: member.firstName,
            id: member.id,
            lastName: member.lastName,
            phone: member.phone,
            planName: member.planName,
            status: member.status
          }}
          orgSlug={crmOverview.organization.slug}
        />

        <section className="section-card member-insight-panel">
          <div className="member-section-heading">
            <p className="eyebrow">Snapshot</p>
            <h2 className="panel-title">What matters right now</h2>
          </div>

          <div className="member-detail-meta">
            <article className="member-detail-meta-item">
              <span>Current status</span>
              <strong>{formatLabel(member.status)}</strong>
              <small>{member.status === "past_due" ? "Needs payment follow-up." : "No immediate status issue detected."}</small>
            </article>
            <article className="member-detail-meta-item">
              <span>Recent payment</span>
              <strong>{lastPayment ? currencyFormatter.format(lastPayment.amountMinor / 100) : "None yet"}</strong>
              <small>{lastPayment ? `${formatLabel(lastPayment.provider)} · ${formatDate(lastPayment.paidAt)}` : "Waiting for the first Stripe payment."}</small>
            </article>
            <article className="member-detail-meta-item">
              <span>Recent email</span>
              <strong>{lastEmail ? lastEmail.subject : "No messages"}</strong>
              <small>{lastEmail ? `${formatLabel(lastEmail.status)} · ${formatDate(lastEmail.createdAt)}` : "Use Contact to send the first update."}</small>
            </article>
            <article className="member-detail-meta-item">
              <span>Record source</span>
              <strong>{sourceLabel(member.source)}</strong>
              <small>Useful when you need to trace how this member entered the system.</small>
            </article>
          </div>
        </section>
      </div>

      <div className="member-detail-grid">
        <MemberPaymentPanel
          member={{
            email: member.email,
            id: member.id,
            name: member.name || member.email,
            planName: member.planName,
            status: member.status
          }}
          orgSlug={crmOverview.organization.slug}
          payments={memberPayments.map((payment) => ({
            amountMinor: payment.amountMinor,
            externalPaymentId: payment.externalPaymentId,
            id: payment.id,
            note: payment.note,
            paidAt: payment.paidAt,
            provider: payment.provider,
            status: payment.status
          }))}
          totalPaidLabel={currencyFormatter.format(totalPaidMinor / 100)}
        />

        <section className="section-card member-timeline-panel">
          <div className="member-section-heading">
            <p className="eyebrow">Signals</p>
            <h2 className="panel-title">Recent activity</h2>
          </div>

          <div className="member-timeline-list">
            {lastPayment ? (
              <article className="member-timeline-item">
                <div className="member-timeline-icon">
                  <PaymentIcon />
                </div>
                <div className="member-timeline-copy">
                  <strong>{currencyFormatter.format(lastPayment.amountMinor / 100)} payment update</strong>
                  <span>{`${formatLabel(lastPayment.status)} via ${formatLabel(lastPayment.provider)} on ${formatDate(lastPayment.paidAt)}`}</span>
                </div>
              </article>
            ) : null}

            {lastEmail ? (
              <article className="member-timeline-item">
                <div className="member-timeline-icon">
                  <ReceiptIcon />
                </div>
                <div className="member-timeline-copy">
                  <strong>{lastEmail.subject}</strong>
                  <span>{`${formatLabel(lastEmail.status)} email on ${formatDate(lastEmail.createdAt)}`}</span>
                </div>
              </article>
            ) : null}

            {!lastPayment && !lastEmail ? <p className="member-activity-empty">No tracked member activity yet.</p> : null}
          </div>
        </section>
      </div>

      <section className="section-card member-history-card">
        <div className="member-section-heading">
          <p className="eyebrow">Payments</p>
          <h2 className="panel-title">Payment history</h2>
        </div>

        {memberPayments.length === 0 ? (
          <p className="body-copy">No payments have been linked to this member yet.</p>
        ) : (
          <div className="table-shell">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {memberPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{currencyFormatter.format(payment.amountMinor / 100)}</td>
                    <td>{formatLabel(payment.provider)}</td>
                    <td>{formatLabel(payment.status)}</td>
                    <td>{formatLabel(payment.category)}</td>
                    <td>{formatDate(payment.paidAt)}</td>
                    <td>{payment.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="section-card member-history-card">
        <div className="member-section-heading">
          <p className="eyebrow">Messages</p>
          <h2 className="panel-title">Recent email activity</h2>
        </div>

        {memberEmails.length === 0 ? (
          <p className="body-copy">No tracked email activity for this member yet.</p>
        ) : (
          <div className="member-email-list">
            {memberEmails.map((message) => (
              <article className="member-email-item" key={message.id}>
                <div className="member-email-row">
                  <strong>{message.subject}</strong>
                  <span className="member-detail-badge">{formatLabel(message.status)}</span>
                </div>
                <p>{message.category.replace(/_/g, " ")}</p>
                <small>{formatDate(message.createdAt)}</small>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
