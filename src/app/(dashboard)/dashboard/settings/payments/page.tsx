import { PaymentIcon } from "@/components/dashboard/icons";
import { PageHeader } from "@/components/dashboard/page-header";
import { PaymentSettingsForm } from "@/components/dashboard/payment-settings-form";
import { SettingsNav } from "@/components/dashboard/settings-nav";
import { getAdminContext } from "@/lib/server/services/admin";
import { getOrganizationSettings } from "@/lib/server/services/settings";

type PaymentSettingsPageProps = {
  searchParams: Promise<{
    org?: string;
  }>;
};

export default async function PaymentSettingsPage({ searchParams }: PaymentSettingsPageProps) {
  const params = await searchParams;
  const { selectedSlug } = await getAdminContext(params.org);
  const settings = selectedSlug ? await getOrganizationSettings(selectedSlug) : null;

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
              <PaymentSettingsForm
                settings={{
                  defaultCurrency: settings.defaultCurrency,
                  defaultMembershipAmountMinor: settings.defaultMembershipAmountMinor,
                  defaultPlanName: settings.defaultPlanName,
                  orgSlug: settings.slug,
                  paymentProvider: settings.paymentProvider,
                  stripePriceId: settings.stripePriceId,
                  stripeProductName: settings.stripeProductName
                }}
              />
              <section className="section-card settings-stack">
                <div className="settings-pill">Stripe workflow</div>
                <h2 className="panel-title">How this now works</h2>
                <p className="body-copy">When Stripe is enabled, the public join form creates a subscription checkout session and the webhook activates the member plus records the payment in the CRM.</p>
                <div className="notice-card">
                  Use the Stripe CLI locally with <code>pnpm run stripe:listen</code> to forward webhook events into this app while testing.
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
