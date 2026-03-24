"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteMember } from "@/actions/crm";

type MemberDeleteFormProps = {
  memberEmail: string;
  memberId: string;
  memberName: string;
  orgSlug: string;
};

export function MemberDeleteForm({ memberEmail, memberId, memberName, orgSlug }: MemberDeleteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  return (
    <form
      className="dashboard-form dialog-form"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          setStatusMessage(null);
          const result = await deleteMember({ memberId, orgSlug });

          if (!result.ok) {
            const failureMessage = "message" in result ? result.message ?? "Member could not be deleted." : "Member could not be deleted.";
            setStatusMessage(failureMessage);
            return;
          }

          window.dispatchEvent(new CustomEvent("dashboard:close-modals"));
          router.refresh();
        });
      }}
    >
      <p className="body-copy">
        Delete <strong>{memberName}</strong> from the member registry. Existing payment and email history stays preserved, but the
        member record itself will be removed.
      </p>
      <p className="notice-card">
        Email on file: <strong>{memberEmail}</strong>
      </p>

      {statusMessage ? <p className="error-text">{statusMessage}</p> : null}

      <div className="dialog-action-row">
        <button className="danger-action" disabled={isPending} type="submit">
          {isPending ? "Deleting..." : "Delete member"}
        </button>
      </div>
    </form>
  );
}
