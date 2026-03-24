import { z } from "zod";

const slugSchema = z.string().trim().min(2).regex(/^[a-z0-9-]+$/);
const memberIdSchema = z.string().trim().min(1);
const paymentIdSchema = z.string().trim().min(1);
export const memberStatusSchema = z.enum(["pending", "active", "past_due", "canceled", "expired"]);

export const manualMemberSchema = z.object({
  consentToEmail: z.boolean(),
  email: z.string().trim().email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  orgSlug: slugSchema,
  phone: z.string().trim().min(6).optional().or(z.literal("")),
  planName: z.string().trim().min(2),
  status: memberStatusSchema
});

export const memberUpdateSchema = manualMemberSchema.extend({
  memberId: memberIdSchema
});

export const memberDeleteSchema = z.object({
  memberId: memberIdSchema,
  orgSlug: slugSchema
});

export const memberStatusUpdateSchema = z.object({
  memberId: memberIdSchema,
  orgSlug: slugSchema,
  status: memberStatusSchema
});

export const newsletterSubscriberSchema = z.object({
  email: z.string().trim().email(),
  fullName: z.string().trim().min(2),
  orgSlug: slugSchema,
  phone: z.string().trim().min(6).optional().or(z.literal(""))
});

export const manualPaymentSchema = z.object({
  amountMinor: z.number().int().positive(),
  category: z.enum(["membership", "support", "donation"]),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  email: z.string().trim().email(),
  fullName: z.string().trim().min(2),
  note: z.string().trim().max(300).optional().or(z.literal("")),
  orgSlug: slugSchema,
  provider: z.enum(["manual", "stripe", "mobilepay"]),
  status: z.enum(["pending", "succeeded", "failed", "refunded"])
});

export const bulkMemberEmailSchema = z.object({
  audience: z.enum(["active", "pending", "all", "selected", "filtered"]),
  body: z.string().trim().min(8),
  memberIds: z.array(memberIdSchema).default([]),
  orgSlug: slugSchema,
  subject: z.string().trim().min(2)
});

export const paymentLinkSchema = z.object({
  memberId: memberIdSchema,
  orgSlug: slugSchema
});

export const refundPaymentSchema = z.object({
  orgSlug: slugSchema,
  paymentId: paymentIdSchema
});

export type ManualMemberInput = z.infer<typeof manualMemberSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
export type MemberDeleteInput = z.infer<typeof memberDeleteSchema>;
export type MemberStatusUpdateInput = z.infer<typeof memberStatusUpdateSchema>;
export type NewsletterSubscriberInput = z.infer<typeof newsletterSubscriberSchema>;
export type ManualPaymentInput = z.infer<typeof manualPaymentSchema>;
export type BulkMemberEmailInput = z.infer<typeof bulkMemberEmailSchema>;
export type PaymentLinkInput = z.infer<typeof paymentLinkSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
