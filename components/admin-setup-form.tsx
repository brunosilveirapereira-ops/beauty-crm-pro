"use client";

import { useState, type FormEvent } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { UserPlus } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

const adminEmail = "brunosilveirapereira@gmail.com";

export function AdminSetupForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!isSupabaseConfigured) {
      setMessage("Configure o Supabase no .env.local antes de criar o admin.");
      return;
    }

    if (password.length < 6) {
      setMessage("A password deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("As passwords nao coincidem.");
      return;
    }

    setLoading(true);
    const supabase = createClientComponentClient();
    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password
    });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.user && !data.session) {
      setMessage("Admin criado. Confirme o email no Supabase ou na caixa de entrada antes de entrar.");
      return;
    }

    setMessage("Admin criado com sucesso. Ja pode entrar no sistema.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-stone-700">Email admin</span>
        <input
          className="mt-1 w-full rounded-md border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm text-stone-600"
          type="email"
          value={adminEmail}
          readOnly
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-stone-700">Password</span>
        <input
          className="focus-ring mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-stone-700">Confirmar password</span>
        <input
          className="focus-ring mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={6}
          required
        />
      </label>
      {message ? <p className="rounded-md bg-champagne px-3 py-2 text-sm text-ink">{message}</p> : null}
      <button
        className="flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-graphite disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={loading}
      >
        <UserPlus className="h-4 w-4" />
        {loading ? "A criar..." : "Criar primeiro admin"}
      </button>
    </form>
  );
}
