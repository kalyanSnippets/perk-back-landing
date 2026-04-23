import { supabase } from "@/integrations/supabase/client";

export interface JoinMerchantPayload {
  success: boolean;
  merchant_id?: string;
  merchant_name?: string;
  merchant_logo?: string | null;
  crn?: string;
  loyalty_card_number?: string;
  full_name?: string | null;
  error?: string;
}

interface JoinByMerchantIdOptions {
  merchantId: string;
  source?: string;
}

interface JoinBySlugOptions {
  merchantSlug: string;
  source?: string;
}

type JoinMerchantOptions = JoinByMerchantIdOptions | JoinBySlugOptions;

export const getJoinMerchantErrorMessage = (message?: string | null) => {
  const normalized = message?.trim().toLowerCase() ?? "";

  if (!normalized) return "We couldn’t link your loyalty profile yet. Please try again.";
  if (normalized.includes("not authenticated")) return "Please sign in to join this store.";
  if (normalized.includes("customer profile missing")) return "We couldn’t link your loyalty profile yet. Please try again.";
  if (normalized.includes("merchant not found")) return "This store is unavailable right now.";

  return message ?? "We couldn’t link your loyalty profile yet. Please try again.";
};

export const linkCustomerToMerchant = async (options: JoinMerchantOptions) => {
  const source = options.source ?? ("merchantId" in options ? "explore" : "qr-poster");

  const response = "merchantId" in options
    ? await supabase.rpc("join_merchant", { _merchant_id: options.merchantId, _source: source })
    : await supabase.rpc("join_merchant_by_slug", { _slug: options.merchantSlug, _source: source });

  if (response.error) {
    return {
      success: false,
      error: getJoinMerchantErrorMessage(response.error.message),
    };
  }

  const payload = response.data as JoinMerchantPayload | null;

  if (!payload?.success) {
    return {
      success: false,
      error: getJoinMerchantErrorMessage(payload?.error),
    };
  }

  return {
    success: true,
    data: payload,
  };
};