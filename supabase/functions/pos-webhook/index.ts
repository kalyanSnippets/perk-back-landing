import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import { createHmac } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.text();
    const payload = JSON.parse(body);

    // Validate it's a payment.completed event
    const eventType = payload?.type;
    if (eventType !== "payment.completed") {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payment = payload?.data?.object?.payment;
    if (!payment) {
      return new Response(JSON.stringify({ error: "No payment data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const locationId = payment.location_id;
    const amountCents = payment.amount_money?.amount || 0;
    const purchaseAmount = amountCents / 100; // Convert cents to dollars

    if (purchaseAmount <= 0) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "zero_amount" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find POS connection by location_id
    const { data: posConnection } = await supabase
      .from("pos_connections")
      .select("merchant_id, webhook_signature_key")
      .eq("location_id", locationId)
      .eq("provider", "square")
      .eq("is_active", true)
      .maybeSingle();

    if (!posConnection) {
      console.warn("No active POS connection for location:", locationId);
      return new Response(JSON.stringify({ error: "Unknown location" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get merchant info
    const { data: merchant } = await supabase
      .from("merchants")
      .select("id, store_name")
      .eq("id", posConnection.merchant_id)
      .single();

    if (!merchant) {
      return new Response(JSON.stringify({ error: "Merchant not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to match customer by phone from Square payment
    let customerId: string | null = null;
    const buyerPhone = payment.buyer_email_address
      ? null
      : payment.receipt_url
        ? null
        : null;

    // Check if Square provides customer info
    const squareCustomerId = payment.customer_id;
    if (squareCustomerId) {
      // Look up from POS connection's access token
      const { data: pc } = await supabase
        .from("pos_connections")
        .select("access_token")
        .eq("merchant_id", merchant.id)
        .eq("provider", "square")
        .single();

      if (pc?.access_token) {
        try {
          const custResponse = await fetch(
            `https://connect.squareup.com/v2/customers/${squareCustomerId}`,
            {
              headers: {
                Authorization: `Bearer ${pc.access_token}`,
                "Content-Type": "application/json",
              },
            }
          );
          const custData = await custResponse.json();
          const phone = custData?.customer?.phone_number;
          const email = custData?.customer?.email_address;

          // Match by phone
          if (phone) {
            const { data: customer } = await supabase
              .from("customers")
              .select("id")
              .eq("phone", phone)
              .maybeSingle();
            if (customer) customerId = customer.id;
          }

          // Fallback: match by email
          if (!customerId && email) {
            const { data: users } = await supabase.auth.admin.listUsers();
            const matchedUser = users?.users?.find(
              (u) => u.email?.toLowerCase() === email.toLowerCase()
            );
            if (matchedUser) {
              const { data: customer } = await supabase
                .from("customers")
                .select("id")
                .eq("user_id", matchedUser.id)
                .maybeSingle();
              if (customer) customerId = customer.id;
            }
          }
        } catch (e) {
          console.warn("Failed to fetch Square customer:", e);
        }
      }
    }

    if (!customerId) {
      // Log unmatched transaction for manual review
      console.warn("Could not match customer for Square payment:", payment.id);
      return new Response(
        JSON.stringify({
          ok: true,
          matched: false,
          reason: "customer_not_found",
          square_payment_id: payment.id,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate points: 1 point per $2 spent
    const pointsAwarded = Math.floor(purchaseAmount / 2);

    // Insert transaction
    const { error: txError } = await supabase.from("transactions").insert({
      customer_id: customerId,
      merchant_id: merchant.id,
      merchant_name: merchant.store_name,
      purchase_amount: purchaseAmount,
      points_awarded: pointsAwarded,
      source: "square",
    });

    if (txError) {
      console.error("Failed to insert transaction:", txError);
      return new Response(JSON.stringify({ error: "Transaction insert failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update customer points balance
    const { error: updateError } = await supabase.rpc("add_points_balance", {
      _customer_id: customerId,
      _points: pointsAwarded,
    });

    // Fallback: direct update if rpc doesn't exist
    if (updateError) {
      await supabase
        .from("customers")
        .update({
          points_balance: supabase.rpc ? undefined : pointsAwarded,
        })
        .eq("id", customerId);

      // Direct SQL update via raw
      const { data: currentCustomer } = await supabase
        .from("customers")
        .select("points_balance")
        .eq("id", customerId)
        .single();

      if (currentCustomer) {
        await supabase
          .from("customers")
          .update({ points_balance: currentCustomer.points_balance + pointsAwarded })
          .eq("id", customerId);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        matched: true,
        customer_id: customerId,
        points_awarded: pointsAwarded,
        purchase_amount: purchaseAmount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("POS webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
