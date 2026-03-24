import { describe, expect, it } from "vitest";

import { createDefaultIntegrationFieldSelections, integrationBuilderSchema, normalizeIntegrationBuilderInput } from "@/lib/validations/integrations";

describe("integrationBuilderSchema", () => {
  it("allows draft integrations without a destination URL", () => {
    const result = integrationBuilderSchema.safeParse({
      buttonLabel: "Continue",
      destinationType: "stripe_checkout",
      destinationUrl: "",
      fieldSelections: createDefaultIntegrationFieldSelections(),
      integrationType: "onboarding_button",
      name: "Member onboarding",
      orgSlug: "demo-org",
      slug: "member-onboarding",
      status: "draft",
      summary: "",
      title: ""
    });

    expect(result.success).toBe(true);
  });

  it("requires a destination URL for active integrations", () => {
    const result = integrationBuilderSchema.safeParse({
      buttonLabel: "Continue",
      destinationType: "external_url",
      destinationUrl: "",
      fieldSelections: createDefaultIntegrationFieldSelections(),
      integrationType: "onboarding_button",
      name: "Member onboarding",
      orgSlug: "demo-org",
      slug: "member-onboarding",
      status: "active",
      summary: "",
      title: ""
    });

    expect(result.success).toBe(false);
  });

  it("filters form fields down to enabled selections", () => {
    const normalized = normalizeIntegrationBuilderInput(
      integrationBuilderSchema.parse({
        buttonLabel: "Continue",
        destinationType: "external_url",
        destinationUrl: "https://example.org",
        fieldSelections: createDefaultIntegrationFieldSelections().map((field) =>
          field.key === "company"
            ? { ...field, enabled: true }
            : field
        ),
        integrationType: "onboarding_form",
        name: "Member onboarding",
        orgSlug: "demo-org",
        slug: "member-onboarding",
        status: "active",
        summary: "",
        title: ""
      })
    );

    expect(normalized.fields.map((field) => field.key)).toEqual(["email", "company"]);
  });

  it("does not require a URL for connected Stripe checkout", () => {
    const result = integrationBuilderSchema.safeParse({
      buttonLabel: "Continue",
      destinationType: "stripe_checkout",
      destinationUrl: "",
      fieldSelections: createDefaultIntegrationFieldSelections(),
      integrationType: "onboarding_button",
      name: "Member onboarding",
      orgSlug: "demo-org",
      slug: "member-onboarding",
      status: "active",
      summary: "",
      title: ""
    });

    expect(result.success).toBe(true);
  });
});
