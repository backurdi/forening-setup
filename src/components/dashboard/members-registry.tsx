"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import { BulkMemberEmailForm } from "@/components/dashboard/bulk-member-email-form";
import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import { MoreHorizontalIcon } from "@/components/dashboard/icons";
import { MemberDeleteForm } from "@/components/dashboard/member-delete-form";
import type { BulkMemberEmailInput } from "@/lib/validations/crm";

type MemberRegistryMember = {
  consentToEmail: boolean;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  lastPaymentAt: number | null;
  lastPaymentStatus: "failed" | "pending" | "refunded" | "succeeded" | null;
  name: string;
  paymentCount: number;
  phone: string;
  planName: string;
  source: "admin_import" | "admin_manual" | "embed" | "hosted_form";
  status: "active" | "canceled" | "expired" | "past_due" | "pending";
  successfulPaymentCount: number;
};

type MembersRegistryProps = {
  activeCount: number;
  members: MemberRegistryMember[];
  orgSlug: string;
  pendingCount: number;
};

type EmailDialogState = {
  defaultAudience: BulkMemberEmailInput["audience"];
  description: string;
  filteredCount: number;
  filteredMemberIds: string[];
  selectedCount: number;
  selectedMemberIds: string[];
  title: string;
  type: "email";
};

type DialogState =
  | EmailDialogState
  | { member: MemberRegistryMember; type: "delete" }
  | null;

type ActionMenuState = {
  left: number;
  member: MemberRegistryMember;
  openUpward: boolean;
  top: number;
  width: number;
};

const ACTION_MENU_GUTTER = 12;
const ACTION_MENU_OFFSET = 8;
const ACTION_MENU_WIDTH = 260;
const ACTION_MENU_ESTIMATED_HEIGHT = 320;

const sourceLabels: Record<MemberRegistryMember["source"], string> = {
  admin_import: "Admin import",
  admin_manual: "Manual",
  embed: "Embed",
  hosted_form: "Hosted form"
};

function formatStatus(status: MemberRegistryMember["status"]) {
  return status.replace(/_/g, " ");
}

function formatPaymentStatus(status: MemberRegistryMember["lastPaymentStatus"]) {
  return status ? status.replace(/_/g, " ") : "none";
}

function formatDate(value: number | null) {
  if (!value) {
    return "No payment yet";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function getActionMenuState(member: MemberRegistryMember, trigger: HTMLButtonElement): ActionMenuState {
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(ACTION_MENU_WIDTH, window.innerWidth - ACTION_MENU_GUTTER * 2);
  const openUpward =
    window.innerHeight - rect.bottom < ACTION_MENU_ESTIMATED_HEIGHT && rect.top > ACTION_MENU_ESTIMATED_HEIGHT;
  const left = Math.max(
    ACTION_MENU_GUTTER,
    Math.min(rect.right - width, window.innerWidth - width - ACTION_MENU_GUTTER)
  );

  return {
    left,
    member,
    openUpward,
    top: openUpward ? rect.top - ACTION_MENU_OFFSET : rect.bottom + ACTION_MENU_OFFSET,
    width
  };
}

export function MembersRegistry({ activeCount, members, orgSlug, pendingCount }: MembersRegistryProps) {
  const router = useRouter();
  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null);
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const filteredMembers = members;

  useEffect(() => {
    if (!actionMenu) {
      return;
    }

    function closeActionMenu() {
      setActionMenu(null);
    }

    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof HTMLElement)) {
        return;
      }

      if (event.target.closest("[data-member-action-menu], [data-member-action-trigger]")) {
        return;
      }

      closeActionMenu();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeActionMenu();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closeActionMenu);
    window.addEventListener("scroll", closeActionMenu, true);
    window.addEventListener("dashboard:close-modals", closeActionMenu);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closeActionMenu);
      window.removeEventListener("scroll", closeActionMenu, true);
      window.removeEventListener("dashboard:close-modals", closeActionMenu);
    };
  }, [actionMenu]);

  function closeActionMenu() {
    setActionMenu(null);
  }

  function toggleActionMenu(member: MemberRegistryMember, event: MouseEvent<HTMLButtonElement>) {
    if (actionMenu?.member.id === member.id) {
      closeActionMenu();
      return;
    }

    setActionMenu(getActionMenuState(member, event.currentTarget));
  }

  function openRowDialog(type: Exclude<DialogState, EmailDialogState | null>["type"], member: MemberRegistryMember) {
    closeActionMenu();
    setDialogState({ member, type });
  }

  function openSingleMemberEmail(member: MemberRegistryMember) {
    closeActionMenu();
    setDialogState({
      defaultAudience: "selected",
      description: `Target ${member.name || member.email} directly, or switch to a broader audience if needed.`,
      filteredCount: filteredMembers.length,
      filteredMemberIds: [member.id],
      selectedCount: 1,
      selectedMemberIds: [member.id],
      title: `Email ${member.name || member.email}`,
      type: "email"
    });
  }

  function openMemberDetails(member: MemberRegistryMember) {
    closeActionMenu();
    router.push(`/dashboard/members/${member.id}?org=${orgSlug}`);
  }

  return (
    <>
      <section className="section-card crm-table-card">
        <div className="table-header member-table-header">
          <div className="member-table-heading">
            <p className="eyebrow">Registry</p>
            <h3 className="panel-title">Member list</h3>
          </div>
          <div className="member-table-meta">
            <p className="member-table-count">{filteredMembers.length} visible</p>
            <p className="body-copy member-table-note">Use the menu to contact the member, open their detail page, or remove the record.</p>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <p className="body-copy">No members registered yet.</p>
        ) : (
          <div className="table-shell">
            <table className="crm-table member-registry-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Contact</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Payments</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="member-primary-cell">
                        <strong>{member.name || "Unnamed"}</strong>
                        <span>{member.consentToEmail ? "Can receive member email" : "Email consent off"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="member-secondary-stack">
                        <span>{member.email}</span>
                        <span>{member.phone || "No phone"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="member-secondary-stack">
                        <span>{member.planName}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill status-${member.status}`}>{formatStatus(member.status)}</span>
                    </td>
                    <td>
                      <div className="member-secondary-stack">
                        <span>
                          {member.paymentCount === 0
                            ? "No recorded payments"
                            : member.status === "past_due" || member.lastPaymentStatus === "failed"
                              ? `Needs attention · Last ${formatPaymentStatus(member.lastPaymentStatus)}`
                              : `${member.successfulPaymentCount} successful · Last ${formatDate(member.lastPaymentAt)}`}
                        </span>
                        <span>{member.paymentCount > 0 ? `Last activity ${formatDate(member.lastPaymentAt)}` : "Open member details to add one"}</span>
                      </div>
                    </td>
                    <td>{sourceLabels[member.source]}</td>
                    <td>
                      <button
                        aria-label={`Open actions for ${member.name || member.email}`}
                        aria-expanded={actionMenu?.member.id === member.id}
                        aria-haspopup="menu"
                        className={`member-action-trigger${actionMenu?.member.id === member.id ? " is-open" : ""}`}
                        data-member-action-trigger="true"
                        onClick={(event) => toggleActionMenu(member, event)}
                        type="button"
                      >
                        <span className="sr-only">Actions</span>
                        <MoreHorizontalIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {actionMenu
        ? createPortal(
            <div
              className="member-action-menu"
              data-member-action-menu="true"
              role="menu"
              style={{
                left: `${actionMenu.left}px`,
                top: `${actionMenu.top}px`,
                transform: actionMenu.openUpward ? "translateY(-100%)" : undefined,
                width: `${actionMenu.width}px`
              }}
            >
              <button
                className="member-action-button"
                onClick={() => openSingleMemberEmail(actionMenu.member)}
                type="button"
              >
                Contact
              </button>
              <button
                className="member-action-button"
                onClick={() => openMemberDetails(actionMenu.member)}
                type="button"
              >
                Edit
              </button>
              <button
                className="member-action-button member-action-danger"
                onClick={() => openRowDialog("delete", actionMenu.member)}
                type="button"
              >
                Delete
              </button>
            </div>,
            document.body
          )
        : null}

      {dialogState?.type === "email" ? (
        <DashboardDialog
          description={dialogState.description}
          eyebrow="Email"
          isOpen
          onClose={() => setDialogState(null)}
          title={dialogState.title}
        >
          <BulkMemberEmailForm
            activeCount={activeCount}
            defaultAudience={dialogState.defaultAudience}
            filteredCount={dialogState.filteredCount}
            filteredMemberIds={dialogState.filteredMemberIds}
            orgSlug={orgSlug}
            pendingCount={pendingCount}
            selectedCount={dialogState.selectedCount}
            selectedMemberIds={dialogState.selectedMemberIds}
            totalCount={members.length}
          />
        </DashboardDialog>
      ) : null}

      {dialogState?.type === "delete" ? (
        <DashboardDialog
          description="Use this for duplicate or invalid members when you no longer need the registry record."
          eyebrow="Danger zone"
          isOpen
          onClose={() => setDialogState(null)}
          title={`Delete ${dialogState.member.name || dialogState.member.email}`}
        >
          <MemberDeleteForm
            memberEmail={dialogState.member.email}
            memberId={dialogState.member.id}
            memberName={dialogState.member.name || dialogState.member.email}
            orgSlug={orgSlug}
          />
        </DashboardDialog>
      ) : null}
    </>
  );
}
