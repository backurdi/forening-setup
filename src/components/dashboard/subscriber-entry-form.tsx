"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createNewsletterSubscriber } from "@/actions/crm";
import { FieldShell } from "@/components/dashboard/field-shell";
import { GlobeIcon, MailIcon, UserIcon } from "@/components/dashboard/icons";
import { newsletterSubscriberSchema, type NewsletterSubscriberInput } from "@/lib/validations/crm";

type SubscriberEntryFormProps = {
  orgSlug: string;
  variant?: "card" | "dialog";
};

export function SubscriberEntryForm({ orgSlug, variant = "card" }: SubscriberEntryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const form = useForm<NewsletterSubscriberInput>({
    resolver: zodResolver(newsletterSubscriberSchema),
    defaultValues: {
      email: "",
      fullName: "",
      orgSlug,
      phone: ""
    }
  });

  return (
    <form
      className={variant === "card" ? "section-card dashboard-form" : "dashboard-form dialog-form"}
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          setStatusMessage(null);
          const result = await createNewsletterSubscriber(values);
          if (!result.ok) {
            setStatusMessage("Subscriber could not be saved.");
            return;
          }
          form.reset({ ...form.getValues(), email: "", fullName: "", phone: "" });
          window.dispatchEvent(new CustomEvent("dashboard:close-modals"));
          router.refresh();
          setStatusMessage("Subscriber saved.");
        })
      )}
    >
      <div className={variant === "card" ? undefined : "form-intro-compact"}>
        <p className="eyebrow">Emails</p>
        <h2 className="panel-title">Add subscriber</h2>
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
          Phone
          <FieldShell icon={<GlobeIcon />}>
            <input {...form.register("phone")} />
          </FieldShell>
        </label>
      </div>

      {statusMessage ? <p className="success-text">{statusMessage}</p> : null}
      <button disabled={isPending} type="submit">
        {isPending ? "Saving..." : "Save subscriber"}
      </button>
    </form>
  );
}
