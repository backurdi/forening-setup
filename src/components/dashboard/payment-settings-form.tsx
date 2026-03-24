"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import { updatePaymentSettings } from "@/actions/settings";
import { FieldShell } from "@/components/dashboard/field-shell";
import { GlobeIcon, MembersIcon, PaymentIcon, ReceiptIcon } from "@/components/dashboard/icons";
import { paymentSettingsSchema, type PaymentSettingsInput } from "@/lib/validations/settings";

type PaymentSettingsFormProps = {
  settings: PaymentSettingsInput;
};

export function PaymentSettingsForm({ settings }: PaymentSettingsFormProps) {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<PaymentSettingsInput>({
    defaultValues: settings,
    resolver: zodResolver(paymentSettingsSchema)
  });
  const provider = useWatch({
    control: form.control,
    name: "paymentProvider"
  });

  return (
    <form
      className="section-card dashboard-form"
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          setStatusMessage(null);
          const result = await updatePaymentSettings(values);

          if (!result.ok) {
            setStatusMessage("Payment settings could not be saved.");
            return;
          }

          router.refresh();
          setStatusMessage("Payment settings saved.");
        })
      )}
    >
      <div>
        <p className="eyebrow">Payment settings</p>
        <h2 className="panel-title">Membership billing</h2>
        <p className="body-copy">Control whether the hosted join flow uses manual registration or hands members into Stripe checkout.</p>
      </div>

      <div className="form-grid">
        <label>
          Payment provider
          <FieldShell icon={<ReceiptIcon />}>
            <select {...form.register("paymentProvider")}>
              <option value="manual">Manual handling</option>
              <option value="stripe">Stripe checkout</option>
            </select>
          </FieldShell>
        </label>
        <label>
          Default plan name
          <FieldShell icon={<MembersIcon />}>
            <input {...form.register("defaultPlanName")} />
          </FieldShell>
        </label>
        <label>
          Default currency
          <FieldShell icon={<GlobeIcon />}>
            <input {...form.register("defaultCurrency")} />
          </FieldShell>
        </label>
        <label>
          Monthly amount in minor units
          <FieldShell icon={<PaymentIcon />}>
            <input {...form.register("defaultMembershipAmountMinor", { valueAsNumber: true })} type="number" />
          </FieldShell>
        </label>
        <label>
          Stripe product name
          <FieldShell icon={<MembersIcon />}>
            <input {...form.register("stripeProductName")} placeholder="Monthly member" />
          </FieldShell>
        </label>
        <label>
          Stripe price ID
          <FieldShell icon={<ReceiptIcon />}>
            <input {...form.register("stripePriceId")} placeholder="price_1234" />
          </FieldShell>
        </label>
      </div>

      <div className="notice-card">
        {provider === "stripe"
          ? "With Stripe enabled, the hosted join page creates a recurring checkout session. If a Price ID is left empty, the app builds a monthly recurring price from the amount and currency above."
          : "Manual mode keeps public signups in the CRM without redirecting to checkout. Use this while onboarding or if the organization takes payment offline."}
      </div>

      {statusMessage ? <p className="success-text">{statusMessage}</p> : null}

      <button disabled={isPending} type="submit">
        {isPending ? "Saving..." : "Save payment settings"}
      </button>
    </form>
  );
}
