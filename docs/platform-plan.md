# Union / Organization Platform Plan

## Goal

Build a simple, reusable platform for unions and organizations that can:

- accept payments with Stripe
- support MobilePay for one-time and recurring membership payments
- manage members in a lightweight CRM
- automate basic email flows
- let each organization place a signup/payment form on its own website

This should be simpler than ForeningLet, not a full replacement for all of its modules.

## What ForeningLet appears to offer

Based on its public website and documentation, ForeningLet positions itself as an all-in-one association platform with:

- member management
- online signup for memberships and events
- payment handling for MobilePay, Betalingsservice, cards, EAN, and email invoices
- communication by email and SMS
- a member portal with self-service profile updates
- optional website, booking, accounting, access control, and app modules

Useful ideas to borrow for our simpler version:

- online signup tied directly to member records
- support for recurring memberships
- automatic payment status updates
- self-service member profile editing
- organization-specific hosted or embeddable signup pages
- simple communication flows tied to membership lifecycle

Things we should explicitly leave out of v1:

- accounting/bookkeeping
- booking
- SMS
- access control / doors
- native app
- full website builder / CMS
- advanced event management

## Recommended product scope

### Product position

Offer a multi-tenant membership platform for organizations that want:

- a branded signup and payment experience
- recurring support memberships or subscriptions
- a lightweight CRM for members and contacts
- a few reliable automations instead of a large admin suite

### Main user groups

- platform admin: you and your team
- organization admin: each union or organization
- member/supporter: person signing up or managing their membership

### MVP modules

1. Organization setup
- create an organization workspace
- store branding, contact details, legal texts, and membership products
- connect Stripe
- configure MobilePay
- define signup form fields

2. Public signup and payment forms
- hosted checkout page for each organization
- embeddable widget or link for the organization's own website
- support for one-time donations, recurring memberships, and optional annual memberships
- confirmation page and confirmation email

3. Member CRM
- members
- contacts/leads
- membership status
- payment history
- notes/tags
- consent tracking

4. Basic automations
- welcome email after signup
- failed payment email
- payment receipt email
- renewal reminder email
- cancellation confirmation email
- internal admin notification for new signup

5. Member self-service
- magic-link login
- update contact details
- view membership status
- change or cancel payment method where supported
- download receipts or view payment history

6. Admin dashboard
- member list with filters
- contact list
- membership plans
- payments overview
- automation logs
- export CSV

## Best-fit architecture

### Product model

Use a multi-tenant SaaS model:

- one codebase
- one admin app
- one public form system
- each organization gets isolated data, branding, forms, plans, and integrations

### Recommended flexibility model

Support three delivery modes:

1. Hosted page
- fastest to launch
- organization gets a branded signup page like `join.yourplatform.com/org-slug`

2. Embedded form
- JS embed or iframe for client websites
- best when they already have a site and just need signup/payment

3. Headless API later
- only after MVP
- lets advanced clients build their own frontend on top of your backend

For v1, hosted page plus embeddable form is the right balance.

### Suggested core entities

- organizations
- organization_users
- membership_plans
- public_forms
- members
- contacts
- subscriptions
- payments
- payment_methods
- email_templates
- automation_runs
- consent_records
- audit_logs

## Payments strategy

### Stripe

Stripe is the easiest core payment rail for:

- cards
- recurring subscriptions
- invoices and receipts
- webhook-driven payment state updates

For a platform serving many organizations, Stripe Connect should be the default direction if each organization should receive funds into its own Stripe account.

Recommended default:

- Stripe Connect Express
- each organization connects its own Stripe account
- platform takes a service fee if desired

Alternative:

- platform-owned Stripe account
- you collect all funds and settle manually

This is simpler at first, but creates more operational, accounting, and legal overhead for you.

### MobilePay

Current Vipps MobilePay docs indicate:

- recurring memberships are supported through the Recurring API
- one-time payments are supported through ePayment
- webhooks are important for agreement and charge status changes

That means we should treat MobilePay as a first-class integration, but implement it behind the same internal billing model as Stripe so the CRM and automations do not care which payment rail was used.

### Payment abstraction

Internally normalize all payment sources into:

- customer
- plan
- agreement/subscription
- invoice or charge
- payment status
- retry state

This will keep the system flexible when adding or changing gateways later.

## CRM scope

Keep the CRM intentionally small.

### Members

Members are people with an active or previous membership relationship.

Store:

- name
- email
- phone
- address
- organization-specific custom fields
- membership type
- start date
- end date
- status
- payment method
- consents
- tags
- internal notes

### Contacts

Contacts are people not yet fully registered as members.

Examples:

- newsletter signups
- incomplete checkouts
- manual leads imported by an organization

### Basic CRM actions

- create/edit member
- import CSV
- convert contact to member
- filter by status/tag/plan
- export CSV
- view timeline of signup, emails, payments, and status changes

## Automation scope

Start with template-based event automations, not a visual automation builder.

### Trigger examples

- member.created
- checkout.completed
- subscription.activated
- payment.failed
- payment.succeeded
- subscription.canceled
- renewal.upcoming

### Action examples

- send email to member
- send email to org admin
- update CRM status
- add/remove tag
- create internal task later

This is enough for the simple system you described and avoids unnecessary complexity.

## Suggested implementation phases

### Phase 1: Foundation

- authentication for platform admins and organization admins
- organization model and tenant isolation
- branding settings
- basic database schema
- audit logging

### Phase 2: Public signup flow

- public organization page
- configurable membership plans
- signup form builder with a small set of field types
- successful registration flow

### Phase 3: Stripe billing

- Stripe Connect onboarding
- one-time and recurring payments
- webhook processing
- receipts and payment status syncing into CRM

### Phase 4: MobilePay integration

- one-time payments
- recurring agreements
- webhook processing
- agreement and charge state syncing

### Phase 5: CRM and automations

- member/contact lists
- activity timeline
- default email templates
- event-triggered email automation

### Phase 6: Embedding and white-label

- embeddable widget or iframe
- domain/branding options
- reusable setup flow for new organizations

## What you need from each organization

To make onboarding simple, collect a standard client intake package.

### Organization identity

- legal name
- CVR number if relevant
- billing address
- support email
- support phone
- logo
- brand colors
- website URL

### Membership setup

- membership types
- price for each type
- billing interval: monthly, yearly, one-time
- whether there is trial pricing, signup fee, or discounted first period
- who is eligible for each membership
- fields required on signup

### Payment setup

- whether they want Stripe, MobilePay, or both
- whether they already have Stripe
- whether they already have MobilePay business setup
- payout bank account details handled through provider onboarding where possible
- refund and cancellation policy

### Legal and compliance

- terms of membership
- privacy policy
- cookie policy if forms are embedded on their site
- consent text for email communication
- data retention expectations

### Communication

- sender name
- sender email/domain
- welcome email copy
- failed payment email copy
- renewal reminder copy
- cancellation confirmation copy
- internal notification recipients

### Website integration

- whether they want hosted page or embedded form
- website platform: WordPress, Webflow, custom, etc.
- preferred CTA text and placement
- any tracking requirements such as Meta Pixel or Google Analytics

## What you need to decide up front

These decisions materially change the build.

### 1. Who owns the merchant relationship?

Option A: each organization has its own Stripe and MobilePay setup.

Pros:

- cleaner separation
- better long-term scaling
- clearer payouts
- easier white-label positioning

Tradeoff:

- more onboarding friction

Option B: you own the payment accounts centrally.

Pros:

- faster to launch for first clients

Tradeoff:

- more legal, financial, support, and reconciliation responsibility for you

Recommendation: use organization-owned payment accounts where possible.

### 2. How customizable should client websites be?

Recommendation for v1:

- branded hosted page
- embeddable form
- no full website builder

This keeps the product focused on membership and payments.

### 3. How much CRM complexity do you actually want?

Recommendation for v1:

- people
- memberships
- payments
- emails
- tags
- notes

Do not build pipelines, deals, tasks, or sales features yet.

## Recommended technical direction

Because this is greenfield, a practical stack for speed would be:

- Next.js for admin app and public forms
- PostgreSQL
- Prisma or Drizzle
- Stripe SDK
- Vipps MobilePay API integration
- email provider such as Postmark or Resend
- background jobs for webhooks and automations

Key technical requirements:

- strict tenant isolation
- webhook idempotency
- audit logs for admin actions
- per-organization branding
- configurable custom form fields
- exportability of member data

## Recommended v1 definition

If we keep this disciplined, v1 should be:

- multi-tenant organization admin
- hosted signup page
- embeddable payment/signup form
- Stripe recurring and one-time payments
- MobilePay one-time and recurring payments
- member CRM
- 5 to 8 basic email automations
- self-service member portal with magic-link access

## Biggest risks

- payment onboarding complexity if supporting both Stripe and MobilePay from day one
- legal/compliance differences between organizations
- trying to build too much of ForeningLet instead of the smaller core product
- underestimating webhook and payment state edge cases

## Recommended next step

Before implementation, define:

1. payment ownership model
2. exact MVP feature list
3. first target customer type
4. whether MobilePay must be in the first release or can follow Stripe by one phase

Once those are fixed, the next deliverable should be:

- a product requirements document
- a database schema
- an onboarding checklist for new organizations
- wireframes for admin, public signup, and self-service pages

## Sources

- [ForeningLet main site](https://web.foreninglet.dk/)
- [ForeningLet pricing](https://foreninglet.dk/main/price)
- [ForeningLet basic configuration docs](https://foreninglet.dk/documentation/danish/basic_configuration.html)
- [ForeningLet communication docs](https://www.foreninglet.dk/documentation/danish/communication.html)
- [ForeningLet member portal docs](https://www.foreninglet.dk/documentation/danish/member_portal.html)
- [ForeningLet online signup page](https://web.foreninglet.dk/funktioner/online-tilmelding/)
- [Vipps MobilePay developer docs](https://developer.vippsmobilepay.com/)
- [Vipps MobilePay recurring payments docs](https://developer.vippsmobilepay.com/docs/recommended-flows/recurring/)
- [Vipps MobilePay webhooks docs](https://developer.vippsmobilepay.com/docs/knowledge-base/webhooks/)
- [Stripe Connect docs](https://docs.stripe.com/connect)
- [Stripe subscriptions overview](https://docs.stripe.com/billing/subscriptions/overview)
