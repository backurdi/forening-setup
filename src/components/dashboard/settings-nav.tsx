import Link from "next/link";
import type { Route } from "next";

import { BuildingIcon, MailIcon, PaymentIcon } from "@/components/dashboard/icons";

type SettingsNavProps = {
  active: "general" | "payments" | "email";
  orgSlug?: string | null;
};

const navItems = [
  { key: "general", label: "General", icon: <BuildingIcon />, path: "/dashboard/settings" },
  { key: "payments", label: "Payments", icon: <PaymentIcon />, path: "/dashboard/settings/payments" },
  { key: "email", label: "Email", icon: <MailIcon />, path: "/dashboard/settings/email" }
] as const;

export function SettingsNav({ active, orgSlug }: SettingsNavProps) {
  return (
    <nav className="settings-nav">
      <h2 className="settings-aside-heading">Workspace settings</h2>
      <p className="settings-nav-section">Configuration</p>
      {navItems.map((item) => {
        const href = orgSlug ? `${item.path}?org=${orgSlug}` : item.path;

        return (
          <Link className={active === item.key ? "settings-nav-link active" : "settings-nav-link"} href={href as Route} key={item.key}>
            <span className="settings-nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
