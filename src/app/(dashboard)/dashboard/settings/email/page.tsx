import { ActionDialog } from "@/components/dashboard/action-dialog";
import { CrmTableCard } from "@/components/dashboard/crm-table-card";
import { EmailSettingsForm } from "@/components/dashboard/email-settings-form";
import { MailIcon } from "@/components/dashboard/icons";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsNav } from "@/components/dashboard/settings-nav";
import { SubscriberEntryForm } from "@/components/dashboard/subscriber-entry-form";
import { getAdminContext } from "@/lib/server/services/admin";
import { getOrganizationSettings } from "@/lib/server/services/settings";

type EmailSettingsPageProps = {
  searchParams: Promise<{
    org?: string;
  }>;
};

export default async function EmailSettingsPage({ searchParams }: EmailSettingsPageProps) {
  const params = await searchParams;
  const { crmOverview, selectedSlug } = await getAdminContext(params.org);
  const settings = selectedSlug ? await getOrganizationSettings(selectedSlug) : null;
  const emailActivity = crmOverview?.emails ?? [];

  return (
    <main className="admin-main">
      <PageHeader
        action={
          settings ? (
            <ActionDialog
              buttonLabel="Add subscriber"
              description="Capture a subscriber without leaving the email activity view."
              title="Create subscriber"
            >
              <SubscriberEntryForm orgSlug={settings.slug} variant="dialog" />
            </ActionDialog>
          ) : null
        }
        description="Sender identity, welcome templates, subscriber automation, and delivery logs all live inside settings now."
        icon={<MailIcon />}
        title="Email settings"
      />

      <section className="settings-layout-grid">
        <SettingsNav active="email" orgSlug={selectedSlug} />

        <div className="settings-content-stack">
          {settings ? (
            <>
              <EmailSettingsForm
                settings={{
                  adminNotificationEmail: settings.adminNotificationEmail,
                  emailFromAddress: settings.emailFromAddress,
                  emailFromName: settings.emailFromName,
                  emailReplyTo: settings.emailReplyTo,
                  orgSlug: settings.slug,
                  subscriberEmailBody: settings.subscriberEmailBody,
                  subscriberEmailEnabled: settings.subscriberEmailEnabled,
                  subscriberEmailSubject: settings.subscriberEmailSubject,
                  welcomeEmailBody: settings.welcomeEmailBody,
                  welcomeEmailEnabled: settings.welcomeEmailEnabled,
                  welcomeEmailSubject: settings.welcomeEmailSubject
                }}
              />
              <section className="section-grid">
                <CrmTableCard
                  caption="Subscribers"
                  columns={["Name", "Email", "Status", "Source"]}
                  emptyMessage="No subscribers recorded yet."
                  rows={(crmOverview?.subscribers ?? []).map((subscriber) => [
                    subscriber.name || "Unnamed",
                    subscriber.email,
                    subscriber.status,
                    subscriber.source
                  ])}
                  title="Subscriber list"
                />
                <CrmTableCard
                  caption="Email activity"
                  columns={["Recipient", "Subject", "Category", "Status"]}
                  emptyMessage="No email activity yet."
                  rows={emailActivity.map((email) => [email.email, email.subject, email.category, email.status])}
                  title="Delivery log"
                />
              </section>
              <section className="section-card settings-stack">
                <div className="settings-pill">Resend workflow</div>
                <h2 className="panel-title">Delivery notes</h2>
                <p className="body-copy">Emails now send through Resend when new subscribers are added, when active members are created manually, and when Stripe confirms hosted signup payments.</p>
                <div className="notice-card">
                  Use <code>pnpm run resend:doctor</code> to verify the local Resend setup, and point the Resend webhook to <code>/api/webhooks/resend</code> for delivery updates.
                </div>
              </section>
            </>
          ) : (
            <section className="section-card">
              <p className="eyebrow">No workspace selected</p>
              <h2 className="panel-title">Select an organization first</h2>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
