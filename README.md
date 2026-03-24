# Forening Setup

This repository contains the initial architecture and working scaffold for a multi-tenant membership platform for unions and organizations.

## Chosen stack

- `Next.js`
- `Convex`
- `Better Auth`
- `Resend`
- `Convex Storage`
- `Stripe`
- `Vipps MobilePay`
- `Zod`
- `Vitest`
- `Playwright`

## Important boundary

The frontend does not call Convex directly. All browser traffic goes through the `Next.js` backend layer, which handles:

- sessions
- permissions
- validation
- payment orchestration
- webhook verification

Convex is treated as the internal data and business-logic layer.

## Local setup

1. Ensure the local Node toolchain is available in `PATH`.
2. Install dependencies with `pnpm install`.
3. Start local development with `pnpm run dev`.
4. Seed demo data with `pnpm run seed:demo`.

`pnpm run dev` now starts both `Next.js` and `Convex` together. If you only want the web app, use `pnpm run dev:web`.

### Stripe and Resend local tooling

- `pnpm run stripe:listen` forwards Stripe webhook events to `http://localhost:3000/api/webhooks/stripe`
- `pnpm run stripe:trigger:checkout` triggers a test checkout webhook event once the Stripe CLI is installed and logged in
- `pnpm run resend:doctor` checks the local Resend setup through the official Resend CLI
- `pnpm run resend:send` opens the official Resend CLI send flow
- `pnpm run resend:webhooks` lists configured Resend webhooks

Required environment variables for the new flows:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`

Stripe Connect setup notes:

- enable `Connect` on the Stripe platform account used by `STRIPE_SECRET_KEY`
- create a webhook endpoint for `/api/webhooks/stripe` and save its signing secret as `STRIPE_WEBHOOK_SECRET`
- configure that webhook endpoint to receive connected-account events, not only platform events
- for local testing, use `pnpm run stripe:listen`, which now forwards both platform and connected-account events

## Current repo contents

- architecture and planning docs in `docs/`
- Next.js app in `src/`
- Convex backend in `convex/`
- Better Auth wired through Convex and proxied via `app/api/auth`

## Current product slice

1. split admin UI with dedicated Members, Payments, Emails, and Settings pages
2. settings subpages for General, Payments, and Email configuration
3. Stripe Connect onboarding plus Stripe-backed hosted checkout flow for public membership signup
4. Resend-backed welcome/subscriber/test email sending plus delivery webhook ingestion
5. CRM tables for members, payments, subscribers, and email activity

## Next implementation slice

1. add MobilePay setup and webhook handling
2. add richer payment lifecycle sync beyond `checkout.session.completed`
3. expand email automation rules and templates
4. build member self-service and organization admin roles
