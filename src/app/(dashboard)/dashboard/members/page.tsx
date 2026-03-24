import { ActionDialog } from "@/components/dashboard/action-dialog";
import { BulkMemberEmailForm } from "@/components/dashboard/bulk-member-email-form";
import { CrmTableCard } from "@/components/dashboard/crm-table-card";
import { MembersIcon } from "@/components/dashboard/icons";
import { MemberEntryForm } from "@/components/dashboard/member-entry-form";
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
              buttonLabel="Email members"
              description="Send a bulk email to active, pending, or all members."
              title="Bulk member email"
            >
              <BulkMemberEmailForm
                activeCount={crmOverview.stats.activeMembers}
                orgSlug={crmOverview.organization.slug}
                pendingCount={crmOverview.stats.pendingMembers}
                totalCount={crmOverview.members.length}
              />
            </ActionDialog>
            <ActionDialog
              buttonLabel="Add member"
              description="Register a member without leaving the registry view."
              title="Create member"
            >
              <MemberEntryForm orgSlug={crmOverview.organization.slug} variant="dialog" />
            </ActionDialog>
          </div>
        }
        description="The member registry stays front and center, with add-member and email actions tucked into focused modals."
        icon={<MembersIcon />}
        title="Members"
      />

      <CrmTableCard
        caption="Registry"
        columns={["Name", "Email", "Phone", "Plan", "Status", "Source"]}
        emptyMessage="No members registered yet."
        rows={crmOverview.members.map((member) => [member.name || "Unnamed", member.email, member.phone || "—", member.planName, member.status, member.source])}
        title="Member list"
      />
    </main>
  );
}
