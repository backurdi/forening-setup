"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createManualMember, updateMember } from "@/actions/crm";
import { FieldShell } from "@/components/dashboard/field-shell";
import { GlobeIcon, MailIcon, MembersIcon, PaymentIcon, UserIcon } from "@/components/dashboard/icons";
import { manualMemberSchema, type ManualMemberInput } from "@/lib/validations/crm";

type EditableMember = {
  consentToEmail: boolean;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  phone: string;
  planName: string;
  status: ManualMemberInput["status"];
};

type MemberEntryFormProps = {
  member?: EditableMember;
  orgSlug: string;
  variant?: "card" | "dialog";
};

export function MemberEntryForm({ member, orgSlug, variant = "card" }: MemberEntryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const isEditing = Boolean(member);
  const form = useForm<ManualMemberInput>({
    resolver: zodResolver(manualMemberSchema),
    defaultValues: {
      consentToEmail: member?.consentToEmail ?? true,
      email: member?.email ?? "",
      firstName: member?.firstName ?? "",
      lastName: member?.lastName ?? "",
      orgSlug,
      phone: member?.phone ?? "",
      planName: member?.planName ?? "Monthly member",
      status: member?.status ?? "active"
    }
  });

  return (
    <form
      className={variant === "card" ? "section-card dashboard-form" : "dashboard-form dialog-form"}
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          setStatusMessage(null);
          const result = member
            ? await updateMember({
                ...values,
                memberId: member.id
              })
            : await createManualMember(values);

          if (!result.ok) {
            const failureMessage = "message" in result ? result.message ?? "Member could not be saved." : "Member could not be saved.";
            setStatusMessage(failureMessage);
            return;
          }

          if (!isEditing) {
            form.reset({ ...form.getValues(), email: "", firstName: "", lastName: "", phone: "" });
          }

          window.dispatchEvent(new CustomEvent("dashboard:close-modals"));
          router.refresh();
          setStatusMessage(isEditing ? "Member updated." : "Member saved.");
        })
      )}
    >
      <div className={variant === "card" ? undefined : "form-intro-compact"}>
        <p className="eyebrow">Members</p>
        <h2 className="panel-title">{isEditing ? "Update member" : "Register member"}</h2>
      </div>

      <div className="form-grid">
        <label>
          First name
          <FieldShell icon={<UserIcon />}>
            <input {...form.register("firstName")} />
          </FieldShell>
        </label>
        <label>
          Last name
          <FieldShell icon={<UserIcon />}>
            <input {...form.register("lastName")} />
          </FieldShell>
        </label>
        <label>
          Email
          <FieldShell icon={<MailIcon />}>
            <input {...form.register("email")} type="email" />
          </FieldShell>
        </label>
        <label>
          Phone
          <FieldShell icon={<GlobeIcon />}>
            <input {...form.register("phone")} />
          </FieldShell>
        </label>
        <label>
          Plan
          <FieldShell icon={<MembersIcon />}>
            <input {...form.register("planName")} />
          </FieldShell>
        </label>
        <label>
          Status
          <FieldShell icon={<PaymentIcon />}>
            <select {...form.register("status")}>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="past_due">Past due</option>
              <option value="canceled">Canceled</option>
              <option value="expired">Expired</option>
            </select>
          </FieldShell>
        </label>
      </div>

      <label className="checkbox-row">
        <input {...form.register("consentToEmail")} type="checkbox" />
        Allow membership-related email
      </label>

      {statusMessage ? <p className="success-text">{statusMessage}</p> : null}
      <button disabled={isPending} type="submit">
        {isPending ? (isEditing ? "Updating..." : "Saving...") : isEditing ? "Update member" : "Save member"}
      </button>
    </form>
  );
}
