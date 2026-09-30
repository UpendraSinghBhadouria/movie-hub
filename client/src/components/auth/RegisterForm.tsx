"use client";

import * as React from "react";
import { Eye, EyeOff, LockKeyhole, Mail, Phone, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import {
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validations/auth";

export function RegisterForm() {
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      password: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    console.log("Register values:", values);

    // Connect your NestJS registration API here later.
    //
    // Example:
    //
    // const response = await api.post("/auth/register", values);
    //
    // router.push("/login");
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        {/* Name */}
        <Field data-invalid={form.formState.errors.name ? true : undefined}>
          <FieldLabel htmlFor="name">Full name</FieldLabel>

          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="name"
              type="text"
              placeholder="Upendra Singh"
              autoComplete="name"
              className="h-11 pl-10"
              {...form.register("name")}
            />
          </div>

          {form.formState.errors.name && (
            <FieldError>{form.formState.errors.name.message}</FieldError>
          )}
        </Field>

        {/* Email */}
        <Field data-invalid={form.formState.errors.email ? true : undefined}>
          <FieldLabel htmlFor="email">Email address</FieldLabel>

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="h-11 pl-10"
              {...form.register("email")}
            />
          </div>

          {form.formState.errors.email && (
            <FieldError>{form.formState.errors.email.message}</FieldError>
          )}
        </Field>

        {/* Mobile */}
        <Field data-invalid={form.formState.errors.mobile ? true : undefined}>
          <FieldLabel htmlFor="mobile">Mobile number</FieldLabel>

          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="mobile"
              type="tel"
              inputMode="numeric"
              placeholder="9876543210"
              autoComplete="tel"
              maxLength={10}
              className="h-11 pl-10"
              {...form.register("mobile")}
            />
          </div>

          {form.formState.errors.mobile && (
            <FieldError>{form.formState.errors.mobile.message}</FieldError>
          )}

          <FieldDescription>
            Enter your 10-digit Indian mobile number.
          </FieldDescription>
        </Field>

        {/* Password */}
        <Field data-invalid={form.formState.errors.password ? true : undefined}>
          <FieldLabel htmlFor="password">Password</FieldLabel>

          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              autoComplete="new-password"
              className="h-11 pl-10 pr-10"
              {...form.register("password")}
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>

          {form.formState.errors.password && (
            <FieldError>{form.formState.errors.password.message}</FieldError>
          )}

          <FieldDescription>
            Use at least 8 characters with uppercase, lowercase and a number.
          </FieldDescription>
        </Field>

        <Button
          type="submit"
          className="h-11 w-full rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting
            ? "Creating account..."
            : "Create account"}
        </Button>
      </FieldGroup>
    </form>
  );
}
