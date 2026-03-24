"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import { saveIntegration } from "@/actions/integrations";
import { FieldShell } from "@/components/dashboard/field-shell";
import {
  BuildingIcon,
  GlobeIcon,
  GridIcon,
  HelpCircleIcon,
  MembersIcon,
  PaymentIcon,
  ReceiptIcon
} from "@/components/dashboard/icons";
import {
  createDefaultIntegrationFieldSelections,
  integrationBuilderSchema,
  integrationFieldCatalog,
  type IntegrationBuilderInput
} from "@/lib/validations/integrations";

type CreateIntegrationFlowProps = {
  initialValues?: Partial<IntegrationBuilderInput>;
  orgSlug: string;
  stripeConnected: boolean;
  submitLabel?: string;
};

const stepLabels = {
  basics: "Basics",
  destination: "Destination",
  experience: "Experience",
  fields: "Fields"
} as const;

type IntegrationFlowStep = keyof typeof stepLabels;

export function CreateIntegrationFlow({
  initialValues,
  orgSlug,
  stripeConnected,
  submitLabel = "Create integration"
}: CreateIntegrationFlowProps) {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<IntegrationBuilderInput>({
    defaultValues: {
      buttonLabel: "Continue",
      destinationType: "stripe_checkout",
      destinationUrl: "",
      existingSlug: "",
      fieldSelections: createDefaultIntegrationFieldSelections(),
      integrationType: "onboarding_button",
      name: "",
      orgSlug,
      slug: "",
      status: "draft",
      summary: "",
      title: "",
      ...initialValues
    },
    resolver: zodResolver(integrationBuilderSchema)
  });
  const integrationType = useWatch({
    control: form.control,
    name: "integrationType"
  });
  const status = useWatch({
    control: form.control,
    name: "status"
  });
  const destinationType = useWatch({
    control: form.control,
    name: "destinationType"
  });
  const fieldSelections = useWatch({
    control: form.control,
    defaultValue: createDefaultIntegrationFieldSelections(),
    name: "fieldSelections"
  });

  const steps =
    integrationType === "onboarding_form"
      ? (["basics", "experience", "fields", "destination"] as const)
      : (["basics", "experience", "destination"] as const);
  const currentStep = steps[currentStepIndex] ?? steps[0];

  useEffect(() => {
    if (currentStepIndex > steps.length - 1) {
      setCurrentStepIndex(steps.length - 1);
    }
  }, [currentStepIndex, steps]);

  useEffect(() => {
    fieldSelections.forEach((field, index) => {
      if (!field.enabled && field.required) {
        form.setValue(`fieldSelections.${index}.required`, false);
      }
    });
  }, [fieldSelections, form]);

  function fieldPathsForStep(step: IntegrationFlowStep) {
    if (step === "basics") {
      return ["name", "slug", "status"] as const;
    }

    if (step === "experience") {
      return ["integrationType", "title", "buttonLabel", "summary"] as const;
    }

    if (step === "destination") {
      return ["destinationType", "destinationUrl"] as const;
    }

    return ["fieldSelections"] as const;
  }

  async function goToNextStep() {
    const isValid = await form.trigger(fieldPathsForStep(currentStep));

    if (!isValid) {
      return;
    }

    setCurrentStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }

  const onSubmit = form.handleSubmit((values) => {
    setStatusMessage(null);

    startTransition(async () => {
      const result = await saveIntegration(values);

      if (!result.ok) {
        setStatusMessage("message" in result ? result.message : "Integration could not be created.");
        return;
      }

      form.reset({
        buttonLabel: "Continue",
        destinationType: "stripe_checkout",
        destinationUrl: "",
        existingSlug: "",
        fieldSelections: createDefaultIntegrationFieldSelections(),
        integrationType: "onboarding_button",
        name: "",
        orgSlug,
        slug: "",
        status: "draft",
        summary: "",
        title: ""
      });
      setCurrentStepIndex(0);
      window.dispatchEvent(new CustomEvent("dashboard:close-modals"));
      router.refresh();
    });
  });

  return (
    <form className="dashboard-form dialog-form integration-flow" onSubmit={onSubmit}>
      <div className="integration-stepper" role="list" aria-label="Create integration steps">
        {steps.map((step, index) => (
          <div
            className={index === currentStepIndex ? "integration-step active" : "integration-step"}
            key={step}
            role="listitem"
          >
            <span>{index + 1}</span>
            {stepLabels[step]}
          </div>
        ))}
      </div>

      {currentStep === "basics" ? (
        <section className="integration-step-panel">
          <div className="form-intro-compact">
            <p className="eyebrow">Step 1</p>
            <h2 className="panel-title">Name and stage the integration</h2>
            <p className="body-copy">Start with the admin-facing basics. Keep it in draft until the destination details are ready.</p>
          </div>

          <div className="form-grid">
            <label>
              Integration name
              <FieldShell icon={<BuildingIcon />}>
                <input {...form.register("name")} placeholder="New member onboarding" />
              </FieldShell>
            </label>
            <label>
              Slug
              <FieldShell icon={<GlobeIcon />}>
                <input {...form.register("slug")} placeholder="new-member-onboarding" />
              </FieldShell>
            </label>
            <label>
              Status
              <FieldShell icon={<GridIcon />}>
                <select {...form.register("status")}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </FieldShell>
            </label>
          </div>

          <label>
            Internal summary
            <FieldShell icon={<HelpCircleIcon />}>
              <textarea
                {...form.register("summary")}
                placeholder="Where this integration will be used and what it should do."
                rows={3}
              />
            </FieldShell>
          </label>

          <div className="notice-card">
            {status === "draft"
              ? "Draft integrations can be created even if some later steps are still unfinished."
              : "Active integrations should be ready to use as soon as they are created."}
          </div>
        </section>
      ) : null}

      {currentStep === "experience" ? (
        <section className="integration-step-panel">
          <div className="form-intro-compact">
            <p className="eyebrow">Step 2</p>
            <h2 className="panel-title">Choose the experience type</h2>
            <p className="body-copy">Decide whether this integration is just a launch button or a form that collects onboarding details first.</p>
          </div>

          <div className="form-grid">
            <label>
              Integration type
              <FieldShell icon={<MembersIcon />}>
                <select {...form.register("integrationType")}>
                  <option value="onboarding_button">Onboarding button</option>
                  <option value="onboarding_form">Onboarding form</option>
                </select>
              </FieldShell>
            </label>
            <label>
              Public title
              <FieldShell icon={<ReceiptIcon />}>
                <input {...form.register("title")} placeholder="Complete your onboarding" />
              </FieldShell>
            </label>
            <label>
              CTA label
              <FieldShell icon={<PaymentIcon />}>
                <input {...form.register("buttonLabel")} placeholder="Continue" />
              </FieldShell>
            </label>
          </div>

          <div className="notice-card">
            {integrationType === "onboarding_button"
              ? "Buttons are for simple handoffs, like opening the organization's Stripe-powered join flow directly."
              : "Forms are for collecting some onboarding details before sending the user into the next step."}
          </div>
        </section>
      ) : null}

      {currentStep === "fields" ? (
        <section className="integration-step-panel">
          <div className="form-intro-compact">
            <p className="eyebrow">Step 3</p>
            <h2 className="panel-title">Pick the onboarding fields</h2>
            <p className="body-copy">Only enable the fields this form truly needs. Required is optional per field.</p>
          </div>

          <div className="integration-field-grid">
            {fieldSelections.map((selection, index) => {
              const field = integrationFieldCatalog[selection.key];
              const isEnabled = fieldSelections[index]?.enabled ?? false;

              return (
                <div className="integration-field-option" key={selection.key}>
                  <div>
                    <strong>{field.label}</strong>
                    <p className="body-copy">
                      {field.fieldType === "textarea" ? "Long text field" : `${field.fieldType} field`}
                    </p>
                  </div>
                  <label className="checkbox-row">
                    <input {...form.register(`fieldSelections.${index}.enabled`)} type="checkbox" />
                    Include
                  </label>
                  <label className="checkbox-row">
                    <input {...form.register(`fieldSelections.${index}.required`)} disabled={!isEnabled} type="checkbox" />
                    Required
                  </label>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {currentStep === "destination" ? (
        <section className="integration-step-panel">
          <div className="form-intro-compact">
            <p className="eyebrow">Final step</p>
            <h2 className="panel-title">Set the destination</h2>
            <p className="body-copy">Use the connected Stripe account automatically, or route people to another external destination.</p>
          </div>

          <div className="form-grid">
            <label>
              Destination type
              <FieldShell icon={<PaymentIcon />}>
                <select {...form.register("destinationType")}>
                  <option value="stripe_checkout">Connected Stripe checkout</option>
                  <option value="external_url">External URL</option>
                </select>
              </FieldShell>
            </label>
            {destinationType === "external_url" ? (
              <label>
                External URL
                <FieldShell icon={<GlobeIcon />}>
                  <input
                    {...form.register("destinationUrl")}
                    placeholder="https://example.org/next-step"
                    type="url"
                  />
                </FieldShell>
              </label>
            ) : null}
          </div>

          <div className="notice-card">
            {destinationType === "stripe_checkout"
              ? stripeConnected
                ? "This integration will use the organization's connected Stripe account automatically. Users do not need a separate Stripe URL configured here."
                : "Stripe is not connected yet for this workspace. Connect Stripe in Payment settings before creating a Stripe integration."
              : status === "active"
                ? "Because this integration is active, the external destination URL should be ready before you create it."
                : "Leave the external URL empty for now if you just want to save a draft."}
          </div>
        </section>
      ) : null}

      {statusMessage ? <p className="error-text">{statusMessage}</p> : null}

      <div className="integration-flow-actions">
        <button
          className="secondary-action"
          disabled={isPending || currentStepIndex === 0}
          onClick={() => setCurrentStepIndex((index) => Math.max(index - 1, 0))}
          type="button"
        >
          Back
        </button>

        {currentStepIndex < steps.length - 1 ? (
          <button disabled={isPending} type="button" onClick={goToNextStep}>
            Next step
          </button>
        ) : (
          <button disabled={isPending} type="submit">
            {isPending ? "Saving..." : submitLabel}
          </button>
        )}
      </div>
    </form>
  );
}
