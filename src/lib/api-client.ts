import { env } from "@/config/environment";
import { createLogger } from "@/lib/logger";

const logger = createLogger("ApiClient");

const BASE_URL = `${env.VITE_SUPABASE_URL}/functions/v1/zse-proxy`;

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  logger.debug(`Fetching ${path}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: env.VITE_SUPABASE_ANON_KEY,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    logger.error(`API error ${response.status}: ${errorText}`);
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}
