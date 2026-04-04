import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { merchant_id } = await req.json();
    if (!merchant_id) {
      return new Response(JSON.stringify({ error: "merchant_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch merchant's transaction summary
    const { data: transactions } = await supabase
      .from("transactions")
      .select("customer_id, purchase_amount, points_awarded, transaction_date")
      .eq("merchant_id", merchant_id)
      .order("transaction_date", { ascending: false })
      .limit(500);

    const txs = transactions || [];
    const totalCustomers = new Set(txs.map(t => t.customer_id)).size;
    const totalRevenue = txs.reduce((s, t) => s + Number(t.purchase_amount), 0);
    const avgSpend = txs.length ? (totalRevenue / txs.length).toFixed(2) : "0";

    // Day-of-week analysis
    const dayCount: Record<string, number> = {};
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    txs.forEach(t => {
      const day = days[new Date(t.transaction_date).getDay()];
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    const slowDays = Object.entries(dayCount).sort((a, b) => a[1] - b[1]).slice(0, 2).map(d => d[0]);

    const context = `
Merchant data summary:
- Total transactions: ${txs.length}
- Unique customers: ${totalCustomers}
- Total revenue: $${totalRevenue.toFixed(2)}
- Average transaction: $${avgSpend}
- Slowest days: ${slowDays.join(", ") || "Not enough data"}
- Date range: ${txs.length > 0 ? txs[txs.length - 1].transaction_date.split("T")[0] + " to " + txs[0].transaction_date.split("T")[0] : "No data"}
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a loyalty program marketing expert. Based on the merchant's transaction data, suggest 3-5 specific campaign ideas to improve customer engagement and revenue. Use the suggest_campaigns tool to return structured suggestions.",
          },
          { role: "user", content: context },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_campaigns",
              description: "Return campaign suggestions for the merchant",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        target_audience: { type: "string" },
                        expected_impact: { type: "string" },
                        confidence: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["title", "description", "target_audience", "expected_impact", "confidence"],
                    },
                  },
                },
                required: ["suggestions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_campaigns" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    let suggestions = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        suggestions = parsed.suggestions || [];
      } catch {
        suggestions = [];
      }
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-merchant-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
