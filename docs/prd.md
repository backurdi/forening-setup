# Product Requirements Document

## Product name

Working name: membership platform for unions and organizations

## Purpose

Provide a simple SaaS platform that lets organizations:

- collect memberships, subscriptions, and supporter payments
- embed or link to a branded signup form from their own website
- manage members and contacts in a lightweight CRM
- automate essential membership emails

## Product goals

- launch organizations quickly with a repeatable setup flow
- support recurring and one-time payments
- keep CRM scope intentionally small and easy to use
- make the product reusable across many organizations
- avoid custom development for every client

## Non-goals for v1

- bookkeeping/accounting
- website builder or CMS
- SMS
- event management
- booking
- advanced automation builder
- complex sales CRM features

## User roles

### Platform admin

Manages the overall service, creates organizations, monitors onboarding, and supports clients.

### Organization admin

Manages branding, plans, members, contacts, forms, and automations for one organization.

### Member / supporter

Signs up, pays, receives emails, and can update their own profile through a simple self-service portal.

## Core user stories

### Organization setup

- As a platform admin, I can create a new organization workspace.
- As an organization admin, I can configure branding, support contact details, and legal text.
- As an organization admin, I can connect payment providers.
- As an organization admin, I can create membership plans and assign prices.

### Public signup and payment

- As a visitor, I can open a hosted signup page for an organization.
- As a visitor, I can sign up through a form embedded on an organization's website.
- As a visitor, I can choose a plan and pay one-time or recurring.
- As a visitor, I receive a confirmation email after successful signup.

### CRM

- As an organization admin, I can see all members and contacts in one place.
- As an organization admin, I can filter by status, plan, tag, or payment state.
- As an organization admin, I can open a member record and see their timeline.
- As an organization admin, I can import or export CSV data.

### Automations

- As an organization admin, I can enable default lifecycle emails.
- As an organization admin, I can edit email templates for my organization.
- As a member, I receive the right email when I join, renew, fail payment, or cancel.

### Self-service

- As a member, I can access my profile using a magic link.
- As a member, I can update contact details.
- As a member, I can see membership status and payment history.
- As a member, I can cancel or update payment details where supported.

## MVP feature set

### 1. Multi-tenant organization management

- create organizations
- invite organization admins
- isolate all organization data
- store brand settings and legal text

### 2. Plans and forms

- create membership plans
- configure billing interval
- define visible plan descriptions
- configure signup form fields from a small set of field types
- publish hosted signup page
- generate embeddable form

### 3. Payments

- Stripe support for one-time and recurring payments
- MobilePay support for one-time and recurring payments
- payment webhooks
- payment status synchronization into CRM
- refund and cancellation metadata

### 4. CRM

- members
- contacts
- tags
- notes
- activity timeline
- CSV import/export

### 5. Automations

- welcome email
- payment receipt email
- failed payment email
- renewal reminder
- cancellation confirmation
- internal new-signup notification

### 6. Self-service portal

- magic-link access
- profile editing
- membership overview
- payment history

## Functional requirements

### Organization administration

- each organization must have its own slug, branding, and configuration
- organization admins must only access their own data
- platform admins must be able to impersonate or support organizations safely

### Signup forms

- each organization can publish at least one active form
- form must support required and optional fields
- form must support custom text, CTA labels, and success message
- form submissions must create or update member/contact records

### Payments

- successful payments must create CRM activity entries
- failed or canceled payments must update membership/payment status
- webhook handling must be idempotent
- payment provider records must be stored for reconciliation

### CRM

- organization admins can search members by name, email, phone, and tags
- organization admins can filter by membership status and plan
- member records must show contact details, plan, consent, notes, and payment timeline

### Automations

- automation triggers must be event-based
- templates must support organization branding and basic merge fields
- automation runs must be logged with success or failure status

### Self-service

- portal access must not require password setup for v1
- members must be able to update limited editable fields
- changes made in the portal must be reflected in CRM activity

## Key workflows

### Workflow 1: new organization onboarding

1. platform admin creates organization
2. organization admin receives invite
3. organization connects payment providers
4. organization configures plans and form
5. organization publishes hosted page or embed

### Workflow 2: member signup

1. visitor opens form
2. visitor enters personal details
3. visitor chooses plan
4. visitor completes payment
5. system creates member or subscription
6. system sends confirmation email
7. system records activity in CRM

### Workflow 3: recurring payment failure

1. provider sends failure event
2. system updates subscription/payment status
3. system creates CRM activity
4. system sends failed payment email
5. organization admin can follow up manually if needed

## Success metrics

- time to onboard a new organization
- time from setup start to first live payment form
- signup conversion rate on hosted and embedded forms
- successful payment rate
- failed payment recovery rate
- monthly active organization admins

## Open product decisions

- whether MobilePay is required in release 1 or release 2
- whether each organization must own its own payment accounts
- which custom fields are supported in v1
- whether annual memberships are handled as subscriptions or dated renewals
- whether platform billing to organizations is manual or usage-based

## Recommended release plan

### Release 1

- organizations
- plans
- hosted signup pages
- Stripe payments
- members CRM
- default email automations

### Release 2

- MobilePay payments
- embedded forms
- self-service portal
- import/export improvements

### Release 3

- white-label branding improvements
- advanced form customization
- more automation actions
- headless API
