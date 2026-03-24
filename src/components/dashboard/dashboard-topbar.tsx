"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HelpCircleIcon,
  SearchIcon
} from "@/components/dashboard/icons";
import { authClient } from "@/lib/auth-client";

type DashboardTopbarProps = {
  organizations: Array<{
    name: string;
    slug: string;
  }>;
};

function getInitials(value: string) {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "A";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function DashboardTopbar({ organizations }: DashboardTopbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = authClient.useSession();

  const selectedSlug = searchParams.get("org") ?? organizations[0]?.slug ?? "";
  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.slug === selectedSlug) ?? organizations[0],
    [organizations, selectedSlug]
  );

  const dashboardHref = useMemo(() => {
    const slug = selectedOrganization?.slug;
    return slug ? (`/dashboard?org=${slug}` as Route) : "/dashboard";
  }, [selectedOrganization?.slug]);

  const settingsHref = useMemo(
    () => (selectedOrganization ? `/dashboard/settings?org=${selectedOrganization.slug}` : "/dashboard/settings"),
    [selectedOrganization]
  );

  const profileName = session?.user?.name?.trim() || "Admin";
  const profileInitials = getInitials(profileName);
  const profileShort =
    profileName.split(/\s+/).filter(Boolean).length > 1
      ? `${profileName.split(/\s+/)[0]} ${profileName.split(/\s+/).pop()?.[0] ?? ""}.`
      : profileName;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="dashboard-topbar" role="banner">
      <div className="topbar-left">
        <div className="topbar-history">
          <button aria-label="Go back" className="topbar-history-btn" type="button" onClick={() => router.back()}>
            <ChevronLeftIcon />
          </button>
          <button aria-label="Go forward" className="topbar-history-btn" type="button" onClick={() => router.forward()}>
            <ChevronRightIcon />
          </button>
        </div>

        <Link className="topbar-logo" href={dashboardHref}>
          <span className="topbar-logo-mark">FS</span>
          <span className="topbar-logo-name">Forening Setup</span>
        </Link>
      </div>

      <div className="topbar-center">
        <div className="topbar-search" role="search">
          <SearchIcon />
          <input ref={searchInputRef} aria-label="Search" placeholder="Search" type="search" />
          <kbd className="topbar-search-kbd">⌘ K</kbd>
        </div>
      </div>

      <div className="topbar-right">
        <button className="topbar-help" type="button">
          <HelpCircleIcon />
          Help Center
        </button>

        <Link className="topbar-profile-chip" href={settingsHref as Route}>
          <span className="topbar-profile-avatar">{profileInitials}</span>
          <span className="topbar-profile-name">{profileShort}</span>
          <ChevronDownIcon className="topbar-profile-chevron" />
        </Link>
      </div>
    </header>
  );
}
