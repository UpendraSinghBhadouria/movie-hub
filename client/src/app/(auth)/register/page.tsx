import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Join MovieHub and start booking your favorite movies and events."
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkHref="/login"
    >
      <Suspense fallback={<div className="h-48 animate-pulse" />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
