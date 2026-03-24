import { z } from "zod";

const slugSchema = z.string().trim().min(2).regex(/^[a-z0-9-]+$/);
const optionalText = z.string().trim().optional().or(z.literal(""));

export const integrationTypeSchema = z.enum(["onboarding_button", "onboarding_form"]);
export const integrationStatusSchema = z.enum(["draft", "active"]);
export const integrationDestinationTypeSchema = z.enum(["stripe_checkout", "external_url"]);
export const integrationFieldKeySchema = z.enum(["first_name", "last_name", "email", "phone", "company", "notes"]);

export const integrationFieldCatalog = {
  company: {
    fieldType: "text",
    key: "company",
    label: "Company"
  },
  email: {
    fieldType: "email",
    key: "email",
    label: "Email"
  },
  first_name: {
    fieldType: "text",
    key: "first_name",
    label: "First name"
  },
  last_name: {
    fieldType: "text",
    key: "last_name",
    label: "Last name"
  },
  notes: {
    fieldType: "textarea",
    key: "notes",
    label: "Notes"
  },
  phone: {
    fieldType: "phone",
    key: "phone",
    label: "Phone"
  }
} as const;

export const integrationFieldSelectionSchema = z.object({
  enabled: z.boolean(),
  key: integrationFieldKeySchema,
  required: z.boolean()
});

export const integrationBuilderSchema = z
  .object({
    buttonLabel: optionalText,
    destinationType: integrationDestinationTypeSchema,
    destinationUrl: optionalText,
    existingSlug: optionalText,
    fieldSelections: z.array(integrationFieldSelectionSchema),
    integrationType: integrationTypeSchema,
    name: z.string().trim().min(2),
    orgSlug: slugSchema,
    slug: slugSchema,
    status: integrationStatusSchema,
    summary: optionalText,
    title: optionalText
  })
  .superRefine((input, ctx) => {
    const enabledRequiredMismatchIndex = input.fieldSelections.findIndex((field) => field.required && !field.enabled);

    if (enabledRequiredMismatchIndex >= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A field must be enabled before it can be required.",
        path: ["fieldSelections", enabledRequiredMismatchIndex, "required"]
      });
    }

    if (input.destinationType === "external_url" && input.destinationUrl) {
      const result = z.string().url().safeParse(input.destinationUrl);

      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid destination URL.",
          path: ["destinationUrl"]
        });
      }
    }

    if (input.status === "active" && input.destinationType === "external_url" && !input.destinationUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Active integrations need a destination URL.",
        path: ["destinationUrl"]
      });
    }
  });

export function createDefaultIntegrationFieldSelections() {
  return Object.values(integrationFieldCatalog).map((field) => ({
    enabled: field.key === "email",
    key: field.key,
    required: field.key === "email"
  }));
}

export function normalizeIntegrationBuilderInput(input: IntegrationBuilderInput) {
  const { fieldSelections, ...rest } = input;

  return {
    ...rest,
    buttonLabel: input.buttonLabel || undefined,
    destinationUrl: input.destinationType === "external_url" ? input.destinationUrl || undefined : undefined,
    existingSlug: input.existingSlug || undefined,
    summary: input.summary || undefined,
    title: input.title || undefined,
    fields:
      input.integrationType === "onboarding_form"
        ? fieldSelections
            .filter((field) => field.enabled)
            .map((field) => ({
              ...integrationFieldCatalog[field.key],
              required: field.required
            }))
        : []
  };
}

export type IntegrationBuilderInput = z.infer<typeof integrationBuilderSchema>;
export type IntegrationFieldSelectionInput = z.infer<typeof integrationFieldSelectionSchema>;
