# Initial Data Model

## Principles

- all business data is tenant-scoped by `organization_id`
- external payment provider ids are stored explicitly
- payment providers are abstracted behind a common internal model
- auditability is built in from the start

## Core tables

### organizations

Purpose: tenant root record.

Suggested fields:

- `id`
- `name`
- `slug`
- `legal_name`
- `support_email`
- `support_phone`
- `website_url`
- `logo_url`
- `brand_primary_color`
- `brand_secondary_color`
- `privacy_policy_url`
- `terms_url`
- `created_at`
- `updated_at`

### organization_users

Purpose: admin users belonging to an organization.

Suggested fields:

- `id`
- `organization_id`
- `user_id`
- `role` (`owner`, `admin`, `support`)
- `created_at`

### users

Purpose: platform and organization admin identities.

Suggested fields:

- `id`
- `email`
- `full_name`
- `global_role` (`platform_admin`, `staff`, `user`)
- `created_at`
- `updated_at`

### payment_accounts

Purpose: organization-level payment provider connections.

Suggested fields:

- `id`
- `organization_id`
- `provider` (`stripe`, `mobilepay`)
- `status`
- `external_account_id`
- `metadata_json`
- `created_at`
- `updated_at`

### membership_plans

Purpose: sellable membership or supporter plans.

Suggested fields:

- `id`
- `organization_id`
- `name`
- `slug`
- `description`
- `plan_type` (`membership`, `supporter`, `donation`)
- `billing_type` (`one_time`, `recurring`, `manual_renewal`)
- `interval_unit` (`month`, `year`, null)
- `interval_count`
- `amount_minor`
- `currency`
- `is_active`
- `sort_order`
- `created_at`
- `updated_at`

### public_forms

Purpose: configurable hosted or embedded signup forms.

Suggested fields:

- `id`
- `organization_id`
- `name`
- `slug`
- `status`
- `mode` (`hosted`, `embed`)
- `title`
- `description`
- `submit_label`
- `success_message`
- `default_plan_id`
- `settings_json`
- `created_at`
- `updated_at`

### form_fields

Purpose: configurable fields shown on a public form.

Suggested fields:

- `id`
- `organization_id`
- `public_form_id`
- `field_key`
- `label`
- `field_type` (`text`, `email`, `phone`, `select`, `checkbox`, `textarea`)
- `is_required`
- `options_json`
- `sort_order`
- `created_at`

### people

Purpose: canonical person/contact record.

Suggested fields:

- `id`
- `organization_id`
- `email`
- `phone`
- `first_name`
- `last_name`
- `address_line_1`
- `address_line_2`
- `postal_code`
- `city`
- `country_code`
- `date_of_birth`
- `custom_fields_json`
- `created_at`
- `updated_at`

### members

Purpose: membership relationship for a person.

Suggested fields:

- `id`
- `organization_id`
- `person_id`
- `membership_plan_id`
- `status` (`pending`, `active`, `past_due`, `canceled`, `expired`)
- `started_at`
- `ends_at`
- `canceled_at`
- `source` (`hosted_form`, `embed`, `admin_import`, `admin_manual`)
- `created_at`
- `updated_at`

### contacts

Purpose: non-member or pre-member CRM records.

Suggested fields:

- `id`
- `organization_id`
- `person_id`
- `status` (`lead`, `incomplete_signup`, `newsletter_only`)
- `source`
- `created_at`
- `updated_at`

### subscriptions

Purpose: normalized recurring billing agreement.

Suggested fields:

- `id`
- `organization_id`
- `member_id`
- `provider` (`stripe`, `mobilepay`)
- `payment_account_id`
- `external_subscription_id`
- `status`
- `billing_anchor_at`
- `current_period_start`
- `current_period_end`
- `cancel_at_period_end`
- `canceled_at`
- `created_at`
- `updated_at`

### payments

Purpose: normalized payment or charge record.

Suggested fields:

- `id`
- `organization_id`
- `member_id`
- `subscription_id`
- `provider` (`stripe`, `mobilepay`)
- `payment_account_id`
- `external_payment_id`
- `payment_type` (`one_time`, `recurring`)
- `status` (`pending`, `succeeded`, `failed`, `refunded`, `canceled`)
- `amount_minor`
- `currency`
- `paid_at`
- `failed_at`
- `failure_reason`
- `metadata_json`
- `created_at`
- `updated_at`

### consents

Purpose: legal consent tracking.

Suggested fields:

- `id`
- `organization_id`
- `person_id`
- `consent_type` (`email_marketing`, `membership_terms`, `privacy_policy`)
- `status` (`granted`, `revoked`)
- `text_version`
- `captured_at`
- `source`

### tags

Purpose: lightweight segmentation.

Suggested fields:

- `id`
- `organization_id`
- `name`
- `color`
- `created_at`

### person_tags

Purpose: many-to-many between people and tags.

Suggested fields:

- `person_id`
- `tag_id`
- `created_at`

### notes

Purpose: internal admin notes.

Suggested fields:

- `id`
- `organization_id`
- `person_id`
- `author_user_id`
- `body`
- `created_at`

### email_templates

Purpose: organization-specific message templates.

Suggested fields:

- `id`
- `organization_id`
- `template_key`
- `name`
- `subject`
- `body_html`
- `body_text`
- `is_enabled`
- `created_at`
- `updated_at`

### automation_runs

Purpose: delivery and processing log for event-triggered automations.

Suggested fields:

- `id`
- `organization_id`
- `event_type`
- `person_id`
- `member_id`
- `template_id`
- `status` (`queued`, `sent`, `failed`, `skipped`)
- `provider_message_id`
- `error_message`
- `processed_at`
- `created_at`

### activity_events

Purpose: timeline entries visible in CRM.

Suggested fields:

- `id`
- `organization_id`
- `person_id`
- `member_id`
- `actor_type` (`system`, `user`, `member`, `provider`)
- `actor_id`
- `event_type`
- `summary`
- `payload_json`
- `created_at`

### webhook_events

Purpose: inbound provider event log with idempotency support.

Suggested fields:

- `id`
- `organization_id`
- `provider`
- `external_event_id`
- `event_type`
- `payload_json`
- `received_at`
- `processed_at`
- `processing_status`
- `error_message`

### audit_logs

Purpose: admin action audit trail.

Suggested fields:

- `id`
- `organization_id`
- `user_id`
- `action`
- `target_type`
- `target_id`
- `payload_json`
- `created_at`

## Key relationships

- one organization has many admins, plans, forms, people, members, contacts, templates, and payment accounts
- one person may have zero or one contact record and zero or one active member record in the simple model
- one member may have many payments and zero or one active subscription
- one organization may have multiple public forms pointing to different default plans

## Important implementation notes

### Tenant isolation

Every tenant-scoped table should include `organization_id`, even when it can be inferred indirectly. This makes authorization, indexing, and support tooling safer.

### Person vs member split

Keep `people` separate from `members` so the CRM can handle incomplete signups, newsletter contacts, and former members without schema hacks.

### Provider abstraction

Do not make Stripe or MobilePay the source of truth for business logic. Normalize external events into internal `subscriptions`, `payments`, and `activity_events`.

### Idempotency

Use `webhook_events.external_event_id` and provider-specific constraints to guarantee that duplicate webhook deliveries do not duplicate members, payments, or emails.

## Suggested first indexes

- `(organization_id, email)` on `people`
- `(organization_id, slug)` on `organizations`
- `(organization_id, slug)` on `membership_plans`
- `(organization_id, status)` on `members`
- `(organization_id, external_payment_id, provider)` on `payments`
- `(organization_id, external_subscription_id, provider)` on `subscriptions`
- `(provider, external_event_id)` on `webhook_events`
