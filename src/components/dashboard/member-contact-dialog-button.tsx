"use client";

import { useEffect, useState } from "react";

import { BulkMemberEmailForm } from "@/components/dashboard/bulk-member-email-form";
import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import { MailIcon } from "@/components/dashboard/icons";

type MemberContactDialogButtonProps = {
  activeCount: number;
  member: {
    email: string;
    id: string;
    name: string;
  };
  orgSlug: string;
  pendingCount: number;
  totalCount: number;
};

export function MemberContactDialogButton({
  activeCount,
  member,
  orgSlug,
  pendingCount,
  totalCount
}: MemberContactDialogButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function closeAllDialogs() {
      setIsOpen(false);
    }

    window.addEventListener("dashboard:close-modals", closeAllDialogs);
    return () => window.removeEventListener("dashboard:close-modals", closeAllDialogs);
  }, []);

  return (
    <>
      <button className="secondary-action compact member-contact-button" onClick={() => setIsOpen(true)} type="button">
        <MailIcon />
        Contact
      </button>

      <DashboardDialog
        description={`Reach ${member.name || member.email} directly, or widen the audience if you need to switch context.`}
        eyebrow="Contact"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Contact ${member.name || member.email}`}
      >
        <BulkMemberEmailForm
          activeCount={activeCount}
          defaultAudience="selected"
          filteredCount={1}
          filteredMemberIds={[member.id]}
          orgSlug={orgSlug}
          pendingCount={pendingCount}
          selectedCount={1}
          selectedMemberIds={[member.id]}
          totalCount={totalCount}
        />
      </DashboardDialog>
    </>
  );
}
