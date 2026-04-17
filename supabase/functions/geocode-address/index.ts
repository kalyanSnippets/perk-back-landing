const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { address, mode } = body ?? {};
    if (!address || typeof address !== "string" || address.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Address is required (min 3 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isSuggest = mode === "suggest";
    const limit = isSuggest ? 5 : 1;
    const encoded = encodeURIComponent(address.trim());
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=${limit}&countrycodes=au`;

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

    if (isSuggest) {
      const suggestions = (results || []).map((r: any) => ({
        display_name: r.display_name,
        latitude: parseFloat(r.lat),
        longitude: parseFloat(r.lon),
      }));
      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
