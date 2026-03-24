"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { saveOrganizationSettings } from "@/actions/organizations";
import { FieldShell } from "@/components/dashboard/field-shell";
import { BuildingIcon, GlobeIcon, MailIcon, MembersIcon, PaletteIcon } from "@/components/dashboard/icons";
import { organizationSettingsSchema, type OrganizationSettingsInput } from "@/lib/validations/organization";

type OrganizationIntakeFormProps = {
  variant?: "card" | "dialog";
};

export function OrganizationIntakeForm({ variant = "card" }: OrganizationIntakeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const form = useForm<OrganizationSettingsInput>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      defaultPlanName: "Monthly member",
      name: "",
      primaryColor: "#7c4a21",
      publicDescription: "",
      publicHeadline: "",
      slug: "",
      supportEmail: "",
      websiteUrl: ""
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    setStatusMessage(null);

    startTransition(async () => {
      const result = await saveOrganizationSettings(values);

      if (!result.ok) {
        setStatusMessage("We could not create that organization yet.");
        return;
      }

      form.reset();
      window.dispatchEvent(new CustomEvent("dashboard:close-modals"));
      router.push(`/dashboard?org=${result.organization.slug}`);
      router.refresh();
      setStatusMessage(`Created ${values.name}.`);
    });
  });

  return (
    <form className={variant === "card" ? "section-card dashboard-form" : "dashboard-form dialog-form"} onSubmit={onSubmit}>
      <div className={variant === "card" ? undefined : "form-intro-compact"}>
        <p className="eyebrow">Input flow</p>
        <h2 className="panel-title">Create organization workspace</h2>
        <p className="body-copy">
          Use this to onboard a new union or organization. It immediately creates the tenant, owner membership, and
          hosted signup form.
        </p>
      </div>

      <div className="form-grid">
        <label>
          Organization name
          <FieldShell icon={<BuildingIcon />}>
            <input {...form.register("name")} placeholder="Copenhagen Solidarity Union" />
          </FieldShell>
        </label>

        <label>
          Slug
          <FieldShell icon={<BuildingIcon />}>
            <input {...form.register("slug")} placeholder="copenhagen-solidarity-union" />
          </FieldShell>
        </label>

        <label>
          Support email
          <FieldShell icon={<MailIcon />}>
            <input {...form.register("supportEmail")} placeholder="hello@example.org" type="email" />
          </FieldShell>
        </label>

        <label>
          Website
          <FieldShell icon={<GlobeIcon />}>
            <input {...form.register("websiteUrl")} placeholder="https://example.org" type="url" />
          </FieldShell>
        </label>

        <label>
          Brand color
          <FieldShell icon={<PaletteIcon />}>
            <input {...form.register("primaryColor")} placeholder="#7c4a21" />
          </FieldShell>
        </label>

        <label>
          Default plan
          <FieldShell icon={<MembersIcon />}>
            <input {...form.register("defaultPlanName")} placeholder="Monthly member" />
          </FieldShell>
        </label>
      </div>

      <label>
        Public headline
        <FieldShell icon={<MembersIcon />}>
          <input {...form.register("publicHeadline")} placeholder="Support the organization with a simple monthly membership." />
        </FieldShell>
      </label>

      <label>
        Public description
        <FieldShell icon={<BuildingIcon />}>
          <textarea {...form.register("publicDescription")} placeholder="What the organization does and why someone should join." rows={4} />
        </FieldShell>
      </label>

      {statusMessage ? <p className="success-text">{statusMessage}</p> : null}

      <button disabled={isPending} type="submit">
        {isPending ? "Creating..." : "Create organization"}
      </button>
    </form>
  );
}
