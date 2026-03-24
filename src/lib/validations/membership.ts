import { z } from "zod";

export const membershipSignupSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6),
  consentToEmail: z.boolean()
});

export const publicMembershipSignupSchema = membershipSignupSchema.extend({
  formSlug: z.string().trim().min(1)
});

export type MembershipSignupInput = z.infer<typeof membershipSignupSchema>;
export type PublicMembershipSignupInput = z.infer<typeof publicMembershipSignupSchema>;
