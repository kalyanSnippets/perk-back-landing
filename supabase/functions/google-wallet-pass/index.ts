import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const GOOGLE_WALLET_API = "https://walletobjects.googleapis.com/walletobjects/v1";
const ISSUER_ID = "perkback"; // Will be replaced with real issuer ID from service account

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri: string;
}

async function getAccessToken(serviceAccount: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600,
  }));

  // Import the private key for signing
  const pemContent = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureInput = new TextEncoder().encode(`${header}.${payload}`);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, signatureInput);
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const jwt = `${header}.${payload}.${signatureBase64}`;

  const tokenRes = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}

async function createLoyaltyClass(accessToken: string, issuerId: string, merchantName: string) {
  const classId = `${issuerId}.perkback_loyalty`;
  
  // Check if class exists
  const checkRes = await fetch(`${GOOGLE_WALLET_API}/loyaltyClass/${classId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (checkRes.status === 200) return classId;

  // Create class
  const loyaltyClass = {
    id: classId,
    issuerName: "PerkBack",
    programName: `${merchantName} Loyalty`,
    programLogo: {
      sourceUri: { uri: "https://perk-back-landing.lovable.app/lovable-uploads/perkback-logo.webp" },
      contentDescription: { defaultValue: { language: "en-AU", value: "PerkBack Logo" } },
    },
    reviewStatus: "UNDER_REVIEW",
    countryCode: "AU",
    accountNameLabel: "Member Name",
    accountIdLabel: "Card Number",
    hexBackgroundColor: "#0A2472",
  };

  const createRes = await fetch(`${GOOGLE_WALLET_API}/loyaltyClass`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(loyaltyClass),
  });

  if (!createRes.ok && createRes.status !== 409) {
    const err = await createRes.text();
    throw new Error(`Failed to create loyalty class: ${err}`);
  }

  return classId;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get("GOOGLE_WALLET_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      return new Response(JSON.stringify({ error: "Google Wallet not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get customer data
    const { data: customer, error: custError } = await supabase
      .from("customers")
      .select("id, full_name, loyalty_card_number, points_balance, crn")
      .eq("user_id", user.id)
      .single();

    if (custError || !customer) {
      return new Response(JSON.stringify({ error: "Customer not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceAccount: ServiceAccountKey = JSON.parse(serviceAccountJson);
    const accessToken = await getAccessToken(serviceAccount);

    // Get issuer ID from service account project
    const issuerId = Deno.env.get("GOOGLE_WALLET_ISSUER_ID") || ISSUER_ID;
    const classId = await createLoyaltyClass(accessToken, issuerId, "PerkBack");

    // Create loyalty object
    const objectId = `${issuerId}.${customer.id.replace(/-/g, "")}`;
    const loyaltyObject = {
      id: objectId,
      classId,
      state: "ACTIVE",
      accountId: customer.loyalty_card_number,
      accountName: customer.full_name || "PerkBack Member",
      loyaltyPoints: {
        label: "Points",
        balance: { int: customer.points_balance },
      },
      barcode: {
        type: "CODE_128",
        value: customer.loyalty_card_number,
        alternateText: customer.loyalty_card_number,
      },
    };

    // Try to create or update the object
    const checkObj = await fetch(`${GOOGLE_WALLET_API}/loyaltyObject/${objectId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (checkObj.status === 200) {
      // Update existing
      await fetch(`${GOOGLE_WALLET_API}/loyaltyObject/${objectId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(loyaltyObject),
      });
    } else {
      // Create new
      const createRes = await fetch(`${GOOGLE_WALLET_API}/loyaltyObject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(loyaltyObject),
      });
      if (!createRes.ok && createRes.status !== 409) {
        const err = await createRes.text();
        throw new Error(`Failed to create loyalty object: ${err}`);
      }
    }

    // Generate save JWT
    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const jwtPayload = btoa(JSON.stringify({
      iss: serviceAccount.client_email,
      aud: "google",
      typ: "savetowallet",
      iat: now,
      origins: ["https://perk-back-landing.lovable.app"],
      payload: { loyaltyObjects: [{ id: objectId }] },
    })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const pemContent = serviceAccount.private_key
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\n/g, "");
    const binaryKey = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(`${jwtHeader}.${jwtPayload}`));
    const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const saveJwt = `${jwtHeader}.${jwtPayload}.${sigBase64}`;
    const saveUrl = `https://pay.google.com/gp/v/save/${saveJwt}`;

    // Track wallet pass
    await supabase.from("wallet_passes").upsert({
      customer_id: customer.id,
      wallet_type: "google",
      pass_id: objectId,
    }, { onConflict: "customer_id,wallet_type" });

    return new Response(JSON.stringify({ saveUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Google Wallet error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
