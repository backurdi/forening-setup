import { PaymentIcon } from "@/components/dashboard/icons";
import { PageHeader } from "@/components/dashboard/page-header";
import { PaymentSettingsForm } from "@/components/dashboard/payment-settings-form";
import { SettingsNav } from "@/components/dashboard/settings-nav";
import { getStripeConnectAccountStatus } from "@/lib/server/payments/stripe";
import { getAdminContext } from "@/lib/server/services/admin";
import { getOrganizationSettings } from "@/lib/server/services/settings";

type PaymentSettingsPageProps = {
  searchParams: Promise<{
    org?: string;
    stripe?: string;
    stripeMessage?: string;
  }>;
};

export default async function PaymentSettingsPage({ searchParams }: PaymentSettingsPageProps) {
  const params = await searchParams;
  const { selectedSlug } = await getAdminContext(params.org);
  const settings = selectedSlug ? await getOrganizationSettings(selectedSlug) : null;
  const stripeEnvReady = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  const stripeConnection = settings?.stripeConnectAccountId
    ? await getStripeConnectAccountStatus(settings.stripeConnectAccountId).catch(() => null)
    : null;
  const stripeReady = Boolean(
    stripeEnvReady &&
    settings?.stripeConnectAccountId &&
      stripeConnection?.chargesEnabled &&
      stripeConnection?.detailsSubmitted &&
      stripeConnection?.payoutsEnabled
  );
  const stripeStatusMessage =
    params.stripe === "returned"
      ? stripeReady
        ? "Stripe is connected and ready for checkout."
        : "Stripe returned to the dashboard. Finish any remaining onboarding steps to start taking payments."
      : params.stripe === "error"
        ? params.stripeMessage || "Stripe onboarding could not be started. Check your Stripe env vars and try again."
        : null;
  const stripeConnectHref = selectedSlug ? `/api/stripe/connect/onboarding?org=${selectedSlug}` : null;

  return (
    <main className="admin-main">
      <PageHeader
        description="Control billing defaults and how the public join flow behaves."
        icon={<PaymentIcon />}
        title="Payment settings"
      />

      <section className="settings-layout-grid">
        <SettingsNav active="payments" orgSlug={selectedSlug} />

        <div className="settings-content-stack">
          {settings ? (
            <>
              <section className="section-card settings-stack">
                <div className="settings-pill">Stripe Connect</div>
                <h2 className="panel-title">Connect the organization's Stripe account</h2>
                <p className="body-copy">
                  Let the organization authenticate with Stripe directly. Once onboarding is complete, this app can create
                  Checkout sessions on that connected account without asking for API keys.
                </p>
                {!stripeEnvReady ? (
                  <div className="notice-card">
                    Add <code>STRIPE_SECRET_KEY</code> and <code>STRIPE_WEBHOOK_SECRET</code> to the server environment before connecting Stripe.
                  </div>
                ) : null}
                <div className="notice-card">
                  {stripeReady
                    ? "Stripe onboarding is complete and card payments can be enabled below."
                    : settings.stripeConnectAccountId
                      ? `Stripe account ${settings.stripeConnectAccountId} is linked, but onboarding still has ${stripeConnection?.requirementsDueCount ?? "some"} required step${stripeConnection?.requirementsDueCount === 1 ? "" : "s"} remaining.`
                      : "No Stripe account is connected yet."}
                </div>
                {stripeStatusMessage ? <p className="success-text">{stripeStatusMessage}</p> : null}
                {stripeConnectHref && stripeEnvReady ? (
                  <a className="link-button active" href={stripeConnectHref}>
                    {stripeReady ? "Review Stripe setup" : settings.stripeConnectAccountId ? "Continue Stripe onboarding" : "Connect Stripe"}
                  </a>
                ) : null}
              </section>
              <PaymentSettingsForm
                settings={{
                  defaultCurrency: settings.defaultCurrency,
                  defaultMembershipAmountMinor: settings.defaultMembershipAmountMinor,
                  defaultPlanName: settings.defaultPlanName,
                  orgSlug: settings.slug,
                  paymentProvider: settings.paymentProvider,
                  stripeConnected: stripeReady,
                  stripePriceId: settings.stripePriceId,
                  stripeProductName: settings.stripeProductName
                }}
              />
              <section className="section-card settings-stack">
                <div className="settings-pill">Stripe workflow</div>
                <h2 className="panel-title">How this now works</h2>
                <p className="body-copy">When Stripe is enabled, the public join form creates a subscription checkout session on the connected account and the webhook activates the member plus records the payment in the CRM.</p>
                <div className="notice-card">
                  Use the Stripe CLI locally with <code>pnpm run stripe:listen</code> to forward webhook events into this app while testing. In Stripe, make sure the webhook endpoint is configured for connected accounts too.
                </div>
              </section>
            </>
          ) : (
            <section className="section-card">
              <p className="eyebrow">No workspace selected</p>
              <h2 className="panel-title">Select an organization first</h2>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
