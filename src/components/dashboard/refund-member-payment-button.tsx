"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { refundMemberPayment } from "@/actions/crm";
import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";

type RefundMemberPaymentButtonProps = {
  amountLabel: string;
  orgSlug: string;
  paidAtLabel: string;
  paymentId: string;
};

export function RefundMemberPaymentButton({
  amountLabel,
  orgSlug,
  paidAtLabel,
  paymentId
}: RefundMemberPaymentButtonProps) {
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
        Refund payment
      </button>

      <DashboardDialog
        description="This will trigger a Stripe refund for the latest successful payment and then update the CRM record."
        eyebrow="Refund"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Refund member payment"
      >
        <form
          className="dashboard-form dialog-form"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              setStatusMessage(null);
              const result = await refundMemberPayment({
                orgSlug,
                paymentId
              });

              if (!result.ok) {
                const message = "message" in result ? result.message : "Refund failed.";
                setStatusMessage(message ?? "Refund failed.");
                return;
              }

              window.dispatchEvent(new CustomEvent("dashboard:close-modals"));
              router.refresh();
            });
          }}
        >
          <div className="form-intro-compact">
            <p className="eyebrow">Stripe refund</p>
            <h2 className="panel-title">Refund latest payment</h2>
            <p className="body-copy">Use this when the member should get the payment returned from Stripe.</p>
          </div>

          <div className="member-payment-dialog-summary">
            <div>
              <span>Amount</span>
              <strong>{amountLabel}</strong>
            </div>
            <div>
              <span>Date</span>
              <strong>{paidAtLabel}</strong>
            </div>
          </div>

          {statusMessage ? <p className="error-text">{statusMessage}</p> : null}

          <div className="dialog-action-row">
            <button className="danger-action primary-action compact" disabled={isPending} type="submit">
              {isPending ? "Refunding..." : "Confirm refund"}
            </button>
          </div>
        </form>
      </DashboardDialog>
    </>
  );
}
