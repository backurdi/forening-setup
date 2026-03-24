"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { recordManualPayment } from "@/actions/crm";
import { FieldShell } from "@/components/dashboard/field-shell";
import { GlobeIcon, MailIcon, MembersIcon, PaymentIcon, ReceiptIcon, UserIcon } from "@/components/dashboard/icons";
import { manualPaymentSchema, type ManualPaymentInput } from "@/lib/validations/crm";

type PaymentEntryPrefill = {
  amountMinor?: number;
  currency?: string;
  email?: string;
  fullName?: string;
  note?: string;
};

type PaymentEntryFormProps = {
  prefill?: PaymentEntryPrefill;
  orgSlug: string;
  variant?: "card" | "dialog";
};

export function PaymentEntryForm({ prefill, orgSlug, variant = "card" }: PaymentEntryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const form = useForm<ManualPaymentInput>({
    resolver: zodResolver(manualPaymentSchema),
    defaultValues: {
      amountMinor: prefill?.amountMinor ?? 5000,
      category: "membership",
      currency: prefill?.currency ?? "DKK",
      email: prefill?.email ?? "",
      fullName: prefill?.fullName ?? "",
      note: prefill?.note ?? "",
      orgSlug,
      provider: "manual",
      status: "succeeded"
    }
  });

  return (
    <form
      className={variant === "card" ? "section-card dashboard-form" : "dashboard-form dialog-form"}
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          setStatusMessage(null);
          const result = await recordManualPayment(values);
          if (!result.ok) {
            setStatusMessage("Payment could not be recorded.");
            return;
          }
          form.reset({
            ...form.getValues(),
            email: prefill?.email ?? "",
            fullName: prefill?.fullName ?? "",
            note: prefill?.note ?? ""
          });
          window.dispatchEvent(new CustomEvent("dashboard:close-modals"));
          router.refresh();
          setStatusMessage("Payment recorded.");
        })
      )}
    >
      <div className={variant === "card" ? undefined : "form-intro-compact"}>
        <p className="eyebrow">Payments</p>
        <h2 className="panel-title">{prefill?.fullName ? `Record payment for ${prefill.fullName}` : "Record payment"}</h2>
      </div>

      <div className="form-grid">
        <label>
          Full name
          <FieldShell icon={<UserIcon />}>
            <input {...form.register("fullName")} />
          </FieldShell>
        </label>
        <label>
          Email
          <FieldShell icon={<MailIcon />}>
            <input {...form.register("email")} type="email" />
          </FieldShell>
        </label>
        <label>
          Amount in minor units
          <FieldShell icon={<PaymentIcon />}>
            <input {...form.register("amountMinor", { valueAsNumber: true })} type="number" />
          </FieldShell>
        </label>
        <label>
          Currency
          <FieldShell icon={<GlobeIcon />}>
            <input {...form.register("currency")} />
          </FieldShell>
        </label>
        <label>
          Category
          <FieldShell icon={<MembersIcon />}>
            <select {...form.register("category")}>
              <option value="membership">Membership</option>
              <option value="support">Support</option>
              <option value="donation">Donation</option>
            </select>
          </FieldShell>
        </label>
        <label>
          Provider
          <FieldShell icon={<ReceiptIcon />}>
            <select {...form.register("provider")}>
              <option value="manual">Manual</option>
              <option value="stripe">Stripe</option>
              <option value="mobilepay">MobilePay</option>
            </select>
          </FieldShell>
        </label>
        <label>
          Status
          <FieldShell icon={<PaymentIcon />}>
            <select {...form.register("status")}>
              <option value="succeeded">Succeeded</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </FieldShell>
        </label>
      </div>

      <label>
        Note
        <FieldShell icon={<ReceiptIcon />}>
          <textarea {...form.register("note")} rows={3} />
        </FieldShell>
      </label>

      {statusMessage ? <p className="success-text">{statusMessage}</p> : null}
      <button disabled={isPending} type="submit">
        {isPending ? "Saving..." : "Save payment"}
      </button>
    </form>
  );
}
