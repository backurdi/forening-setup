import { z } from "zod";

export const organizationSettingsSchema = z.object({
  name: z.string().trim().min(2),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  supportEmail: z.string().trim().email(),
  websiteUrl: z.string().trim().url().optional().or(z.literal("")),
  primaryColor: z.string().trim().min(4),
  publicDescription: z.string().trim().min(8).optional().or(z.literal("")),
  publicHeadline: z.string().trim().min(8).optional().or(z.literal("")),
  defaultPlanName: z.string().trim().min(2).optional().or(z.literal(""))
});

export type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>;
