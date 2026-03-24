import { AuthShell } from "@/components/auth/auth-shell";
import { AdminAuthForm } from "@/components/auth/admin-auth-form";

export default function SignUpPage() {
  return (
    <AuthShell
      description="Create the first admin account, then start onboarding organizations into separated members, payments, emails, and settings pages."
      eyebrow="Admin authentication"
      title="Create your first admin account"
    >
        <AdminAuthForm mode="sign-up" />
    </AuthShell>
  );
}
