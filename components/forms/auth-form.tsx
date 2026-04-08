"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getDictionary, resolveLocale, withLang } from "@/lib/i18n";

type AuthMode = "sign_in" | "sign_up";

export function AuthForm({ mode, locale = "fr" }: { mode: AuthMode; locale?: string }) {
  const currentLocale = resolveLocale(locale);
  const t = getDictionary(currentLocale);
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"email" | "magic" | "google" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isSignUp = mode === "sign_up";

  async function handleEmailAuth() {
    if (!supabase) {
      setError("Supabase auth is not configured yet.");
      return;
    }

    setLoading("email");
    setError("");
    setSuccess("");

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: withLang(`${window.location.origin}/dashboard`, currentLocale),
            data: {
              full_name: fullName.trim()
            }
          }
        });

        if (signUpError) throw signUpError;
        setSuccess("Account created. Check your email to confirm your account if Supabase confirmation is enabled.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (signInError) throw signInError;
        router.push(withLang("/dashboard", currentLocale));
        router.refresh();
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed.");
    } finally {
      setLoading(null);
    }
  }

  async function handleMagicLink() {
    if (!supabase) {
      setError("Supabase auth is not configured yet.");
      return;
    }

    setLoading("magic");
    setError("");
    setSuccess("");

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: withLang(`${window.location.origin}/dashboard`, currentLocale)
        }
      });

      if (otpError) throw otpError;
      setSuccess("Magic link sent. Check your inbox.");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to send magic link.");
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogleAuth() {
    if (!supabase) {
      setError("Supabase auth is not configured yet.");
      return;
    }

    setLoading("google");
    setError("");
    setSuccess("");

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: withLang(`${window.location.origin}/dashboard`, currentLocale)
        }
      });

      if (oauthError) throw oauthError;
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to start Google sign-in.");
      setLoading(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <Card className="w-full max-w-md bg-white">
        <p className="text-2xl font-semibold">{isSignUp ? t.auth.createWorkspace : t.auth.welcomeBack}</p>
        <p className="mt-2 text-sm text-muted-foreground">{isSignUp ? t.auth.signUpBody : t.auth.signInBody}</p>

        <div className="mt-6 space-y-4">
          {isSignUp ? (
            <Input placeholder={t.auth.fullName} value={fullName} onChange={(event) => setFullName(event.target.value)} />
          ) : null}
          <Input placeholder="you@company.com" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input placeholder={t.auth.password} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />

          <Button className="w-full" disabled={loading !== null} onClick={handleEmailAuth}>
            {loading === "email" ? "Loading..." : isSignUp ? t.common.signUp : t.common.signIn}
          </Button>

          <Button className="w-full" variant="outline" disabled={loading !== null || !email.trim()} onClick={handleMagicLink}>
            {loading === "magic" ? "Sending..." : t.common.sendMagicLink}
          </Button>

          <Button className="w-full" variant="outline" disabled={loading !== null} onClick={handleGoogleAuth}>
            {loading === "google" ? "Redirecting..." : "Continue with Google"}
          </Button>
        </div>

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        {success ? <p className="mt-4 text-sm text-primary">{success}</p> : null}

        <p className="mt-4 text-sm text-muted-foreground">
          {isSignUp ? t.auth.alreadyHaveAccount : t.auth.noAccount}{" "}
          <Link href={withLang(isSignUp ? "/auth/sign-in" : "/auth/sign-up", currentLocale)} className="text-primary">
            {isSignUp ? t.common.signIn : t.common.createOne}
          </Link>
        </p>
      </Card>
    </div>
  );
}
