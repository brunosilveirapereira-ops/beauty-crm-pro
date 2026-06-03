"use client";

import { useEffect } from "react";
import { Database, HardDrive } from "lucide-react";
import { dataMode, isSupabaseConfigured } from "@/lib/supabase";

export function DataModeIndicator() {
  const isSupabase = dataMode === "supabase";
  const Icon = isSupabase ? Database : HardDrive;

  useEffect(() => {
    console.info("[Beauty CRM Pro] Estado da configuracao Supabase:", {
      mode: dataMode,
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      isSupabaseConfigured
    });
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold ${
        isSupabase ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
      title={isSupabase ? "Dados a ler e gravar no Supabase" : "Fallback de testes com dados demo/localStorage"}
    >
      <Icon className="h-4 w-4" />
      {isSupabase ? "Supabase conectado" : "Modo local"}
    </div>
  );
}
