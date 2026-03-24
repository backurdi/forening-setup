"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { updateGeneralSettings } from "@/actions/settings";
import { FieldShell } from "@/components/dashboard/field-shell";
import { BuildingIcon, GlobeIcon, MailIcon, MembersIcon, PaletteIcon } from "@/components/dashboard/icons";
import { generalSettingsSchema, type GeneralSettingsInput } from "@/lib/validations/settings";

type GeneralSettingsFormProps = {
  settings: Omit<GeneralSettingsInput, "orgSlug"> & {
    orgSlug: string;
  };
};

export function GeneralSettingsForm({ settings }: GeneralSettingsFormProps) {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<GeneralSettingsInput>({
    defaultValues: settings,
    resolver: zodResolver(generalSettingsSchema)
  });

  return (
    <form
      className="section-card dashboard-form"
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          setStatusMessage(null);
          const result = await updateGeneralSettings(values);

          if (!result.ok) {
            setStatusMessage("General settings could not be saved.");
            return;
          }

          router.refresh();
          setStatusMessage("General settings saved.");
        })
      )}
    >
      <div>
        <p className="eyebrow">General settings</p>
        <h2 className="panel-title">Workspace profile</h2>
        <p className="body-copy">Update the organization profile, hosted form messaging, and public-facing basics from one place.</p>
      </div>

      <div className="form-grid">
        <label>
          Organization name
          <FieldShell icon={<BuildingIcon />}>
            <input {...form.register("name")} />
          </FieldShell>
        </label>
        <label>
          Support email
          <FieldShell icon={<MailIcon />}>
            <input {...form.register("supportEmail")} type="email" />
          </FieldShell>
        </label>
        <label>
          Website URL
          <FieldShell icon={<GlobeIcon />}>
            <input {...form.register("websiteUrl")} type="url" />
          </FieldShell>
        </label>
        <label>
          Brand color
          <FieldShell icon={<PaletteIcon />}>
            <input {...form.register("primaryColor")} />
          </FieldShell>
        </label>
        <label>
          Default plan name
          <FieldShell icon={<MembersIcon />}>
            <input {...form.register("defaultPlanName")} />
          </FieldShell>
        </label>
        <label>
          Workspace slug
          <FieldShell icon={<BuildingIcon />}>
            <input disabled {...form.register("orgSlug")} />
          </FieldShell>
        </label>
      </div>

      <label>
        Public headline
        <FieldShell icon={<MembersIcon />}>
          <input {...form.register("publicHeadline")} />
        </FieldShell>
      </label>

      <label>
        Public description
        <FieldShell icon={<BuildingIcon />}>
          <textarea {...form.register("publicDescription")} rows={4} />
        </FieldShell>
      </label>

      {statusMessage ? <p className="success-text">{statusMessage}</p> : null}

      <button disabled={isPending} type="submit">
        {isPending ? "Saving..." : "Save general settings"}
      </button>
    </form>
  );
}
