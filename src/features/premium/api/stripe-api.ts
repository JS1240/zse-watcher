import { supabase } from "@/config/supabase";
import { env } from "@/config/environment";
import { createLogger } from "@/lib/logger";

const logger = createLogger("StripeAPI");

export async function createCheckoutSession(
  cycle: "monthly" | "annual",
): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    logger.error("No auth session for checkout");
    return null;
  }

  try {
    const response = await fetch(
      `${env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ cycle }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error("Checkout session failed", error);
      return null;
    }

    const data = await response.json();
    return data.url ?? null;
  } catch (error) {
    logger.error("Checkout request failed", error);
    return null;
  }
}

export async function createPortalSession(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  try {
    const response = await fetch(
      `${env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ action: "portal" }),
      },
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.url ?? null;
  } catch (error) {
    logger.error("Portal session failed", error);
    return null;
  }
}
