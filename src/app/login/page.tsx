"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next")?.startsWith("/") ? searchParams.get("next")! : "/";
  const err = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <div className="max-w-md mx-auto mt-16 px-4 text-center text-text-secondary text-sm">
        <p>Sign-in is not configured (missing Supabase environment variables).</p>
        <Link href="/" className="text-accent-light mt-4 inline-block hover:underline">
          Back home
        </Link>
      </div>
    );
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setStatus("sending");
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    router.push(next);
  }

  async function handleMagicLink() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !email.trim()) return;
    setStatus("sending");
    setMessage(null);
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("sent");
    setMessage("Check your email for the sign-in link.");
  }

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <h1 className="text-xl font-bold text-text-primary mb-1">Sign in</h1>
      <p className="text-sm text-text-muted mb-6">
        Sign in with your email and password, or request a magic link.
      </p>
      {err && (
        <p className="text-sm text-status-offline mb-4">Could not complete sign-in. Try again.</p>
      )}
      <form onSubmit={handlePassword} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-text-muted mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary"
            disabled={status === "sending" || status === "sent"}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs font-medium text-text-muted mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary"
            disabled={status === "sending" || status === "sent"}
          />
        </div>
        <button
          type="submit"
          disabled={status === "sending" || status === "sent" || !password}
          className="w-full rounded-lg bg-accent/30 border border-accent/50 py-2.5 text-sm font-medium text-accent-light hover:bg-accent/40 disabled:opacity-50"
        >
          {status === "sending" ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className="my-4 flex items-center gap-3">
        <div className="flex-1 border-t border-border" />
        <span className="text-[10px] text-text-muted uppercase">or</span>
        <div className="flex-1 border-t border-border" />
      </div>
      <button
        type="button"
        onClick={handleMagicLink}
        disabled={status === "sending" || status === "sent" || !email.trim()}
        className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-hover disabled:opacity-50"
      >
        Email me a magic link
      </button>
      {message && <p className="text-sm text-text-secondary mt-4">{message}</p>}
      <Link href="/" className="text-sm text-accent-light mt-6 inline-block hover:underline">
        Back home
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-full bg-bg-primary text-text-primary py-8">
      <Suspense fallback={<div className="text-center text-text-muted text-sm">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
