import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    if (!TWILIO_API_KEY) throw new Error("TWILIO_API_KEY is not configured. Please connect Twilio first.");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify caller is an authenticated merchant
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { type, merchant_id, from_number } = body;

    if (!merchant_id || !from_number) {
      return new Response(JSON.stringify({ error: "merchant_id and from_number required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify merchant ownership
    const { data: merchant } = await supabase
      .from("merchants")
      .select("id, store_name, user_id")
      .eq("id", merchant_id)
      .maybeSingle();

    if (!merchant || merchant.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized merchant" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let recipients: { phone: string; name: string }[] = [];
    let messageTemplate = "";

    if (type === "birthday") {
      // Get birthday settings
      const { data: settings } = await supabase
        .from("birthday_offer_settings")
        .select("*")
        .eq("merchant_id", merchant_id)
        .maybeSingle();

      if (!settings || !settings.enabled) {
        return new Response(JSON.stringify({ error: "Birthday offers not enabled" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find customers with birthdays in window
      const today = new Date();
      const windowStart = new Date(today);
      windowStart.setDate(windowStart.getDate() - settings.days_before);

      // Get customers who transacted with this merchant and have DOB
      const { data: txCustomerIds } = await supabase
        .from("transactions")
        .select("customer_id")
        .eq("merchant_id", merchant_id);

      const uniqueIds = [...new Set((txCustomerIds || []).map(t => t.customer_id))];
      if (uniqueIds.length === 0) {
        return new Response(JSON.stringify({ sent: 0, message: "No customers found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: customers } = await supabase
        .from("customers")
        .select("full_name, phone, date_of_birth")
        .in("id", uniqueIds)
        .not("phone", "is", null)
        .not("date_of_birth", "is", null);

      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();

      recipients = (customers || [])
        .filter(c => {
          if (!c.date_of_birth || !c.phone) return false;
          const dob = new Date(c.date_of_birth);
          return dob.getMonth() + 1 === todayMonth && Math.abs(dob.getDate() - todayDay) <= settings.days_before;
        })
        .map(c => ({ phone: c.phone!, name: c.full_name || "Customer" }));

      messageTemplate = settings.message || `Happy Birthday! 🎂 ${merchant.store_name} has a special reward for you!`;

    } else if (type === "monthly_offer") {
      const { offer_id } = body;
      if (!offer_id) {
        return new Response(JSON.stringify({ error: "offer_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: offer } = await supabase
        .from("monthly_offers")
        .select("title, description")
        .eq("id", offer_id)
        .eq("merchant_id", merchant_id)
        .maybeSingle();

      if (!offer) {
        return new Response(JSON.stringify({ error: "Offer not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get all customers who transacted with this merchant
      const { data: txCustomerIds } = await supabase
        .from("transactions")
        .select("customer_id")
        .eq("merchant_id", merchant_id);

      const uniqueIds = [...new Set((txCustomerIds || []).map(t => t.customer_id))];
      if (uniqueIds.length > 0) {
        const { data: customers } = await supabase
          .from("customers")
          .select("full_name, phone")
          .in("id", uniqueIds)
          .not("phone", "is", null);

        recipients = (customers || []).map(c => ({ phone: c.phone!, name: c.full_name || "Customer" }));
      }

      messageTemplate = `${merchant.store_name}: ${offer.title}${offer.description ? ` - ${offer.description}` : ""}`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid type. Use 'birthday' or 'monthly_offer'" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No eligible recipients with phone numbers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send SMS via Twilio gateway
    let sentCount = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      try {
        const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TWILIO_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: recipient.phone,
            From: from_number,
            Body: messageTemplate.replace("{name}", recipient.name),
          }),
        });

        if (response.ok) {
          sentCount++;
        } else {
          const errData = await response.json();
          errors.push(`${recipient.phone}: ${errData.message || response.status}`);
        }
      } catch (err: any) {
        errors.push(`${recipient.phone}: ${err.message}`);
      }
    }

    return new Response(JSON.stringify({
      sent: sentCount,
      total: recipients.length,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("send-sms-notification error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
