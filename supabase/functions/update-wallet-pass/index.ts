import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const GOOGLE_WALLET_API = "https://walletobjects.googleapis.com/walletobjects/v1";

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri: string;
}

async function getGoogleAccessToken(serviceAccount: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600,
  }));

  const pemContent = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(`${header}.${payload}`));
  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const tokenRes = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${header}.${payload}.${sigBase64}`,
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { customer_id, points_balance } = await req.json();
    if (!customer_id) {
      return new Response(JSON.stringify({ error: "customer_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get customer's wallet passes
    const { data: walletPasses } = await supabase
      .from("wallet_passes")
      .select("*")
      .eq("customer_id", customer_id);

    if (!walletPasses || walletPasses.length === 0) {
      return new Response(JSON.stringify({ message: "No wallet passes to update" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, string> = {};

    // Update Google Wallet pass
    const googlePass = walletPasses.find(p => p.wallet_type === "google");
    if (googlePass?.pass_id) {
      const serviceAccountJson = Deno.env.get("GOOGLE_WALLET_SERVICE_ACCOUNT");
      if (serviceAccountJson) {
        try {
          const serviceAccount: ServiceAccountKey = JSON.parse(serviceAccountJson);
          const accessToken = await getGoogleAccessToken(serviceAccount);

          const patchRes = await fetch(`${GOOGLE_WALLET_API}/loyaltyObject/${googlePass.pass_id}`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              loyaltyPoints: {
                label: "Points",
                balance: { int: points_balance },
              },
            }),
          });

          results.google = patchRes.ok ? "updated" : `failed: ${patchRes.status}`;
        } catch (e) {
          results.google = `error: ${e.message}`;
        }
      }
    }

    // Apple push notification update would go here
    // Requires APNs push notification to the device token
    const applePass = walletPasses.find(p => p.wallet_type === "apple");
    if (applePass?.push_token) {
      // TODO: Send APNs push notification to trigger pass refresh
      results.apple = "push_not_implemented";
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Update wallet error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
