import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/auth-server";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { listOrganizationSummaries } from "@/lib/server/services/organizations";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  if (!(await isAuthenticated())) {
    redirect("/auth/sign-in");
  }

  const organizations = await listOrganizationSummaries();

  return (
    <div className="admin-layout">
      <DashboardSidebar organizations={organizations.map((organization) => ({ name: organization.name, slug: organization.slug }))} />
      <div className="admin-content">
        <div className="admin-body">{children}</div>
      </div>
    </div>
  );
}
