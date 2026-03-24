import Link from "next/link";
import { notFound } from "next/navigation";

import { MembershipSignupForm } from "@/components/forms/membership-signup-form";
import { getPublicOrganizationBySlug } from "@/lib/server/services/public-organizations";

type JoinPageProps = {
  params: Promise<{
    orgSlug: string;
  }>;
  searchParams: Promise<{
    canceled?: string;
    success?: string;
  }>;
};

export default async function JoinPage({ params, searchParams }: JoinPageProps) {
  const [{ orgSlug }, query] = await Promise.all([params, searchParams]);
  const organization = await getPublicOrganizationBySlug(orgSlug);

  if (!organization) {
    notFound();
  }

  const checkoutSucceeded = query.success === "1";
  const checkoutCanceled = query.canceled === "1";

  return (
    <main className="page-shell">
      <section className="hero-card">
        {checkoutSucceeded ? (
          <>
            <p className="eyebrow">Payment confirmed</p>
            <h1 className="headline">Membership payment received</h1>
            <p className="body-copy">
              Stripe has confirmed the signup payment. The membership should now appear as active in the CRM and any
              enabled welcome emails will be sent automatically.
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow">{organization.slug}</p>
            <h1 className="headline">{organization.headline}</h1>
            <p className="body-copy">{organization.description}</p>
          </>
        )}
      </section>

      {checkoutSucceeded ? (
        <section className="section-card" style={{ marginTop: 24 }}>
          <div className="actions-row" style={{ marginTop: 0 }}>
            <Link className="link-button" href={`/${orgSlug}/join`}>
              Back to join page
            </Link>
          </div>
        </section>
      ) : (
        <section style={{ marginTop: 24 }}>
          {checkoutCanceled ? <p className="route-note">Checkout was canceled. You can return to the form whenever you are ready.</p> : null}
          <MembershipSignupForm
            amountMinor={organization.defaultMembershipAmountMinor}
            defaultCurrency={organization.defaultCurrency}
            defaultPlan={organization.defaultPlanName}
            formSlug={organization.formSlug}
            paymentProvider={organization.paymentProvider}
            organizationName={organization.name}
          />
        </section>
      )}
    </main>
  );
}
