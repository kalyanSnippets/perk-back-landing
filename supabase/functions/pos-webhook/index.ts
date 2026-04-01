import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function verifySquareSignature(
  body: string,
  signatureHeader: string | null,
  signatureKey: string | null,
  webhookUrl: string
): Promise<boolean> {
  if (!signatureKey || !signatureHeader) return false;
  try {
    const payload = webhookUrl + body;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(signatureKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    return base64Signature === signatureHeader;
  } catch (e) {
    console.warn("Signature verification failed:", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Always return 200 to Square to avoid retries
  const ok = (data: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") {
    return ok({ error: "Method not allowed" }, 200);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const squareEnv = Deno.env.get("SQUARE_ENVIRONMENT") || "production";
    const squareBaseUrl =
      squareEnv === "sandbox"
        ? "https://connect.squareupsandbox.com"
        : "https://connect.squareup.com";

    const body = await req.text();
    const payload = JSON.parse(body);

    // Accept both payment.completed and payment.updated
    const eventType = payload?.type;
    if (eventType !== "payment.completed" && eventType !== "payment.updated") {
      return ok({ ok: true, skipped: true, reason: "irrelevant_event" });
    }

    const payment = payload?.data?.object?.payment;
    if (!payment) {
      return ok({ ok: true, skipped: true, reason: "no_payment_data" });
    }

    // For payment.updated, only process COMPLETED status
    if (eventType === "payment.updated" && payment.status !== "COMPLETED") {
      return ok({ ok: true, skipped: true, reason: "payment_not_completed" });
    }

    const locationId = payment.location_id;
    const squarePaymentId = payment.id;
    const amountCents = payment.amount_money?.amount || 0;
    const purchaseAmount = amountCents / 100;

    if (purchaseAmount <= 0) {
      return ok({ ok: true, skipped: true, reason: "zero_amount" });
    }

    // Duplicate protection: check external_payment_id
    if (squarePaymentId) {
      const { data: existingTx } = await supabase
        .from("transactions")
        .select("id")
        .eq("external_payment_id", squarePaymentId)
        .maybeSingle();

      if (existingTx) {
        return ok({ ok: true, skipped: true, reason: "duplicate", square_payment_id: squarePaymentId });
      }
    }

    // Find POS connection by location_id or provider_account_id
    let posConnection: { merchant_id: string; webhook_signature_key: string | null; access_token: string | null } | null = null;

    const { data: byLocation } = await supabase
      .from("pos_connections")
      .select("merchant_id, webhook_signature_key, access_token")
      .eq("location_id", locationId)
      .eq("provider", "square")
      .eq("is_active", true)
      .maybeSingle();

    posConnection = byLocation;

    if (!posConnection && payload?.merchant_id) {
      const { data: byProvider } = await supabase
        .from("pos_connections")
        .select("merchant_id, webhook_signature_key, access_token")
        .eq("provider_account_id", payload.merchant_id)
        .eq("provider", "square")
        .eq("is_active", true)
        .maybeSingle();
      posConnection = byProvider;
    }

    if (!posConnection) {
      console.warn("No active POS connection for location:", locationId);
      return ok({ ok: true, matched: false, reason: "merchant_not_found" });
    }

    // Verify webhook signature if key exists
    const signatureHeader = req.headers.get("x-square-hmacsha256-signature");
    if (posConnection.webhook_signature_key) {
      const webhookUrl = `${supabaseUrl}/functions/v1/pos-webhook`;
      const valid = await verifySquareSignature(body, signatureHeader, posConnection.webhook_signature_key, webhookUrl);
      if (!valid) {
        console.warn("Invalid webhook signature");
        return ok({ ok: false, reason: "invalid_signature" });
      }
    }

    // Get merchant info
    const { data: merchant } = await supabase
      .from("merchants")
      .select("id, store_name")
      .eq("id", posConnection.merchant_id)
      .single();

    if (!merchant) {
      return ok({ ok: true, matched: false, reason: "merchant_record_not_found" });
    }

    // Customer matching logic
    let customerId: string | null = null;

    // 1. Try loyalty_card_number from payment note/reference_id
    const noteField = payment.note || payment.reference_id || "";
    if (noteField) {
      const cardMatch = noteField.match(/\b(\d{10})\b/);
      if (cardMatch) {
        const { data: custByCard } = await supabase
          .from("customers")
          .select("id")
          .eq("loyalty_card_number", cardMatch[1])
          .maybeSingle();
        if (custByCard) customerId = custByCard.id;
      }
    }

    // 2. Try Square customer info (phone, then email)
    if (!customerId && payment.customer_id && posConnection.access_token) {
      try {
        const custResponse = await fetch(
          `${squareBaseUrl}/v2/customers/${payment.customer_id}`,
          {
            headers: {
              Authorization: `Bearer ${posConnection.access_token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const custData = await custResponse.json();
        const phone = custData?.customer?.phone_number;
        const email = custData?.customer?.email_address;

        if (phone && !customerId) {
          const { data: custByPhone } = await supabase
            .from("customers")
            .select("id")
            .eq("phone", phone)
            .maybeSingle();
          if (custByPhone) customerId = custByPhone.id;
        }

        if (!customerId && email) {
          const { data: users } = await supabase.auth.admin.listUsers();
          const matchedUser = users?.users?.find(
            (u) => u.email?.toLowerCase() === email.toLowerCase()
          );
          if (matchedUser) {
            const { data: custByEmail } = await supabase
              .from("customers")
              .select("id")
              .eq("user_id", matchedUser.id)
              .maybeSingle();
            if (custByEmail) customerId = custByEmail.id;
          }
        }
      } catch (e) {
        console.warn("Failed to fetch Square customer:", e);
      }
    }

    if (!customerId) {
      console.warn("Could not match customer for Square payment:", squarePaymentId);
      return ok({
        ok: true,
        matched: false,
        reason: "customer_not_found",
        square_payment_id: squarePaymentId,
      });
    }

    // Points calculation: 1 point per $1 spent
    const pointsAwarded = Math.floor(purchaseAmount);

    // Insert transaction with external_payment_id
    const { error: txError } = await supabase.from("transactions").insert({
      customer_id: customerId,
      merchant_id: merchant.id,
      merchant_name: merchant.store_name,
      purchase_amount: purchaseAmount,
      points_awarded: pointsAwarded,
      source: "square",
      external_payment_id: squarePaymentId || null,
    });

    if (txError) {
      // Could be duplicate constraint violation
      if (txError.code === "23505") {
        return ok({ ok: true, skipped: true, reason: "duplicate" });
      }
      console.error("Failed to insert transaction:", txError);
      return ok({ ok: false, reason: "transaction_insert_failed" });
    }

    // Points balance is updated automatically by the trg_sync_points_on_transaction trigger

    return ok({
      ok: true,
      matched: true,
      customer_id: customerId,
      points_awarded: pointsAwarded,
      purchase_amount: purchaseAmount,
    });
  } catch (err) {
    console.error("POS webhook error:", err);
    return ok({ ok: false, reason: "internal_error" });
  }
});
