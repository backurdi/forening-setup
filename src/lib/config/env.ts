import { z } from "zod";

const envSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(1).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  CONVEX_DEPLOYMENT: z.string().min(1).optional(),
  NEXT_PUBLIC_CONVEX_URL: z.string().url().optional(),
  NEXT_PUBLIC_CONVEX_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  MOBILEPAY_CLIENT_ID: z.string().min(1).optional(),
  MOBILEPAY_CLIENT_SECRET: z.string().min(1).optional(),
  MOBILEPAY_SUBSCRIPTION_KEY: z.string().min(1).optional(),
  MOBILEPAY_WEBHOOK_SECRET: z.string().min(1).optional()
});

export const env = envSchema.parse({
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
  NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  NEXT_PUBLIC_CONVEX_SITE_URL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  MOBILEPAY_CLIENT_ID: process.env.MOBILEPAY_CLIENT_ID,
  MOBILEPAY_CLIENT_SECRET: process.env.MOBILEPAY_CLIENT_SECRET,
  MOBILEPAY_SUBSCRIPTION_KEY: process.env.MOBILEPAY_SUBSCRIPTION_KEY,
  MOBILEPAY_WEBHOOK_SECRET: process.env.MOBILEPAY_WEBHOOK_SECRET
});
