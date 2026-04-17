import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is authenticated and has admin role
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleData } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find merchants without coords but with an address
    const { data: merchants, error: mErr } = await admin
      .from("merchants")
      .select("id, store_name, address, latitude, longitude")
      .is("latitude", null)
      .not("address", "is", null);

    if (mErr) throw mErr;

    const results: Array<{ id: string; store_name: string; status: string; lat?: number; lng?: number }> = [];
    let updated = 0;
    let failed = 0;

    for (const m of merchants ?? []) {
      const addr = (m.address || "").trim();
      if (addr.length < 3) {
        results.push({ id: m.id, store_name: m.store_name, status: "skipped: address too short" });
        continue;
      }

      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1&countrycodes=au`;
        const r = await fetch(url, { headers: { "User-Agent": "PerkBack/1.0 (backfill)" } });
        if (!r.ok) {
          failed++;
          results.push({ id: m.id, store_name: m.store_name, status: `nominatim ${r.status}` });
        } else {
          const arr = await r.json();
          if (Array.isArray(arr) && arr.length > 0) {
            const lat = parseFloat(arr[0].lat);
            const lng = parseFloat(arr[0].lon);
            const { error: upErr } = await admin
              .from("merchants")
              .update({ latitude: lat, longitude: lng })
              .eq("id", m.id);
            if (upErr) {
              failed++;
              results.push({ id: m.id, store_name: m.store_name, status: `db error: ${upErr.message}` });
            } else {
              updated++;
              results.push({ id: m.id, store_name: m.store_name, status: "updated", lat, lng });
            }
          } else {
            results.push({ id: m.id, store_name: m.store_name, status: "no match" });
          }
        }
      } catch (e: any) {
        failed++;
        results.push({ id: m.id, store_name: m.store_name, status: `error: ${e.message}` });
      }

      // Respect Nominatim rate limit (≤1 req/s)
      await new Promise((r) => setTimeout(r, 1100));
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: merchants?.length ?? 0,
        updated,
        failed,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
