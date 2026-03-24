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
  orgSlug: string;
  pendingCount: number;
  totalCount: number;
};

export function BulkMemberEmailForm({
  activeCount,
  orgSlug,
  pendingCount,
  totalCount
}: BulkMemberEmailFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const form = useForm<BulkMemberEmailInput>({
    defaultValues: {
      audience: "active",
      body: "Hi {{firstName}},\n\nWe have an update for members of {{organizationName}}.\n\nBest,\n{{organizationName}}",
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
          const result = await sendBulkMemberEmail(values);

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
          Use <code>{"{{firstName}}"}</code> and <code>{"{{organizationName}}"}</code> in the message.
        </p>
      </div>

      <div className="form-grid">
        <label>
          Audience
          <FieldShell icon={<MembersIcon />}>
            <select {...form.register("audience")}>
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
