import { z } from "zod";

const slugSchema = z.string().trim().min(2).regex(/^[a-z0-9-]+$/);

export const generalSettingsSchema = z.object({
  defaultPlanName: z.string().trim().min(2),
  name: z.string().trim().min(2),
  orgSlug: slugSchema,
  primaryColor: z.string().trim().min(4),
  publicDescription: z.string().trim().min(8).optional().or(z.literal("")),
  publicHeadline: z.string().trim().min(8).optional().or(z.literal("")),
  supportEmail: z.string().trim().email(),
  websiteUrl: z.string().trim().url().optional().or(z.literal(""))
});

export const paymentSettingsSchema = z.object({
  defaultCurrency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  defaultMembershipAmountMinor: z.number().int().nonnegative(),
  defaultPlanName: z.string().trim().min(2),
  orgSlug: slugSchema,
  paymentProvider: z.enum(["manual", "stripe"]),
  stripePriceId: z.string().trim().optional().or(z.literal("")),
  stripeProductName: z.string().trim().min(2).optional().or(z.literal(""))
});

export const emailSettingsSchema = z.object({
  adminNotificationEmail: z.string().trim().email().optional().or(z.literal("")),
  emailFromAddress: z.string().trim().email().optional().or(z.literal("")),
  emailFromName: z.string().trim().min(2).optional().or(z.literal("")),
  emailReplyTo: z.string().trim().email().optional().or(z.literal("")),
  orgSlug: slugSchema,
  subscriberEmailBody: z.string().trim().min(8).optional().or(z.literal("")),
  subscriberEmailEnabled: z.boolean(),
  subscriberEmailSubject: z.string().trim().min(2).optional().or(z.literal("")),
  welcomeEmailBody: z.string().trim().min(8).optional().or(z.literal("")),
  welcomeEmailEnabled: z.boolean(),
  welcomeEmailSubject: z.string().trim().min(2).optional().or(z.literal(""))
});

export const sendTestEmailSchema = z.object({
  orgSlug: slugSchema,
  recipientEmail: z.string().trim().email(),
  template: z.enum(["subscriber", "welcome"])
});

export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>;
export type PaymentSettingsInput = z.infer<typeof paymentSettingsSchema>;
export type EmailSettingsInput = z.infer<typeof emailSettingsSchema>;
export type SendTestEmailInput = z.infer<typeof sendTestEmailSchema>;
