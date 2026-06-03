import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { isSupabaseConfigured } from "./supabase";

export function getSupabaseServerClient() {
  if (!isSupabaseConfigured) return null;
  return createServerComponentClient({ cookies });
}
