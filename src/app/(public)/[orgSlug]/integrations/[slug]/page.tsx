import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicIntegrationForm } from "@/components/forms/public-integration-form";
import { getPublicIntegration } from "@/lib/server/services/integrations";

type PublicIntegrationPageProps = {
  params: Promise<{
    orgSlug: string;
    slug: string;
  }>;
};

export default async function PublicIntegrationPage({ params }: PublicIntegrationPageProps) {
  const { orgSlug, slug } = await params;
  const integration = await getPublicIntegration(orgSlug, slug);

  if (!integration) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">{integration.orgSlug}</p>
        <h1 className="headline">{integration.title}</h1>
        <p className="body-copy">{integration.summary || `This hosted integration is ready to use on the ${integration.organizationName} website.`}</p>
        {integration.websiteUrl ? (
          <div className="actions-row">
            <Link className="link-button" href={integration.websiteUrl}>
              Back to website
            </Link>
          </div>
        ) : null}
      </section>

      <section style={{ marginTop: 24 }}>
        <PublicIntegrationForm
          buttonLabel={integration.buttonLabel}
          destinationType={integration.destinationType}
          destinationUrl={integration.destinationUrl}
          fields={integration.fields}
          integrationType={integration.integrationType}
          orgSlug={integration.orgSlug}
          organizationName={integration.organizationName}
          summary={integration.summary}
          title={integration.title}
        />
      </section>
    </main>
  );
}
