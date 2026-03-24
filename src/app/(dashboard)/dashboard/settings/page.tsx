import { ActionDialog } from "@/components/dashboard/action-dialog";
import { BuildingIcon } from "@/components/dashboard/icons";
import { GeneralSettingsForm } from "@/components/dashboard/general-settings-form";
import { OrganizationIntakeForm } from "@/components/dashboard/organization-intake-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsNav } from "@/components/dashboard/settings-nav";
import { getAdminContext } from "@/lib/server/services/admin";
import { getOrganizationSettings } from "@/lib/server/services/settings";

type SettingsPageProps = {
  searchParams: Promise<{
    org?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const { selectedSlug } = await getAdminContext(params.org);
  const settings = selectedSlug ? await getOrganizationSettings(selectedSlug) : null;

  return (
    <main className="admin-main">
      <PageHeader
        action={
          <ActionDialog
            buttonLabel="New workspace"
            description="Spin up a new organization without leaving the settings area."
            title="Create workspace"
          >
            <OrganizationIntakeForm variant="dialog" />
          </ActionDialog>
        }
        description="General profile, hosted form copy, and branding all live here."
        icon={<BuildingIcon />}
        title="Settings"
      />

      <section className="settings-layout-grid">
        <SettingsNav active="general" orgSlug={selectedSlug} />
        <div className="settings-content-stack">
          {settings ? (
            <GeneralSettingsForm
              settings={{
                defaultPlanName: settings.defaultPlanName,
                name: settings.name,
                orgSlug: settings.slug,
                primaryColor: settings.primaryColor,
                publicDescription: settings.publicDescription,
                publicHeadline: settings.publicHeadline,
                supportEmail: settings.supportEmail,
                websiteUrl: settings.websiteUrl
              }}
            />
          ) : (
            <section className="section-card">
              <p className="eyebrow">No workspace selected</p>
              <h2 className="panel-title">Create or choose an organization</h2>
              <p className="body-copy">Once a workspace is selected, this page becomes the control center for its public profile and hosted signup flow.</p>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
