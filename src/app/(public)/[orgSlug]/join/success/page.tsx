import Link from "next/link";

type JoinSuccessPageProps = {
  params: Promise<{
    orgSlug: string;
  }>;
};

export default async function JoinSuccessPage({ params }: JoinSuccessPageProps) {
  const { orgSlug } = await params;

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Payment confirmed</p>
        <h1 className="headline">Membership payment received</h1>
        <p className="body-copy">
          Stripe has confirmed the signup payment. The membership should now appear as active in the CRM and any enabled
          welcome emails will be sent automatically.
        </p>
        <div className="actions-row">
          <Link className="link-button" href={`/dashboard?org=${orgSlug}`}>
            Open dashboard
          </Link>
          <Link className="link-button" href={`/${orgSlug}/join`}>
            Back to join page
          </Link>
        </div>
      </section>
    </main>
  );
}
