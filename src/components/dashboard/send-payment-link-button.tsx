"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { sendMemberPaymentLink } from "@/actions/crm";
import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import { MailIcon } from "@/components/dashboard/icons";

type SendPaymentLinkButtonProps = {
  member: {
    email: string;
    id: string;
    name: string;
  };
  orgSlug: string;
};

export function SendPaymentLinkButton({ member, orgSlug }: SendPaymentLinkButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    function closeAllDialogs() {
      setIsOpen(false);
    }

    window.addEventListener("dashboard:close-modals", closeAllDialogs);
    return () => window.removeEventListener("dashboard:close-modals", closeAllDialogs);
  }, []);

  return (
    <>
      <button className="secondary-action compact" onClick={() => setIsOpen(true)} type="button">
        <MailIcon />
        Send payment link
      </button>

      <DashboardDialog
        description={`This will send ${member.name || member.email} to the secure Stripe payment flow for this workspace.`}
        eyebrow="Billing"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Send payment link"
      >
        <form
          className="dashboard-form dialog-form"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              setStatusMessage(null);
              const result = await sendMemberPaymentLink({
                memberId: member.id,
                orgSlug
              });

              if (!result.ok) {
                const message = "message" in result ? result.message : "Payment link could not be sent.";
                setStatusMessage(message ?? "Payment link could not be sent.");
                return;
              }

              window.dispatchEvent(new CustomEvent("dashboard:close-modals"));
              router.refresh();
            });
          }}
        >
          <div className="form-intro-compact">
            <p className="eyebrow">Payment reminder</p>
            <h2 className="panel-title">Email secure payment link</h2>
            <p className="body-copy">
              We keep the card details inside Stripe. This action only sends the member to the hosted payment flow.
            </p>
          </div>

          <div className="member-payment-dialog-summary">
            <div>
              <span>Recipient</span>
              <strong>{member.name || member.email}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{member.email}</strong>
            </div>
          </div>

          {statusMessage ? <p className="error-text">{statusMessage}</p> : null}

          <div className="dialog-action-row">
            <button className="primary-action compact" disabled={isPending} type="submit">
              {isPending ? "Sending..." : "Send link"}
            </button>
          </div>
        </form>
      </DashboardDialog>
    </>
  );
}
