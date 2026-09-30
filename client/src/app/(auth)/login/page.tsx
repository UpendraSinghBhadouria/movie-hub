import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue booking movies, events and shows."
      footerText="Don't have an account?"
      footerLinkText="Create an account"
      footerLinkHref="/register"
    >
      <LoginForm />
    </AuthShell>
  );
}
