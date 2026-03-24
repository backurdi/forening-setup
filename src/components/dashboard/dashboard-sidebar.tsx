"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

import { GridIcon, MembersIcon, PaymentIcon, SettingsIcon } from "@/components/dashboard/icons";

type DashboardSidebarProps = {
  organizationCount: number;
};

const navItems: Array<{ href: Route; icon: React.ReactNode; label: string }> = [
  { href: "/dashboard", icon: <GridIcon />, label: "Overview" },
  { href: "/dashboard/members", icon: <MembersIcon />, label: "Members" },
  { href: "/dashboard/payments", icon: <PaymentIcon />, label: "Payments" },
  { href: "/dashboard/settings", icon: <SettingsIcon />, label: "Settings" }
];

export function DashboardSidebar({ organizationCount }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div>
        <p className="sidebar-kicker">Curated Admin</p>
        <h1 className="sidebar-title">Forening Setup</h1>
        <p className="sidebar-subtitle">{organizationCount} active workspaces</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link className={pathname === item.href ? "sidebar-link active" : "sidebar-link"} href={item.href} key={item.href}>
            <span className="sidebar-link-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p className="sidebar-kicker">Admin profile</p>
        <p className="sidebar-subtitle">Master access</p>
      </div>
    </aside>
  );
}
