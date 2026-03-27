import { z } from "zod/v4";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_EODHD_API_KEY: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

function getEnv(): Env {
  // In development, allow missing env vars for initial setup
  if (import.meta.env.DEV) {
    return {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ?? "http://localhost:54321",
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "dev-placeholder",
      VITE_EODHD_API_KEY: import.meta.env.VITE_EODHD_API_KEY as string | undefined,
    };
  }

  const parsed = envSchema.safeParse(import.meta.env);
  if (!parsed.success) {
    const formatted = z.prettifyError(parsed.error);
    throw new Error(`Invalid environment variables:\n${formatted}`);
  }
  return parsed.data;
}

export const env = getEnv();
