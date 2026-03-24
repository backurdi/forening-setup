"use client";

import { useMemo, useState } from "react";

type PublicIntegrationFormProps = {
  buttonLabel: string;
  destinationType: "external_url" | "stripe_checkout";
  destinationUrl: string;
  fields: Array<{
    fieldType: "text" | "email" | "phone" | "textarea";
    key: "company" | "email" | "first_name" | "last_name" | "notes" | "phone";
    label: string;
    required: boolean;
  }>;
  integrationType: "onboarding_button" | "onboarding_form";
  orgSlug: string;
  organizationName: string;
  summary: string;
  title: string;
};

type FormValueMap = Record<string, string>;

function getRedirectUrl(input: {
  destinationType: "external_url" | "stripe_checkout";
  destinationUrl: string;
  orgSlug: string;
  values: FormValueMap;
}) {
  if (input.destinationType === "stripe_checkout") {
    return `/${input.orgSlug}/join`;
  }

  const url = new URL(input.destinationUrl);

  Object.entries(input.values).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

export function PublicIntegrationForm({
  buttonLabel,
  destinationType,
  destinationUrl,
  fields,
  integrationType,
  orgSlug,
  organizationName,
  summary,
  title
}: PublicIntegrationFormProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [values, setValues] = useState<FormValueMap>({});
  const submitHref = useMemo(
    () => getRedirectUrl({ destinationType, destinationUrl, orgSlug, values }),
    [destinationType, destinationUrl, orgSlug, values]
  );

  function updateValue(key: string, value: string) {
    setValues((current) => ({
      ...current,
      [key]: value
    }));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const missingRequired = fields.find((field) => field.required && !values[field.key]?.trim());

    if (missingRequired) {
      setStatusMessage(`${missingRequired.label} is required.`);
      return;
    }

    window.location.assign(submitHref);
  }

  if (integrationType === "onboarding_button") {
    return (
      <section className="section-card">
        <p className="eyebrow">Hosted integration</p>
        <h2>{title}</h2>
        <p className="body-copy">{summary || `Continue with ${organizationName}.`}</p>
        <div className="actions-row">
          <a className="link-button active" href={submitHref}>
            {buttonLabel}
          </a>
        </div>
      </section>
    );
  }

  return (
    <form className="section-card" onSubmit={onSubmit}>
      <p className="eyebrow">Hosted integration</p>
      <h2>{title}</h2>
      <p className="body-copy">{summary || `Share your details with ${organizationName} before continuing.`}</p>

      <div className="form-grid">
        {fields.map((field) => (
          <label key={field.key}>
            {field.label}
            {field.fieldType === "textarea" ? (
              <textarea
                onChange={(event) => updateValue(field.key, event.target.value)}
                required={field.required}
                rows={4}
                value={values[field.key] ?? ""}
              />
            ) : (
              <input
                onChange={(event) => updateValue(field.key, event.target.value)}
                required={field.required}
                type={field.fieldType === "phone" ? "tel" : field.fieldType}
                value={values[field.key] ?? ""}
              />
            )}
          </label>
        ))}
      </div>

      <button style={{ marginTop: 18 }} type="submit">
        {buttonLabel}
      </button>

      {statusMessage ? <p className="route-note">{statusMessage}</p> : null}
    </form>
  );
}
