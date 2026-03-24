import Link from "next/link";

type AuthShellProps = {
  children: React.ReactNode;
  description: string;
  eyebrow: string;
  title: string;
};

export function AuthShell({ children, description, eyebrow, title }: AuthShellProps) {
  return (
    <main className="auth-layout">
      <section className="auth-panel auth-panel-dark">
        <div className="auth-brand">
          <p className="eyebrow" style={{ color: "rgba(227, 236, 232, 0.72)" }}>
            {eyebrow}
          </p>
          <h1 className="auth-title">Forening Setup</h1>
          <p className="auth-copy">
            A lighter-weight admin system for memberships, payments, subscribers, and organizational setup.
          </p>
        </div>

        <div className="auth-feature-stack">
          <div className="auth-feature-card">
            <p className="eyebrow" style={{ color: "rgba(227, 236, 232, 0.72)" }}>
              Members
            </p>
            <p>Organize your member registry, payment status, and intake flow without clutter.</p>
          </div>
          <div className="auth-feature-card">
            <p className="eyebrow" style={{ color: "rgba(227, 236, 232, 0.72)" }}>
              Settings
            </p>
            <p>Split configuration into focused pages instead of stacking every control on one screen.</p>
          </div>
        </div>
      </section>

      <section className="auth-panel auth-panel-light">
        <div className="auth-header">
          <Link className="link-button" href="/">
            Back home
          </Link>
        </div>

        <div className="auth-content">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="auth-form-title">{title}</h2>
          <p className="body-copy">{description}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
