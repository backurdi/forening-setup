import { notFound } from "next/navigation";

import { MembershipSignupForm } from "@/components/forms/membership-signup-form";
import { getPublicOrganizationBySlug } from "@/lib/server/services/public-organizations";

type JoinPageProps = {
  params: Promise<{
    orgSlug: string;
  }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { orgSlug } = await params;
  const organization = await getPublicOrganizationBySlug(orgSlug);

  if (!organization) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">{organization.slug}</p>
        <h1 className="headline">{organization.headline}</h1>
        <p className="body-copy">{organization.description}</p>
      </section>

      <section style={{ marginTop: 24 }}>
        <MembershipSignupForm
          amountMinor={organization.defaultMembershipAmountMinor}
          defaultCurrency={organization.defaultCurrency}
          defaultPlan={organization.defaultPlanName}
          formSlug={organization.formSlug}
          paymentProvider={organization.paymentProvider}
          organizationName={organization.name}
        />
      </section>
    </main>
  );
}
