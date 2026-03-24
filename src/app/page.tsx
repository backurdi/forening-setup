import Link from "next/link";

const highlights = [
  "Next.js as the only public backend surface",
  "Convex as internal data and business layer",
  "Better Auth for sessions and admin access",
  "Resend for lifecycle emails",
  "Stripe and MobilePay behind a shared billing model"
];

const structure = [
  "Hosted signup pages for organizations",
  "Embeddable forms for existing client websites",
  "Organization dashboard for plans, members, and payments",
  "Member self-service portal via magic links",
  "Webhook-driven payment sync and email automations"
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Multi-tenant membership platform</p>
        <h1 className="headline">A type-safe platform for unions, organizations, and member payments.</h1>
        <p className="body-copy">
          This scaffold uses Next.js as the secure middle layer and keeps Convex behind the backend boundary.
          The goal is a reusable platform where each organization gets branded signup flows, billing,
          lightweight CRM, and email automations without bespoke builds.
        </p>
        <div className="pill-row">
          <span className="pill">Next.js App Router</span>
          <span className="pill">Server Actions</span>
          <span className="pill">Convex</span>
          <span className="pill">Better Auth</span>
          <span className="pill">Stripe + MobilePay</span>
        </div>
        <div className="actions-row">
          <Link className="link-button" href="/auth/sign-up">
            Create admin account
          </Link>
          <Link className="link-button" href="/auth/sign-in">
            Sign in
          </Link>
          <Link className="link-button" href="/demo-union/join">
            View demo join page
          </Link>
        </div>
        <p className="route-note">
          Start with <code>docs/architecture.md</code>. Then run <code>npm run seed:demo</code> to create the
          demo organization used by the public join flow.
        </p>
      </section>

      <section className="section-grid" style={{ marginTop: 24 }}>
        <article className="section-card">
          <p className="eyebrow">System boundary</p>
          <ul className="stack-list">
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="section-card">
          <p className="eyebrow">First product slices</p>
          <ul className="stack-list">
            {structure.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
