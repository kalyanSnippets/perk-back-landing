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

// Helper to log integration events
async function logEvent(
  supabase: ReturnType<typeof createClient>,
  eventId: string | null,
  opts: {
    provider: string;
    event_type: string;
    external_event_id?: string | null;
    merchant_id?: string | null;
    status: string;
    payload?: unknown;
    error_message?: string | null;
  }
): Promise<string | null> {
  if (eventId) {
    // Update existing event
    await supabase
      .from("integration_events")
      .update({
        status: opts.status,
        error_message: opts.error_message || null,
        processed_at: opts.status !== "received" ? new Date().toISOString() : null,
      })
      .eq("id", eventId);
    return eventId;
  }
  // Insert new event
  const { data } = await supabase
    .from("integration_events")
    .insert({
      provider: opts.provider,
      event_type: opts.event_type,
      external_event_id: opts.external_event_id || null,
      merchant_id: opts.merchant_id || null,
      status: opts.status,
      payload: opts.payload || null,
    })
    .select("id")
    .single();
  return data?.id || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const eventType = payload?.type;

    // Log the incoming event
    let eventLogId = await logEvent(supabase, null, {
      provider: "square",
      event_type: eventType || "unknown",
      external_event_id: payload?.event_id || null,
      merchant_id: null, // will update later if we find the merchant
      status: "received",
      payload,
    });

    if (eventType !== "payment.completed" && eventType !== "payment.updated") {
      await logEvent(supabase, eventLogId, { provider: "square", event_type: eventType || "unknown", status: "skipped", error_message: "irrelevant_event" });
      return ok({ ok: true, skipped: true, reason: "irrelevant_event" });
    }

    const payment = payload?.data?.object?.payment;
    if (!payment) {
      await logEvent(supabase, eventLogId, { provider: "square", event_type: eventType, status: "skipped", error_message: "no_payment_data" });
      return ok({ ok: true, skipped: true, reason: "no_payment_data" });
    }

    if (eventType === "payment.updated" && payment.status !== "COMPLETED") {
      await logEvent(supabase, eventLogId, { provider: "square", event_type: eventType, status: "skipped", error_message: "payment_not_completed" });
      return ok({ ok: true, skipped: true, reason: "payment_not_completed" });
    }

    const locationId = payment.location_id;
    const squarePaymentId = payment.id;
    const amountCents = payment.amount_money?.amount || 0;
    const purchaseAmount = amountCents / 100;

    if (purchaseAmount <= 0) {
      await logEvent(supabase, eventLogId, { provider: "square", event_type: eventType, status: "skipped", error_message: "zero_amount" });
      return ok({ ok: true, skipped: true, reason: "zero_amount" });
    }

    // Duplicate protection
    if (squarePaymentId) {
      const { data: existingTx } = await supabase
        .from("transactions")
        .select("id")
        .eq("external_payment_id", squarePaymentId)
        .maybeSingle();

      if (existingTx) {
        await logEvent(supabase, eventLogId, { provider: "square", event_type: eventType, status: "skipped", error_message: "duplicate" });
        return ok({ ok: true, skipped: true, reason: "duplicate", square_payment_id: squarePaymentId });
      }
    }

    // Find POS connection
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
      await logEvent(supabase, eventLogId, { provider: "square", event_type: eventType, status: "failed", error_message: "merchant_not_found" });
      return ok({ ok: true, matched: false, reason: "merchant_not_found" });
    }

    // Update event log with merchant_id
    if (eventLogId) {
      await supabase.from("integration_events").update({ merchant_id: posConnection.merchant_id }).eq("id", eventLogId);
    }

    // Verify webhook signature
    const signatureHeader = req.headers.get("x-square-hmacsha256-signature");
    if (posConnection.webhook_signature_key) {
      const webhookUrl = `${supabaseUrl}/functions/v1/pos-webhook`;
      const valid = await verifySquareSignature(body, signatureHeader, posConnection.webhook_signature_key, webhookUrl);
      if (!valid) {
        await logEvent(supabase, eventLogId, { provider: "square", event_type: eventType, status: "failed", error_message: "invalid_signature" });
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
      await logEvent(supabase, eventLogId, { provider: "square", event_type: eventType, status: "failed", error_message: "merchant_record_not_found" });
      return ok({ ok: true, matched: false, reason: "merchant_record_not_found" });
    }

    // Customer matching — check persistent mapping first
    let customerId: string | null = null;
    let matchMethod: string | null = null;
    const squareCustomerId = payment.customer_id || null;
    const matchAttempted: Record<string, string | null> = { card: null, phone: null, email: null };

    if (squareCustomerId) {
      const { data: existingMapping } = await supabase
        .from("external_customer_mappings")
        .select("customer_id")
        .eq("provider", "square")
        .eq("external_customer_id", squareCustomerId)
        .eq("merchant_id", merchant.id)
        .maybeSingle();

      if (existingMapping) {
        customerId = existingMapping.customer_id;
        matchMethod = "cached";
      }
    }

    // 1. Try loyalty_card_number from payment note/reference_id
    if (!customerId) {
      const noteField = payment.note || payment.reference_id || "";
      if (noteField) {
        const cardMatch = noteField.match(/\b(\d{10})\b/);
        if (cardMatch) {
          matchAttempted.card = cardMatch[1];
          const { data: custByCard } = await supabase
            .from("customers")
            .select("id")
            .eq("loyalty_card_number", cardMatch[1])
            .maybeSingle();
          if (custByCard) {
            customerId = custByCard.id;
            matchMethod = "card";
          }
        }
      }
    }

    // 2. Try Square customer info (phone, then email)
    if (!customerId && squareCustomerId && posConnection.access_token) {
      try {
        const custResponse = await fetch(
          `${squareBaseUrl}/v2/customers/${squareCustomerId}`,
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

        if (phone) {
          matchAttempted.phone = phone;
          const { data: custByPhone } = await supabase
            .from("customers")
            .select("id")
            .eq("phone", phone)
            .maybeSingle();
          if (custByPhone) {
            customerId = custByPhone.id;
            matchMethod = "phone";
          }
        }

        if (!customerId && email) {
          matchAttempted.email = email;
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
            if (custByEmail) {
              customerId = custByEmail.id;
              matchMethod = "email";
            }
          }
        }
      } catch (e) {
        console.warn("Failed to fetch Square customer:", e);
      }
    }

    // Persist new mapping for future lookups
    if (customerId && squareCustomerId && matchMethod !== "cached") {
      await supabase
        .from("external_customer_mappings")
        .upsert(
          {
            customer_id: customerId,
            provider: "square",
            external_customer_id: squareCustomerId,
            merchant_id: merchant.id,
            match_method: matchMethod,
          },
          { onConflict: "provider,external_customer_id,merchant_id" }
        );
    }

    if (!customerId) {
      // Store as unmatched transaction for later manual linking
      await supabase.from("unmatched_transactions").insert({
        merchant_id: merchant.id,
        provider: "square",
        external_payment_id: squarePaymentId || null,
        purchase_amount: purchaseAmount,
        external_customer_id: squareCustomerId,
        match_attempted: matchAttempted,
        status: "pending",
      });

      await logEvent(supabase, eventLogId, { provider: "square", event_type: eventType, status: "processed", error_message: "customer_not_found_stored_unmatched" });
      return ok({
        ok: true,
        matched: false,
        reason: "customer_not_found",
        stored_for_review: true,
        square_payment_id: squarePaymentId,
      });
    }

    // Points calculation: 1 point per $1 spent
    const pointsAwarded = Math.floor(purchaseAmount);

    // Insert transaction
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
      if (txError.code === "23505") {
        await logEvent(supabase, eventLogId, { provider: "square", event_type: eventType, status: "skipped", error_message: "duplicate" });
        return ok({ ok: true, skipped: true, reason: "duplicate" });
      }
      await logEvent(supabase, eventLogId, { provider: "square", event_type: eventType, status: "failed", error_message: txError.message });
      return ok({ ok: false, reason: "transaction_insert_failed" });
    }

    await logEvent(supabase, eventLogId, { provider: "square", event_type: eventType, status: "processed" });

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
