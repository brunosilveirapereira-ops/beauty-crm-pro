import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const envPath = join(process.cwd(), ".env.local");
const env = existsSync(envPath) ? parseEnv(readFileSync(envPath, "utf8")) : {};
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const devMode = env.DEV_MODE ?? process.env.DEV_MODE ?? "";

console.log("[Beauty CRM Pro] Env check");
console.log(`[Beauty CRM Pro] .env.local encontrado: ${existsSync(envPath) ? "sim" : "nao"}`);
console.log(`[Beauty CRM Pro] NEXT_PUBLIC_SUPABASE_URL encontrada: ${supabaseUrl ? "sim" : "nao"}`);
console.log(`[Beauty CRM Pro] NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl || "(vazia)"}`);
console.log(`[Beauty CRM Pro] NEXT_PUBLIC_SUPABASE_ANON_KEY encontrada: ${supabaseAnonKey ? "sim" : "nao"}`);
console.log(`[Beauty CRM Pro] NEXT_PUBLIC_SUPABASE_ANON_KEY tamanho: ${supabaseAnonKey.length}`);
console.log(`[Beauty CRM Pro] DEV_MODE: ${devMode || "false"}`);

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
        return [key, value];
      })
  );
}
