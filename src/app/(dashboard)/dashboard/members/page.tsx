import { ActionDialog } from "@/components/dashboard/action-dialog";
import { MembersIcon } from "@/components/dashboard/icons";
import { MemberEntryForm } from "@/components/dashboard/member-entry-form";
import { MembersRegistry } from "@/components/dashboard/members-registry";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAdminContext } from "@/lib/server/services/admin";

type MembersPageProps = {
  searchParams: Promise<{
    org?: string;
  }>;
};

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams;
  const { crmOverview } = await getAdminContext(params.org);

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

  return (
    <main className="admin-main">
      <PageHeader
        action={
          <div className="header-action-group">
            <ActionDialog
              buttonClassName="primary-action compact"
              buttonLabel="Add member"
              description="Register a member without leaving the registry view."
              title="Create member"
            >
              <MemberEntryForm orgSlug={crmOverview.organization.slug} variant="dialog" />
            </ActionDialog>
          </div>
        }
        compact
        description="Keep the registry in view while you search, filter, select, and act on members."
        icon={<MembersIcon />}
        title="Members"
      />

      <MembersRegistry
        activeCount={crmOverview.stats.activeMembers}
        members={crmOverview.members}
        orgSlug={crmOverview.organization.slug}
        pendingCount={crmOverview.stats.pendingMembers}
      />
    </main>
  );
}
