import { ActionDialog } from "@/components/dashboard/action-dialog";
import { CreateIntegrationFlow } from "@/components/dashboard/create-integration-flow";
import { GridIcon } from "@/components/dashboard/icons";
import { IntegrationTableActions } from "@/components/dashboard/integration-table-actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsNav } from "@/components/dashboard/settings-nav";
import { getAdminContext } from "@/lib/server/services/admin";
import { listOrganizationIntegrations } from "@/lib/server/services/integrations";
import { getOrganizationSettings } from "@/lib/server/services/settings";

type IntegrationSettingsPageProps = {
  searchParams: Promise<{
    org?: string;
  }>;
};

export default async function IntegrationSettingsPage({ searchParams }: IntegrationSettingsPageProps) {
  const params = await searchParams;
  const { selectedSlug } = await getAdminContext(params.org);
  const [integrations, settings] = selectedSlug
    ? await Promise.all([listOrganizationIntegrations(selectedSlug), getOrganizationSettings(selectedSlug)])
    : [[], null];
  const publicBaseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return (
    <main className="admin-main">
      <PageHeader
        action={
          selectedSlug ? (
            <ActionDialog
              buttonLabel="Create integration"
              description="Use a guided flow to create an onboarding button or form."
              title="Create integration"
            >
              <CreateIntegrationFlow orgSlug={selectedSlug} stripeConnected={Boolean(settings?.stripeConnectAccountId)} />
            </ActionDialog>
          ) : null
        }
        description="Manage onboarding buttons and forms for the organization website."
        icon={<GridIcon />}
        title="Integrations"
      />

      <section className="settings-layout-grid">
        <SettingsNav active="integrations" orgSlug={selectedSlug} />

        <div className="settings-content-stack">
          {selectedSlug ? (
            <section className="section-card dashboard-form integration-table-card">
              <div className="integration-table-header">
                <div>
                  <p className="eyebrow">Created integrations</p>
                  <h2 className="panel-title">All onboarding integrations</h2>
                  <p className="body-copy">Track every onboarding button and form in one place before wiring them into the website.</p>
                </div>
                <div className="integration-table-count">{integrations.length} total</div>
              </div>

              {integrations.length === 0 ? (
                <div className="notice-card">
                  No integrations yet. Use the create button above to add the first onboarding button or onboarding form.
                </div>
              ) : (
                <div className="table-shell">
                  <table className="crm-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Experience</th>
                        <th>Destination</th>
                        <th>Fields</th>
                        <th>Status</th>
                        <th>Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {integrations.map((integration) => (
                        <tr key={integration._id}>
                          <td>
                            <div className="integration-row-primary">
                              <strong>{integration.title}</strong>
                              <span>{integration.slug}</span>
                            </div>
                          </td>
                          <td>{integration.integrationType === "onboarding_form" ? "Onboarding form" : "Onboarding button"}</td>
                          <td>{integration.destinationType === "stripe_checkout" ? "Connected Stripe" : "External URL"}</td>
                          <td>{integration.integrationType === "onboarding_form" ? `${integration.fieldCount} enabled` : "No fields"}</td>
                          <td>
                            <span className={integration.status === "active" ? "status-pill status-active" : "status-pill status-pending"}>
                              {integration.status}
                            </span>
                          </td>
                          <td>{new Intl.DateTimeFormat("da-DK", { dateStyle: "medium" }).format(integration.updatedAt)}</td>
                          <td>
                            <IntegrationTableActions
                              integration={integration}
                              orgSlug={selectedSlug}
                              publicBaseUrl={publicBaseUrl}
                              stripeConnected={Boolean(settings?.stripeConnectAccountId)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : (
            <section className="section-card dashboard-form">
              <p className="eyebrow">No workspace selected</p>
              <h2 className="panel-title">Select an organization first</h2>
              <p className="body-copy">Once a workspace is selected, this page will show every integration created for that organization.</p>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
