"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { membershipSignupSchema, type MembershipSignupInput } from "@/lib/validations/membership";

type MembershipSignupFormProps = {
  amountMinor: number;
  defaultCurrency: string;
  formSlug: string;
  paymentProvider: "manual" | "stripe";
  organizationName: string;
  defaultPlan: string;
};

export function MembershipSignupForm({
  amountMinor,
  defaultCurrency,
  formSlug,
  paymentProvider,
  organizationName,
  defaultPlan
}: MembershipSignupFormProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const form = useForm<MembershipSignupInput>({
    resolver: zodResolver(membershipSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      consentToEmail: false
    }
  });

  async function onSubmit(values: MembershipSignupInput) {
    setStatusMessage(null);

    const response = await fetch(`/api/public/forms/${formSlug}`, {
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const payload = (await response.json()) as { message?: string; ok?: boolean; redirectUrl?: string };

    if (!response.ok || !payload.ok) {
      setStatusMessage(payload.message ?? "We could not submit your signup.");
      return;
    }

    if (payload.redirectUrl) {
      window.location.assign(payload.redirectUrl);
      return;
    }

    form.reset();
    setStatusMessage(payload.message ?? `Your signup for ${organizationName} was received.`);
  }

  const priceLabel = new Intl.NumberFormat("da-DK", {
    currency: defaultCurrency,
    style: "currency"
  }).format(amountMinor / 100);

  return (
    <form className="section-card" onSubmit={form.handleSubmit(onSubmit)}>
      <p className="eyebrow">Hosted signup form</p>
      <h2>Join {organizationName}</h2>
      <p className="body-copy">
        Default plan: {defaultPlan}. {paymentProvider === "stripe" ? `Recurring payment: ${priceLabel} per month.` : "Payment is handled manually after signup."}
      </p>

      <div className="form-grid">
        <label>
          First name
          <input {...form.register("firstName")} />
        </label>
        <label>
          Last name
          <input {...form.register("lastName")} />
        </label>
        <label>
          Email
          <input {...form.register("email")} type="email" />
        </label>
        <label>
          Phone
          <input {...form.register("phone")} />
        </label>
      </div>

      <label style={{ display: "block", marginTop: 16 }}>
        <input {...form.register("consentToEmail")} type="checkbox" />
        {" "}
        I agree to receive membership-related email.
      </label>

      <button style={{ marginTop: 18 }} type="submit">
        {paymentProvider === "stripe" ? "Continue to secure payment" : "Submit signup"}
      </button>

      {statusMessage ? <p className="route-note">{statusMessage}</p> : null}
    </form>
  );
}
