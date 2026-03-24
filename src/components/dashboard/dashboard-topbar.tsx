"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { BellIcon, SearchIcon, UserIcon } from "@/components/dashboard/icons";

type DashboardTopbarProps = {
  organizations: Array<{
    name: string;
    slug: string;
  }>;
};

export function DashboardTopbar({ organizations }: DashboardTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get("org") ?? organizations[0]?.slug ?? "";
  const selectedOrganization = organizations.find((organization) => organization.slug === selectedSlug) ?? organizations[0];

  function onOrganizationChange(nextSlug: string) {
    if (!nextSlug) {
      router.push(pathname as Route);
      return;
    }

    router.push(`${pathname}?org=${nextSlug}` as Route);
  }

  return (
    <header className="dashboard-topbar">
      <div className="topbar-search">
        <SearchIcon />
        <input placeholder="Search members, payments, settings..." type="text" />
      </div>

      <div className="topbar-actions">
        <label className="workspace-switcher">
          <span className="workspace-label">Workspace</span>
          <select value={selectedOrganization?.slug ?? ""} onChange={(event) => onOrganizationChange(event.target.value)}>
            {organizations.map((organization) => (
              <option key={organization.slug} value={organization.slug}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>

        <button className="topbar-icon-button" type="button">
          <BellIcon />
        </button>

        <div className="topbar-profile">
          <span className="profile-avatar">
            <UserIcon />
          </span>
          <div>
            <p className="profile-name">Admin</p>
            <p className="profile-meta">{selectedOrganization?.name ?? "No workspace"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
