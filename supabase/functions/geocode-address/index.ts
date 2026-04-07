import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();
    if (!address || typeof address !== "string" || address.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Address is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const encoded = encodeURIComponent(address.trim());
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=au`;

    const res = await fetch(url, {
      headers: { "User-Agent": "PerkBack/1.0 (loyalty platform)" },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Geocoding service unavailable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await res.json();
    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ latitude: null, longitude: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        latitude: parseFloat(results[0].lat),
        longitude: parseFloat(results[0].lon),
        display_name: results[0].display_name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
