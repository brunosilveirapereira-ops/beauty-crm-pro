export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl.length > 0 &&
    supabaseAnonKey.length > 0 &&
    !supabaseUrl.includes("your-project") &&
    supabaseAnonKey !== "your-anon-key"
);

export const dataMode = isSupabaseConfigured ? "supabase" : "local";
export const isDevMode = process.env.DEV_MODE === "true";
