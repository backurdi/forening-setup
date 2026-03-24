import { AuthShell } from "@/components/auth/auth-shell";
import { AdminAuthForm } from "@/components/auth/admin-auth-form";

export default function SignInPage() {
  return (
    <AuthShell
      description="Sign in to manage members, payments, subscribers, and organization settings from a cleaner multi-page admin system."
      eyebrow="Admin authentication"
      title="Sign in to your workspace"
    >
        <AdminAuthForm mode="sign-in" />
    </AuthShell>
  );
}
