"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Route } from "next";

import {
  ChevronDownIcon,
  GridIcon,
  LogoutIcon,
  MembersIcon,
  PaymentIcon,
  SettingsIcon
} from "@/components/dashboard/icons";
import { authClient } from "@/lib/auth-client";

type DashboardSidebarProps = {
  organizations: Array<{
    name: string;
    slug: string;
  }>;
};

const primaryNavItems: Array<{ href: Route; icon: React.ReactNode; label: string }> = [
  { href: "/dashboard", icon: <GridIcon />, label: "Overview" },
  { href: "/dashboard/members", icon: <MembersIcon />, label: "Members" },
  { href: "/dashboard/payments", icon: <PaymentIcon />, label: "Payments" }
];

function getInitials(value: string) {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "FS";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function DashboardSidebar({ organizations }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { data: session } = authClient.useSession();

  const selectedSlug = searchParams.get("org") ?? organizations[0]?.slug ?? "";
  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.slug === selectedSlug) ?? organizations[0],
    [organizations, selectedSlug]
  );
  const settingsHref = useMemo(
    () => (selectedOrganization ? `/dashboard/settings?org=${selectedOrganization.slug}` : "/dashboard/settings"),
    [selectedOrganization]
  );
  const profileName = session?.user?.name?.trim() || "Admin user";
  const profileEmail = session?.user?.email || "Manage your access";
  const profileInitials = getInitials(profileName);
  const organizationInitials = getInitials(selectedOrganization?.name ?? "Forening Setup");

  useEffect(() => {
    function onWindowPointerDown(event: MouseEvent) {
      if (!workspaceMenuRef.current?.contains(event.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }

      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    function onWindowKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsWorkspaceMenuOpen(false);
        setIsProfileMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", onWindowPointerDown);
    window.addEventListener("keydown", onWindowKeyDown);

    return () => {
      window.removeEventListener("mousedown", onWindowPointerDown);
      window.removeEventListener("keydown", onWindowKeyDown);
    };
  }, []);

  function getHref(nextSlug: string, basePath: Route) {
    return nextSlug ? (`${basePath}?org=${nextSlug}` as Route) : basePath;
  }

  function isNavItemActive(href: Route) {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname.startsWith(href);
  }

  function onOrganizationChange(nextSlug: string) {
    setIsWorkspaceMenuOpen(false);

    if (nextSlug === selectedOrganization?.slug) {
      return;
    }

    if (!nextSlug) {
      router.push(pathname as Route);
      return;
    }

    router.push(`${pathname}?org=${nextSlug}` as Route);
  }

  async function onSignOut() {
    setIsSigningOut(true);

    try {
      await authClient.signOut();
      router.push("/auth/sign-in");
      router.refresh();
    } finally {
      setIsSigningOut(false);
      setIsProfileMenuOpen(false);
    }
  }

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-top">
        {organizations.length ? (
          <div className="sidebar-workspace-shell" ref={workspaceMenuRef}>
            {isWorkspaceMenuOpen ? (
              <div className="workspace-popover" role="menu" aria-label="Switch workspace">
                {organizations.map((organization) => {
                  const isActive = organization.slug === selectedOrganization?.slug;

                  return (
                    <button
                      className={isActive ? "workspace-menu-item active" : "workspace-menu-item"}
                      key={organization.slug}
                      type="button"
                      onClick={() => onOrganizationChange(organization.slug)}
                    >
                      <span className="workspace-menu-item-badge">{getInitials(organization.name)}</span>
                      <span className="workspace-menu-item-copy">
                        <span className="workspace-menu-item-name">{organization.name}</span>
                        <span className="workspace-menu-item-meta">
                          {isActive ? "Current workspace" : "Switch to workspace"}
                        </span>
                      </span>
                    </button>
                  );
                })}

                <Link className="workspace-menu-link" href="/dashboard/settings" onClick={() => setIsWorkspaceMenuOpen(false)}>
                  Manage workspaces
                </Link>
              </div>
            ) : null}

            <button
              aria-expanded={isWorkspaceMenuOpen}
              aria-haspopup="menu"
              className="sidebar-workspace-button"
              type="button"
              onClick={() => {
                setIsProfileMenuOpen(false);
                setIsWorkspaceMenuOpen((open) => !open);
              }}
            >
              <span className="sidebar-org-badge">{organizationInitials}</span>
              <span className="sidebar-workspace-name">{selectedOrganization?.name ?? "No workspace selected"}</span>
              <ChevronDownIcon className={isWorkspaceMenuOpen ? "sidebar-workspace-chevron open" : "sidebar-workspace-chevron"} />
            </button>
          </div>
        ) : (
          <Link className="sidebar-inline-action" href="/dashboard/settings">
            Create workspace
          </Link>
        )}
      </div>

      <div className="sidebar-main">
        <p className="sidebar-section-label">Navigation</p>
        <nav className="sidebar-nav" aria-label="Primary">
          {primaryNavItems.map((item) => (
            <Link
              className={isNavItemActive(item.href) ? "sidebar-link active" : "sidebar-link"}
              href={getHref(selectedOrganization?.slug ?? "", item.href)}
              key={item.href}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-title">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <p className="sidebar-section-label">Account</p>
        <nav className="sidebar-utility-nav" aria-label="Utilities">
          <Link
            className={pathname.startsWith("/dashboard/settings") ? "sidebar-link active sidebar-link-utility" : "sidebar-link sidebar-link-utility"}
            href={settingsHref as Route}
          >
            <span className="sidebar-link-icon">
              <SettingsIcon />
            </span>
            <span className="sidebar-link-title">Settings</span>
          </Link>
        </nav>

        <div className="sidebar-profile-shell" ref={profileMenuRef}>
          {isProfileMenuOpen ? (
            <div className="profile-popover" role="menu">
              <div className="profile-popover-header">
                <p className="sidebar-kicker">Signed in as</p>
                <p className="profile-popover-title">{profileName}</p>
                <p className="profile-popover-meta">{profileEmail}</p>
              </div>

              <button
                className="profile-menu-item"
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  router.push(settingsHref as Route);
                }}
              >
                <SettingsIcon />
                Profile settings
              </button>

              <button className="profile-menu-item danger" disabled={isSigningOut} type="button" onClick={onSignOut}>
                <LogoutIcon />
                {isSigningOut ? "Signing out..." : "Log out"}
              </button>
            </div>
          ) : null}

          <button
            aria-expanded={isProfileMenuOpen}
            className="sidebar-profile-button"
            type="button"
            onClick={() => {
              setIsWorkspaceMenuOpen(false);
              setIsProfileMenuOpen((open) => !open);
            }}
          >
            <span className="profile-avatar">{profileInitials}</span>
            <span className="sidebar-profile-copy">
              <span className="profile-name">{profileName}</span>
              <span className="profile-meta">{selectedOrganization?.name ?? "Workspace admin"}</span>
            </span>
            <ChevronDownIcon className={isProfileMenuOpen ? "sidebar-profile-chevron open" : "sidebar-profile-chevron"} />
          </button>
        </div>
      </div>
    </aside>
  );
}
