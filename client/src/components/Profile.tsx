"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  CheckCircle2,
  Mail,
  Phone,
  Save,
  UserRound,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const currentYear = new Date().getFullYear();

const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters"),

  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name cannot exceed 50 characters"),

  email: z.string().trim().email("Enter a valid email address"),

  mobile: z
    .string()
    .trim()
    .min(10, "Enter a valid mobile number")
    .max(15, "Enter a valid mobile number")
    .regex(/^[+]?[0-9\s-]+$/, "Enter a valid mobile number"),

  birthday: z.date().optional(),

  gender: z.enum(["male", "female"]).optional(),

  married: z.enum(["yes", "no"]).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const currentUser = {
  firstName: "Upendra",
  lastName: "Singh",
  email: "upendra@example.com",
  mobile: "+91 98765 43210",
  birthday: new Date(1991, 5, 15),
  gender: "male" as const,
  married: "no" as const,
};

export function Profile() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      mobile: currentUser.mobile,
      birthday: currentUser.birthday,
      gender: currentUser.gender,
      married: currentUser.married,
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    console.log("Profile updated:", values);
  };

  const firstName = form.watch("firstName");
  const lastName = form.watch("lastName");

  const initials =
    `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase();

  return (
    <div className="bg-background">
      {/* Top accent */}
      <div className=" bg-linear-to-r from-primary/40 via-primary to-primary/40" />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="space-y-6">
          {/* PROFILE HEADER */}

          <Card className="overflow-hidden border-border/60 shadow-sm">
            <div className="relative">
              {/* Decorative background */}
              <div className="absolute inset-0 bg-linear-to-br from-primary/15 via-primary/5 to-transparent" />

              <CardContent className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-7">
                <Avatar className="h-20 w-20 shrink-0 border-4 border-background shadow-lg">
                  <AvatarFallback className="bg-primary text-xl font-bold text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="mb-1 text-sm font-medium text-primary">
                    Welcome back 👋
                  </p>

                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Hi, {firstName || "there"}
                  </h1>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage your MovieHub account and personal preferences.
                  </p>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* ACCOUNT DETAILS */}

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/60 px-6 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <UserRound className="h-4 w-4 text-primary" />
                </div>

                <div>
                  <h2 className="font-semibold text-foreground">
                    Account Details
                  </h2>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Keep your contact information up to date.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-7">
              <FieldGroup>
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Email */}
                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                          Email Address
                        </FieldLabel>

                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                          <Input
                            {...field}
                            id={field.name}
                            type="email"
                            placeholder="Enter email address"
                            aria-invalid={fieldState.invalid}
                            autoComplete="email"
                            className="pr-24 pl-9 h-10"
                          />

                          <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-medium text-primary">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verified
                          </span>
                        </div>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  {/* Mobile */}
                  <Controller
                    name="mobile"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                          Mobile Number
                        </FieldLabel>

                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                          <Input
                            {...field}
                            id={field.name}
                            type="tel"
                            placeholder="Enter mobile number"
                            aria-invalid={fieldState.invalid}
                            autoComplete="tel"
                            className="pr-24 pl-9 h-10"
                          />

                          <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-medium text-primary">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verified
                          </span>
                        </div>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* PERSONAL DETAILS */}

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/60 px-6 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <UserRound className="h-4 w-4 text-primary" />
                </div>

                <div>
                  <h2 className="font-semibold text-foreground">
                    Personal Details
                  </h2>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Update your personal information.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-7">
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FieldGroup>
                  {/* First Name + Last Name */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Controller
                      name="firstName"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>
                            First Name
                          </FieldLabel>

                          <Input
                            {...field}
                            id={field.name}
                            placeholder="Enter first name"
                            aria-invalid={fieldState.invalid}
                            autoComplete="given-name"
                            className="h-10"
                          />

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      name="lastName"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>
                            Last Name
                          </FieldLabel>

                          <Input
                            {...field}
                            id={field.name}
                            placeholder="Enter last name"
                            aria-invalid={fieldState.invalid}
                            autoComplete="family-name"
                            className="h-10"
                          />

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>

                  {/* Birthday */}
                  <Controller
                    name="birthday"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                          Birthday
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            (Optional)
                          </span>
                        </FieldLabel>

                        <Popover>
                          <PopoverTrigger
                            id={field.name}
                            type="button"
                            className={cn(
                              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors",
                              "hover:bg-accent hover:text-accent-foreground",
                              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value
                              ? format(field.value, "dd MMM yyyy")
                              : "Select your birthday"}

                            <CalendarIcon className="h-4 w-4 opacity-60" />
                          </PopoverTrigger>

                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              captionLayout="dropdown"
                              startMonth={new Date(2000, 0)}
                              endMonth={new Date(currentYear, 11)}
                              disabled={(date) =>
                                date > new Date() || date < new Date(2000, 0, 1)
                              }
                            />
                          </PopoverContent>
                        </Popover>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  {/* Gender + Married */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Controller
                      name="gender"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>
                            Gender
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              (Optional)
                            </span>
                          </FieldLabel>

                          <Select
                            name={field.name}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger
                              id={field.name}
                              aria-invalid={fieldState.invalid}
                              className="w-full h-10!"
                            >
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="male" className="h-10">
                                Male
                              </SelectItem>
                              <SelectItem value="female" className="h-10">
                                Female
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      name="married"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>
                            Married
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              (Optional)
                            </span>
                          </FieldLabel>

                          <Select
                            name={field.name}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger
                              id={field.name}
                              aria-invalid={fieldState.invalid}
                              className="w-full h-10!"
                            >
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="yes" className="h-10">
                                Yes
                              </SelectItem>
                              <SelectItem value="no" className={"h-10"}>
                                No
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                </FieldGroup>

                {/* Save */}
                <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-6 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    className="sm:min-w-28"
                    size={"lg"}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    className="gap-2 bg-primary shadow-sm shadow-primary/20 hover:bg-primary/90 sm:min-w-36"
                    size={"lg"}
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
