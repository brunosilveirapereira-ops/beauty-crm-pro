"use client";

import { useState, type FormEvent } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Eye, LogIn } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (!isSupabaseConfigured) {
      setMessage("Configure as chaves Supabase no .env.local para ativar o login.");
      setLoading(false);
      return;
    }

    const supabase = createClientComponentClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    window.location.href = next || "/dashboard";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-stone-700">Email</span>
        <input
          className="focus-ring mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="dona@salao.pt"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-stone-700">Password</span>
        <div className="relative mt-1">
          <input
            className="focus-ring w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 pr-10 text-sm"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
          />
          <Eye className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-stone-400" />
        </div>
      </label>
      {message ? <p className="rounded-md bg-champagne px-3 py-2 text-sm text-ink">{message}</p> : null}
      <button
        className="flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-graphite disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={loading}
      >
        <LogIn className="h-4 w-4" />
        {loading ? "A entrar..." : "Entrar"}
      </button>
    </form>
  );
}
