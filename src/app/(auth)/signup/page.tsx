"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthSplit } from "@/components/AuthSplit";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <AuthSplit title="Almost there!" subtitle="One last step to join buddi.">
        <div className="animate-pop-in rounded-2xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-500/10 p-6 text-center">
          <p className="text-3xl">📬</p>
          <p className="mt-3 font-semibold text-green-700 dark:text-green-400">
            Check your email to confirm your account!
          </p>
          <p className="mt-1 text-sm text-green-600 dark:text-green-400">
            We sent a confirmation link to {email}.
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already confirmed?{" "}
          <Link href="/login" className="font-semibold text-purple-600 dark:text-purple-400 hover:underline">
            Log in
          </Link>
        </p>
      </AuthSplit>
    );
  }

  return (
    <AuthSplit
      title="Create your account"
      subtitle="Start your accountability circle in less than a minute."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            required
            minLength={3}
            placeholder="janedoe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account…" : "Sign up"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-purple-600 dark:text-purple-400 hover:underline">
          Log in
        </Link>
      </p>
    </AuthSplit>
  );
}
