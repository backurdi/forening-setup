"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import { sendSettingsTestEmail, updateEmailSettings } from "@/actions/settings";
import { FieldShell } from "@/components/dashboard/field-shell";
import { BellIcon, MailIcon, UserIcon } from "@/components/dashboard/icons";
import { emailSettingsSchema, type EmailSettingsInput } from "@/lib/validations/settings";

type EmailSettingsFormProps = {
  settings: EmailSettingsInput;
};

export function EmailSettingsForm({ settings }: EmailSettingsFormProps) {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSendingTest, startTestTransition] = useTransition();
  const form = useForm<EmailSettingsInput>({
    defaultValues: settings,
    resolver: zodResolver(emailSettingsSchema)
  });
  const adminNotificationEmail = useWatch({
    control: form.control,
    name: "adminNotificationEmail"
  });
  const emailFromAddress = useWatch({
    control: form.control,
    name: "emailFromAddress"
  });
  const testTarget = adminNotificationEmail || emailFromAddress;

  return (
    <form
      className="section-card dashboard-form"
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          setStatusMessage(null);
          const result = await updateEmailSettings(values);

          if (!result.ok) {
            setStatusMessage("Email settings could not be saved.");
            return;
          }

          router.refresh();
          setStatusMessage("Email settings saved.");
        })
      )}
    >
      <div>
        <p className="eyebrow">Email settings</p>
        <h2 className="panel-title">Delivery and automations</h2>
        <p className="body-copy">Configure sender identity, welcome email content, subscriber automation, and a simple test-send flow.</p>
      </div>

      <div className="form-grid">
        <label>
          From name
          <FieldShell icon={<UserIcon />}>
            <input {...form.register("emailFromName")} />
          </FieldShell>
        </label>
        <label>
          From address
          <FieldShell icon={<MailIcon />}>
            <input {...form.register("emailFromAddress")} type="email" />
          </FieldShell>
        </label>
        <label>
          Reply-to
          <FieldShell icon={<MailIcon />}>
            <input {...form.register("emailReplyTo")} type="email" />
          </FieldShell>
        </label>
        <label>
          Admin notification email
          <FieldShell icon={<BellIcon />}>
            <input {...form.register("adminNotificationEmail")} type="email" />
          </FieldShell>
        </label>
      </div>

      <label className="checkbox-row">
        <input {...form.register("welcomeEmailEnabled")} type="checkbox" />
        Send welcome emails to members after successful activation/payment
      </label>

      <label>
        Welcome email subject
        <FieldShell icon={<MailIcon />}>
          <input {...form.register("welcomeEmailSubject")} placeholder="Welcome to {{organizationName}}" />
        </FieldShell>
      </label>

      <label>
        Welcome email body
        <FieldShell icon={<MailIcon />}>
          <textarea
            {...form.register("welcomeEmailBody")}
            placeholder="Hi {{firstName}}, welcome to {{organizationName}}."
            rows={5}
          />
        </FieldShell>
      </label>

      <label className="checkbox-row">
        <input {...form.register("subscriberEmailEnabled")} type="checkbox" />
        Send confirmation emails to new subscribers
      </label>

      <label>
        Subscriber email subject
        <FieldShell icon={<MailIcon />}>
          <input {...form.register("subscriberEmailSubject")} placeholder="You're on the list for {{organizationName}}" />
        </FieldShell>
      </label>

      <label>
        Subscriber email body
        <FieldShell icon={<MailIcon />}>
          <textarea
            {...form.register("subscriberEmailBody")}
            placeholder="Hi {{firstName}}, thanks for subscribing to {{organizationName}}."
            rows={5}
          />
        </FieldShell>
      </label>

      <div className="actions-row">
        <button disabled={isPending} type="submit">
          {isPending ? "Saving..." : "Save email settings"}
        </button>
        <button
          disabled={isSendingTest || !testTarget}
          type="button"
          onClick={() =>
            startTestTransition(async () => {
              if (!testTarget) {
                setStatusMessage("Add an admin or sender email first.");
                return;
              }

              const result = await sendSettingsTestEmail({
                orgSlug: settings.orgSlug,
                recipientEmail: testTarget
              });

              const failureMessage = "message" in result ? result.message ?? "Test email failed." : "Test email failed.";
              setStatusMessage(result.ok ? `Test email sent to ${testTarget}.` : failureMessage);
              router.refresh();
            })
          }
        >
          {isSendingTest ? "Sending..." : "Send test email"}
        </button>
      </div>

      {statusMessage ? <p className="success-text">{statusMessage}</p> : null}
    </form>
  );
}
