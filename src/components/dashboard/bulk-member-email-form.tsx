"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { sendBulkMemberEmail } from "@/actions/crm";
import { FieldShell } from "@/components/dashboard/field-shell";
import { MailIcon, MembersIcon } from "@/components/dashboard/icons";
import { bulkMemberEmailSchema, type BulkMemberEmailInput } from "@/lib/validations/crm";

type BulkMemberEmailFormProps = {
  activeCount: number;
  defaultAudience?: BulkMemberEmailInput["audience"];
  filteredCount?: number;
  filteredMemberIds?: string[];
  orgSlug: string;
  pendingCount: number;
  selectedCount?: number;
  selectedMemberIds?: string[];
  totalCount: number;
};

export function BulkMemberEmailForm({
  activeCount,
  defaultAudience = "active",
  filteredCount = 0,
  filteredMemberIds = [],
  orgSlug,
  pendingCount,
  selectedCount = 0,
  selectedMemberIds = [],
  totalCount
}: BulkMemberEmailFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const form = useForm<BulkMemberEmailInput>({
    defaultValues: {
      audience: defaultAudience,
      body: "Hi {{firstName}},\n\nWe have an update for members of {{organizationName}}.\n\nBest,\n{{organizationName}}",
      memberIds: defaultAudience === "selected" ? selectedMemberIds : defaultAudience === "filtered" ? filteredMemberIds : [],
      orgSlug,
      subject: "Update from {{organizationName}}"
    },
    resolver: zodResolver(bulkMemberEmailSchema)
  });

  return (
    <form
      className="dashboard-form dialog-form"
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          setStatusMessage(null);
          const memberIds =
            values.audience === "selected"
              ? selectedMemberIds
              : values.audience === "filtered"
                ? filteredMemberIds
                : [];
          const result = await sendBulkMemberEmail({ ...values, memberIds });

          if (!result.ok) {
            const failureMessage = "message" in result ? result.message ?? "Bulk email failed." : "Bulk email failed.";
            setStatusMessage(failureMessage);
            return;
          }

          window.dispatchEvent(new CustomEvent("dashboard:close-modals"));
          router.refresh();
          setStatusMessage(result.message);
        })
      )}
    >
      <div className="form-intro-compact">
        <p className="eyebrow">Member email actions</p>
        <h2 className="panel-title">Send bulk email</h2>
        <p className="body-copy">
          Use <code>{"{{firstName}}"}</code> and <code>{"{{organizationName}}"}</code> in the message. Only members with
          email consent enabled are included in the send.
        </p>
      </div>

      <div className="form-grid">
        <label>
          Audience
          <FieldShell icon={<MembersIcon />}>
            <select {...form.register("audience")}>
              {selectedCount > 0 ? <option value="selected">Selected members ({selectedCount})</option> : null}
              {filteredCount > 0 && filteredCount < totalCount ? (
                <option value="filtered">Current filter ({filteredCount})</option>
              ) : null}
              <option value="active">Active members ({activeCount})</option>
              <option value="pending">Pending members ({pendingCount})</option>
              <option value="all">All members ({totalCount})</option>
            </select>
          </FieldShell>
        </label>

        <label>
          Subject
          <FieldShell icon={<MailIcon />}>
            <input {...form.register("subject")} />
          </FieldShell>
        </label>
      </div>

      <label>
        Message
        <FieldShell icon={<MailIcon />}>
          <textarea {...form.register("body")} rows={9} />
        </FieldShell>
      </label>

      {statusMessage ? <p className="success-text">{statusMessage}</p> : null}

      <button disabled={isPending} type="submit">
        {isPending ? "Sending..." : "Send bulk email"}
      </button>
    </form>
  );
}
