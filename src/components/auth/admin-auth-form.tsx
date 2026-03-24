"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { authClient } from "@/lib/auth-client";
import { adminSignInSchema, adminSignUpSchema, type AdminSignInInput, type AdminSignUpInput } from "@/lib/validations/admin-auth";

type AdminAuthFormProps = {
  mode: "sign-in" | "sign-up";
};

export function AdminAuthForm({ mode }: AdminAuthFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const isSignUp = mode === "sign-up";
  const schema = isSignUp ? adminSignUpSchema : adminSignInSchema;
  const form = useForm<AdminSignInInput | AdminSignUpInput>({
    resolver: zodResolver(schema),
    defaultValues: isSignUp
      ? {
          name: "",
          email: "",
          password: ""
        }
      : {
          email: "",
          password: ""
        }
  });

  const onSubmit = form.handleSubmit((values) => {
    setStatusMessage(null);

    startTransition(async () => {
      const result = isSignUp
        ? await authClient.signUp.email({
            callbackURL: "/dashboard",
            email: values.email,
            name: (values as AdminSignUpInput).name,
            password: values.password
          })
        : await authClient.signIn.email({
            callbackURL: "/dashboard",
            email: values.email,
            password: values.password,
            rememberMe: true
          });

      if (result.error) {
        setStatusMessage(result.error.message ?? "Authentication failed.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  });

  return (
    <form className="section-card auth-form-card" onSubmit={onSubmit}>
      <p className="eyebrow">{isSignUp ? "Create account" : "Sign in"}</p>
      <h2 className="panel-title">{isSignUp ? "Admin sign up" : "Admin sign in"}</h2>

      <div className="form-grid">
        {isSignUp ? (
          <label>
            Name
            <input {...form.register("name")} placeholder="Your name" />
          </label>
        ) : null}

        <label>
          Email
          <input {...form.register("email")} placeholder="name@example.com" type="email" />
        </label>

        <label>
          Password
          <input {...form.register("password")} placeholder="At least 8 characters" type="password" />
        </label>
      </div>

      {statusMessage ? (
        <p className="error-text">{statusMessage}</p>
      ) : (
        <p className="body-copy">
          {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
          <Link href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}>{isSignUp ? "Sign in" : "Create one"}</Link>
        </p>
      )}

      <button disabled={isPending} type="submit">
        {isPending ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
