import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type DeletionScope = "all" | "customer_only" | "merchant_only";

interface DeletionPayload {
  reason?: string;
  scope?: DeletionScope;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller's JWT
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userId = claimsData.claims.sub as string;

    // Optional reason + scope
    let reason: string | undefined;
    let scope: DeletionScope = "all";
    try {
      const body = (await req.json()) as DeletionPayload;
      reason = body?.reason?.toString().slice(0, 200);
      if (body?.scope === "customer_only" || body?.scope === "merchant_only" || body?.scope === "all") {
        scope = body.scope;
      }
    } catch {
      // body is optional
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Look up both possible records for this user
    const { data: merchantRow } = await adminClient
      .from("merchants")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    const { data: customerRow } = await adminClient
      .from("customers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const merchantId = merchantRow?.id as string | undefined;
    const customerId = customerRow?.id as string | undefined;

    const deleteMerchantData = async () => {
      if (!merchantId) return;
      try {
        await adminClient.from("birthday_offer_settings").delete().eq("merchant_id", merchantId);
        await adminClient.from("gamification_settings").delete().eq("merchant_id", merchantId);
        await adminClient.from("merchant_feature_overrides").delete().eq("merchant_id", merchantId);
        await adminClient.from("merchant_subscriptions").delete().eq("merchant_id", merchantId);
        await adminClient.from("nfc_tap_tokens").delete().eq("merchant_id", merchantId);
        await adminClient.from("pos_connections").delete().eq("merchant_id", merchantId);
        await adminClient.from("product_offers").delete().eq("merchant_id", merchantId);
        await adminClient.from("promotion_rules").delete().eq("merchant_id", merchantId);
        await adminClient.from("monthly_offers").delete().eq("merchant_id", merchantId);
        await adminClient.from("campaigns").delete().eq("merchant_id", merchantId);
        await adminClient.from("rewards").delete().eq("merchant_id", merchantId);
        await adminClient.from("redemptions").delete().eq("merchant_id", merchantId);
        await adminClient.from("customer_stamps").delete().eq("merchant_id", merchantId);
        await adminClient.from("customer_merchants").delete().eq("merchant_id", merchantId);
        await adminClient.from("external_customer_mappings").delete().eq("merchant_id", merchantId);
        await adminClient.from("unmatched_transactions").delete().eq("merchant_id", merchantId);
        await adminClient.from("transactions").delete().eq("merchant_id", merchantId);
        await adminClient.from("merchants").delete().eq("id", merchantId);
      } catch (e) {
        console.error("Merchant cleanup error (non-fatal):", e);
      }
    };

    const deleteCustomerData = async () => {
      if (!customerId) return;
      try {
        await adminClient.from("wallet_passes").delete().eq("customer_id", customerId);
        await adminClient.from("customer_stamps").delete().eq("customer_id", customerId);
        await adminClient.from("customer_merchants").delete().eq("customer_id", customerId);
        await adminClient.from("redemptions").delete().eq("customer_id", customerId);
        await adminClient.from("transactions").delete().eq("customer_id", customerId);
        await adminClient.from("external_customer_mappings").delete().eq("customer_id", customerId);
        await adminClient.from("customers").delete().eq("id", customerId);
      } catch (e) {
        console.error("Customer cleanup error (non-fatal):", e);
      }
    };

    if (scope === "merchant_only") {
      await deleteMerchantData();
    } else if (scope === "customer_only") {
      await deleteCustomerData();
    } else {
      // all
      await deleteMerchantData();
      await deleteCustomerData();
      try {
        await adminClient.from("user_roles").delete().eq("user_id", userId);
      } catch (e) {
        console.error("Role cleanup error (non-fatal):", e);
      }
    }

    // Decide whether to delete the auth user.
    // Re-check remaining records after partial deletion.
    let authDeleted = false;
    if (scope === "all") {
      const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteErr) {
        console.error("Auth user deletion error:", deleteErr);
        return new Response(
          JSON.stringify({ error: deleteErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      authDeleted = true;
    } else {
      // Partial scope: only remove auth.users if NO profile remains on either side.
      const { data: remainingMerchant } = await adminClient
        .from("merchants").select("id").eq("user_id", userId).maybeSingle();
      const { data: remainingCustomer } = await adminClient
        .from("customers").select("id").eq("user_id", userId).maybeSingle();

      if (!remainingMerchant && !remainingCustomer) {
        try {
          await adminClient.from("user_roles").delete().eq("user_id", userId);
        } catch (e) {
          console.error("Role cleanup error (non-fatal):", e);
        }
        const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);
        if (!deleteErr) authDeleted = true;
        else console.error("Auth user deletion error (partial fallthrough):", deleteErr);
      }
    }

    console.log(
      `Account deletion for user ${userId}. Scope: ${scope}. Auth removed: ${authDeleted}. Reason: ${reason || "not provided"}`,
    );

    return new Response(
      JSON.stringify({ success: true, scope, authDeleted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
