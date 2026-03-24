"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";

import { sendSettingsTestEmail, updateEmailSettings } from "@/actions/settings";
import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import { FieldShell } from "@/components/dashboard/field-shell";
import { BellIcon, MailIcon, UserIcon } from "@/components/dashboard/icons";
import { emailSettingsSchema, type EmailSettingsInput } from "@/lib/validations/settings";

type EmailSettingsFormProps = {
  settings: EmailSettingsInput;
};

type TemplateKey = "subscriber" | "welcome";

const TEMPLATE_CONFIG = {
  subscriber: {
    bodyName: "subscriberEmailBody" as const,
    description: "Confirmation email for new subscribers.",
    enabledName: "subscriberEmailEnabled" as const,
    subjectName: "subscriberEmailSubject" as const,
    title: "Subscriber confirmation"
  },
  welcome: {
    bodyName: "welcomeEmailBody" as const,
    description: "Welcome email sent after successful activation/payment.",
    enabledName: "welcomeEmailEnabled" as const,
    subjectName: "welcomeEmailSubject" as const,
    title: "Welcome email"
  }
} satisfies Record<
  TemplateKey,
  {
    bodyName: "subscriberEmailBody" | "welcomeEmailBody";
    description: string;
    enabledName: "subscriberEmailEnabled" | "welcomeEmailEnabled";
    subjectName: "subscriberEmailSubject" | "welcomeEmailSubject";
    title: string;
  }
>;

function truncateText(value: string | undefined, fallback: string) {
  const normalized = value?.trim();

  if (!normalized) {
    return fallback;
  }

  return normalized.length > 88 ? `${normalized.slice(0, 85)}...` : normalized;
}

export function EmailSettingsForm({ settings }: EmailSettingsFormProps) {
  const router = useRouter();
  const [activeTemplate, setActiveTemplate] = useState<TemplateKey | null>(null);
  const [lastSavedScope, setLastSavedScope] = useState<TemplateKey | "settings" | null>(null);
  const [sendingTemplate, setSendingTemplate] = useState<TemplateKey | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSendingTest, startTestTransition] = useTransition();
  const form = useForm<EmailSettingsInput>({
    defaultValues: settings,
    resolver: zodResolver(emailSettingsSchema) as Resolver<EmailSettingsInput>
  });

  const adminNotificationEmail = useWatch({
    control: form.control,
    name: "adminNotificationEmail"
  });
  const emailFromAddress = useWatch({
    control: form.control,
    name: "emailFromAddress"
  });
  const subscriberEmailBody = useWatch({
    control: form.control,
    name: "subscriberEmailBody"
  });
  const subscriberEmailEnabled = useWatch({
    control: form.control,
    name: "subscriberEmailEnabled"
  });
  const subscriberEmailSubject = useWatch({
    control: form.control,
    name: "subscriberEmailSubject"
  });
  const welcomeEmailBody = useWatch({
    control: form.control,
    name: "welcomeEmailBody"
  });
  const welcomeEmailEnabled = useWatch({
    control: form.control,
    name: "welcomeEmailEnabled"
  });
  const welcomeEmailSubject = useWatch({
    control: form.control,
    name: "welcomeEmailSubject"
  });

  const templateItems = useMemo(
    () => [
      {
        description: TEMPLATE_CONFIG.welcome.description,
        enabled: welcomeEmailEnabled,
        key: "welcome" as const,
        preview: truncateText(welcomeEmailBody, "Hi {{firstName}}, welcome to {{organizationName}}."),
        subject: welcomeEmailSubject || "Welcome to {{organizationName}}",
        title: TEMPLATE_CONFIG.welcome.title
      },
      {
        description: TEMPLATE_CONFIG.subscriber.description,
        enabled: subscriberEmailEnabled,
        key: "subscriber" as const,
        preview: truncateText(subscriberEmailBody, "Hi {{firstName}}, thanks for subscribing to {{organizationName}}."),
        subject: subscriberEmailSubject || "You're on the list for {{organizationName}}",
        title: TEMPLATE_CONFIG.subscriber.title
      }
    ],
    [
      subscriberEmailBody,
      subscriberEmailEnabled,
      subscriberEmailSubject,
      welcomeEmailBody,
      welcomeEmailEnabled,
      welcomeEmailSubject
    ]
  );

  const activeTemplateConfig = activeTemplate ? TEMPLATE_CONFIG[activeTemplate] : null;
  const testTarget = adminNotificationEmail || emailFromAddress;
  const dirtyFields = form.formState.dirtyFields;
  const settingsDirty = Boolean(
    dirtyFields.adminNotificationEmail || dirtyFields.emailFromAddress || dirtyFields.emailFromName || dirtyFields.emailReplyTo
  );
  const activeTemplateDirty = activeTemplate
    ? Boolean(
        dirtyFields[TEMPLATE_CONFIG[activeTemplate].bodyName] ||
          dirtyFields[TEMPLATE_CONFIG[activeTemplate].enabledName] ||
          dirtyFields[TEMPLATE_CONFIG[activeTemplate].subjectName]
      )
    : false;
  const settingsSaved = lastSavedScope === "settings" && !settingsDirty;
  const activeTemplateSaved = activeTemplate !== null && lastSavedScope === activeTemplate && !activeTemplateDirty;

  function saveSettings(scope: TemplateKey | "settings") {
    const submit = form.handleSubmit((values) =>
      startTransition(async () => {
        setStatusMessage(null);
        const result = await updateEmailSettings(values);

        if (!result.ok) {
          setStatusMessage("Email settings could not be saved.");
          return;
        }

        form.reset(values);
        router.refresh();
        setStatusMessage("Email settings saved.");
        setLastSavedScope(scope);
      })
    );

    void submit();
  }

  return (
    <>
      <form
        className="section-card dashboard-form"
        onSubmit={(event) => {
          event.preventDefault();
          saveSettings("settings");
        }}
      >
        <div className="dashboard-form-header">
          <div>
            <p className="eyebrow">Email settings</p>
            <h2 className="panel-title">Delivery and automations</h2>
            <p className="body-copy">Configure sender identity, then open a specific template to edit its subject, body, and enabled state.</p>
          </div>

          <button className="dashboard-inline-action" disabled={isPending || !settingsDirty} type="submit">
            {isPending ? "Saving..." : settingsSaved ? "Saved" : "Save email settings"}
          </button>
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

        <section className="email-template-browser">
          <div className="email-template-browser-header">
            <div>
              <p className="eyebrow">Templates</p>
              <h3 className="panel-title">Email templates</h3>
              <p className="body-copy">Open a template to adjust the form for that specific email.</p>
            </div>
          </div>

          <div className="email-template-grid">
            {templateItems.map((template) => (
              <article key={template.key} className="email-template-card">
                <button className="email-template-card-surface" type="button" onClick={() => setActiveTemplate(template.key)}>
                  <div className="email-template-card-top">
                    <span className={template.enabled ? "email-template-status enabled" : "email-template-status"}>
                      {template.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="email-template-card-copy">
                    <strong>{template.title}</strong>
                    <span>{template.description}</span>
                    <small>{template.subject}</small>
                    <p>{template.preview}</p>
                  </div>
                </button>

                <div className="email-template-card-actions">
                  <button
                    className="email-template-card-action"
                    disabled={isPending || isSendingTest || !testTarget}
                    type="button"
                    onClick={() =>
                      startTestTransition(async () => {
                        if (!testTarget) {
                          setStatusMessage("Add an admin or sender email first.");
                          return;
                        }

                        setSendingTemplate(template.key);
                        setStatusMessage(null);

                        try {
                          const result = await sendSettingsTestEmail({
                            orgSlug: settings.orgSlug,
                            recipientEmail: testTarget,
                            template: template.key
                          });

                          const failureMessage = "message" in result ? result.message ?? "Test email failed." : "Test email failed.";
                          setStatusMessage(result.ok ? `${template.title} test email sent to ${testTarget}.` : failureMessage);
                          router.refresh();
                        } finally {
                          setSendingTemplate(null);
                        }
                      })
                    }
                  >
                    {sendingTemplate === template.key ? "Sending..." : "Send test"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {statusMessage ? <p className="success-text">{statusMessage}</p> : null}
      </form>

      <DashboardDialog
        description={
          activeTemplateConfig
            ? `Update the settings for ${activeTemplateConfig.title.toLowerCase()}.`
            : undefined
        }
        eyebrow="Email template"
        isOpen={activeTemplate !== null}
        onClose={() => setActiveTemplate(null)}
        title={activeTemplateConfig ? activeTemplateConfig.title : "Email template"}
      >
        {activeTemplateConfig ? (
          <div className="dashboard-form dialog-form email-template-dialog-form">
            <label className="checkbox-row">
              <input {...form.register(activeTemplateConfig.enabledName)} type="checkbox" />
              {activeTemplate === "welcome"
                ? "Send welcome emails to members after successful activation/payment"
                : "Send confirmation emails to new subscribers"}
            </label>

            <label>
              {activeTemplateConfig.title} subject
              <FieldShell icon={<MailIcon />}>
                <input
                  {...form.register(activeTemplateConfig.subjectName)}
                  placeholder={
                    activeTemplate === "welcome"
                      ? "Welcome to {{organizationName}}"
                      : "You're on the list for {{organizationName}}"
                  }
                />
              </FieldShell>
            </label>

            <label>
              {activeTemplateConfig.title} body
              <FieldShell icon={<MailIcon />}>
                <textarea
                  {...form.register(activeTemplateConfig.bodyName)}
                  placeholder={
                    activeTemplate === "welcome"
                      ? "Hi {{firstName}}, welcome to {{organizationName}}."
                      : "Hi {{firstName}}, thanks for subscribing to {{organizationName}}."
                  }
                  rows={8}
                />
              </FieldShell>
            </label>

            <div className="actions-row">
              <button type="button" onClick={() => setActiveTemplate(null)}>
                Close
              </button>
              <button disabled={isPending || !activeTemplateDirty} type="button" onClick={() => activeTemplate && saveSettings(activeTemplate)}>
                {isPending ? "Saving..." : activeTemplateSaved ? "Saved" : "Save template"}
              </button>
            </div>
          </div>
        ) : null}
      </DashboardDialog>
    </>
  );
}
