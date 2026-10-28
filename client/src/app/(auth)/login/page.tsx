import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue booking movies, events and shows."
      footerText="Don't have an account?"
      footerLinkText="Create an account"
      footerLinkHref="/register"
    >
      <Suspense fallback={<div className="h-48 animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
