"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createManualMember, createNewsletterSubscriber, recordManualPayment } from "@/actions/crm";
import {
  manualMemberSchema,
  manualPaymentSchema,
  newsletterSubscriberSchema,
  type ManualMemberInput,
  type ManualPaymentInput,
  type NewsletterSubscriberInput
} from "@/lib/validations/crm";

type CrmIntakePanelProps = {
  orgSlug: string;
};

type PanelMode = "member" | "subscriber" | "payment";

const panelCopy: Record<PanelMode, { description: string; title: string }> = {
  member: {
    description: "Add or update someone as a member manually.",
    title: "Register member"
  },
  payment: {
    description: "Record a payment when it happened outside the automated checkout flow.",
    title: "Record payment"
  },
  subscriber: {
    description: "Capture newsletter subscribers and email-only supporters.",
    title: "Add subscriber"
  }
};

export function CrmIntakePanel({ orgSlug }: CrmIntakePanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<PanelMode>("member");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const memberForm = useForm<ManualMemberInput>({
    resolver: zodResolver(manualMemberSchema),
    defaultValues: {
      consentToEmail: true,
      email: "",
      firstName: "",
      lastName: "",
      orgSlug,
      phone: "",
      planName: "Monthly member",
      status: "active"
    }
  });

  const subscriberForm = useForm<NewsletterSubscriberInput>({
    resolver: zodResolver(newsletterSubscriberSchema),
    defaultValues: {
      email: "",
      fullName: "",
      orgSlug,
      phone: ""
    }
  });

  const paymentForm = useForm<ManualPaymentInput>({
    resolver: zodResolver(manualPaymentSchema),
    defaultValues: {
      amountMinor: 5000,
      category: "membership",
      currency: "DKK",
      email: "",
      fullName: "",
      note: "",
      orgSlug,
      provider: "manual",
      status: "succeeded"
    }
  });

  const activeCopy = useMemo(() => panelCopy[mode], [mode]);

  function refreshPanel() {
    router.refresh();
  }

  return (
    <section className="section-card dashboard-form">
      <div>
        <p className="eyebrow">CRM intake</p>
        <h2 className="panel-title">{activeCopy.title}</h2>
        <p className="body-copy">{activeCopy.description}</p>
      </div>

      <div className="segmented-control" role="tablist" aria-label="CRM intake modes">
        {(["member", "subscriber", "payment"] as const).map((item) => (
          <button
            aria-selected={mode === item}
            className={mode === item ? "segment active" : "segment"}
            key={item}
            onClick={() => setMode(item)}
            role="tab"
            type="button"
          >
            {panelCopy[item].title}
          </button>
        ))}
      </div>

      {mode === "member" ? (
        <form
          onSubmit={memberForm.handleSubmit((values) =>
            startTransition(async () => {
              setStatusMessage(null);
              const result = await createManualMember(values);
              if (!result.ok) {
                setStatusMessage("Member could not be saved.");
                return;
              }
              memberForm.reset({ ...memberForm.getValues(), email: "", firstName: "", lastName: "", phone: "" });
              refreshPanel();
              setStatusMessage("Member saved.");
            })
          )}
        >
          <div className="form-grid">
            <label>
              First name
              <input {...memberForm.register("firstName")} />
            </label>
            <label>
              Last name
              <input {...memberForm.register("lastName")} />
            </label>
            <label>
              Email
              <input {...memberForm.register("email")} type="email" />
            </label>
            <label>
              Phone
              <input {...memberForm.register("phone")} />
            </label>
            <label>
              Plan
              <input {...memberForm.register("planName")} />
            </label>
            <label>
              Status
              <select {...memberForm.register("status")}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="past_due">Past due</option>
                <option value="canceled">Canceled</option>
                <option value="expired">Expired</option>
              </select>
            </label>
          </div>

          <label className="checkbox-row">
            <input {...memberForm.register("consentToEmail")} type="checkbox" />
            Allow membership-related email
          </label>

          {statusMessage ? <p className="success-text">{statusMessage}</p> : null}
          <button disabled={isPending} type="submit">
            {isPending ? "Saving..." : "Save member"}
          </button>
        </form>
      ) : null}

      {mode === "subscriber" ? (
        <form
          onSubmit={subscriberForm.handleSubmit((values) =>
            startTransition(async () => {
              setStatusMessage(null);
              const result = await createNewsletterSubscriber(values);
              if (!result.ok) {
                setStatusMessage("Subscriber could not be saved.");
                return;
              }
              subscriberForm.reset({ ...subscriberForm.getValues(), email: "", fullName: "", phone: "" });
              refreshPanel();
              setStatusMessage("Subscriber saved.");
            })
          )}
        >
          <div className="form-grid">
            <label>
              Full name
              <input {...subscriberForm.register("fullName")} />
            </label>
            <label>
              Email
              <input {...subscriberForm.register("email")} type="email" />
            </label>
            <label>
              Phone
              <input {...subscriberForm.register("phone")} />
            </label>
          </div>

          {statusMessage ? <p className="success-text">{statusMessage}</p> : null}
          <button disabled={isPending} type="submit">
            {isPending ? "Saving..." : "Save subscriber"}
          </button>
        </form>
      ) : null}

      {mode === "payment" ? (
        <form
          onSubmit={paymentForm.handleSubmit((values) =>
            startTransition(async () => {
              setStatusMessage(null);
              const result = await recordManualPayment(values);
              if (!result.ok) {
                setStatusMessage("Payment could not be recorded.");
                return;
              }
              paymentForm.reset({ ...paymentForm.getValues(), email: "", fullName: "", note: "" });
              refreshPanel();
              setStatusMessage("Payment recorded.");
            })
          )}
        >
          <div className="form-grid">
            <label>
              Full name
              <input {...paymentForm.register("fullName")} />
            </label>
            <label>
              Email
              <input {...paymentForm.register("email")} type="email" />
            </label>
            <label>
              Amount in minor units
              <input {...paymentForm.register("amountMinor", { valueAsNumber: true })} type="number" />
            </label>
            <label>
              Currency
              <input {...paymentForm.register("currency")} />
            </label>
            <label>
              Category
              <select {...paymentForm.register("category")}>
                <option value="membership">Membership</option>
                <option value="support">Support</option>
                <option value="donation">Donation</option>
              </select>
            </label>
            <label>
              Provider
              <select {...paymentForm.register("provider")}>
                <option value="manual">Manual</option>
                <option value="stripe">Stripe</option>
                <option value="mobilepay">MobilePay</option>
              </select>
            </label>
            <label>
              Status
              <select {...paymentForm.register("status")}>
                <option value="succeeded">Succeeded</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </label>
          </div>

          <label>
            Note
            <textarea {...paymentForm.register("note")} rows={3} />
          </label>

          {statusMessage ? <p className="success-text">{statusMessage}</p> : null}
          <button disabled={isPending} type="submit">
            {isPending ? "Saving..." : "Save payment"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
