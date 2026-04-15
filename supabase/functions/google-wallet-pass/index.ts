const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const GOOGLE_WALLET_API = "https://walletobjects.googleapis.com/walletobjects/v1";

const HERO_IMAGE_URL = "https://bhczknuriaxvgmvbtzzo.supabase.co/storage/v1/object/public/email-assets/wallet-hero-banner.jpg";
const LOGO_URL = "https://bhczknuriaxvgmvbtzzo.supabase.co/storage/v1/object/public/email-assets/perkback-logo.png";
const APP_URL = "https://perk-back-landing.lovable.app";

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri: string;
}

function jsonResponse(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function signJwt(serviceAccount: ServiceAccountKey, payload: Record<string, unknown>): Promise<string> {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const pemContent = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"]
  );

  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5", cryptoKey,
    new TextEncoder().encode(`${header}.${body}`)
  );
  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${header}.${body}.${sigBase64}`;
}

async function getAccessToken(serviceAccount: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const jwt = await signJwt(serviceAccount, {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600,
  });

  const tokenRes = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}

async function ensureLoyaltyClass(accessToken: string, issuerId: string) {
  const classId = `${issuerId}.perkback_loyalty`;

  const checkRes = await fetch(`${GOOGLE_WALLET_API}/loyaltyClass/${classId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (checkRes.status === 200) {
    await checkRes.text();
    return classId;
  }
  await checkRes.text();

  const loyaltyClass = {
    id: classId,
    issuerName: "PerkBack",
    programName: "PerkBack Loyalty",
    programLogo: {
      sourceUri: { uri: LOGO_URL },
      contentDescription: { defaultValue: { language: "en-AU", value: "PerkBack Logo" } },
    },
    heroImage: {
      sourceUri: { uri: HERO_IMAGE_URL },
      contentDescription: { defaultValue: { language: "en-AU", value: "PerkBack — Earn. Collect. Reward." } },
    },
    reviewStatus: "UNDER_REVIEW",
    countryCode: "AU",
    accountNameLabel: "Member Name",
    accountIdLabel: "Card Number",
    hexBackgroundColor: "#0A2472",
    linksModuleData: {
      uris: [
        { uri: APP_URL, description: "Open PerkBack App", id: "app_link" },
        { uri: `${APP_URL}/about-us`, description: "About PerkBack", id: "about_link" },
      ],
    },
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
  await createRes.text();

  return classId;
}

function buildLoyaltyObject(
  objectId: string,
  classId: string,
  customer: { full_name: string | null; loyalty_card_number: string | null; points_balance: number; crn: string | null; created_at: string }
) {
  const memberSince = new Date(customer.created_at).toLocaleDateString("en-AU", {
    month: "short",
    year: "numeric",
  });

  return {
    id: objectId,
    classId,
    state: "ACTIVE",
    accountId: customer.loyalty_card_number || "",
    accountName: customer.full_name || "PerkBack Member",
    loyaltyPoints: {
      label: "Points",
      balance: { int: customer.points_balance },
    },
    barcode: {
      type: "CODE_128",
      value: customer.loyalty_card_number || "",
      alternateText: customer.loyalty_card_number || "",
    },
    textModulesData: [
      { header: "CRN", body: customer.crn || "—", id: "crn" },
      { header: "Member Since", body: memberSince, id: "member_since" },
    ],
    linksModuleData: {
      uris: [
        { uri: APP_URL, description: "View My Card", id: "my_card" },
      ],
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get("GOOGLE_WALLET_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      return jsonResponse({ ok: false, error: "Google Wallet not configured" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ ok: false, error: "Unauthorized — no token provided" });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return jsonResponse({ ok: false, error: "Unauthorized — invalid token" });
    }

    const { data: customer, error: custError } = await supabase
      .from("customers")
      .select("id, full_name, loyalty_card_number, points_balance, crn, created_at")
      .eq("user_id", user.id)
      .single();

    if (custError || !customer) {
      return jsonResponse({ ok: false, error: "Customer not found" });
    }

    let parsedJson: ServiceAccountKey;
    try {
      parsedJson = JSON.parse(serviceAccountJson);
    } catch {
      return jsonResponse({ ok: false, error: "Invalid service account JSON" });
    }

    if (!parsedJson.private_key) {
      return jsonResponse({ ok: false, error: "Service account missing private_key" });
    }

    const accessToken = await getAccessToken(parsedJson);
    const issuerId = Deno.env.get("GOOGLE_WALLET_ISSUER_ID") || "perkback";
    const classId = await ensureLoyaltyClass(accessToken, issuerId);

    const objectId = `${issuerId}.${customer.id.replace(/-/g, "")}`;
    const loyaltyObject = buildLoyaltyObject(objectId, classId, customer);

    // Create or update the object
    const checkObj = await fetch(`${GOOGLE_WALLET_API}/loyaltyObject/${objectId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (checkObj.status === 200) {
      await checkObj.text();
      const patchRes = await fetch(`${GOOGLE_WALLET_API}/loyaltyObject/${objectId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(loyaltyObject),
      });
      await patchRes.text();
    } else {
      await checkObj.text();
      const createRes = await fetch(`${GOOGLE_WALLET_API}/loyaltyObject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(loyaltyObject),
      });
      if (!createRes.ok && createRes.status !== 409) {
        const err = await createRes.text();
        throw new Error(`Failed to create loyalty object: ${err}`);
      }
      await createRes.text();
    }

    // Generate save JWT
    const now = Math.floor(Date.now() / 1000);
    const saveJwt = await signJwt(parsedJson, {
      iss: parsedJson.client_email,
      aud: "google",
      typ: "savetowallet",
      iat: now,
      origins: [APP_URL],
      payload: { loyaltyObjects: [{ id: objectId }] },
    });

    const saveUrl = `https://pay.google.com/gp/v/save/${saveJwt}`;

    // Track wallet pass
    await supabase.from("wallet_passes").upsert({
      customer_id: customer.id,
      wallet_type: "google",
      pass_id: objectId,
    }, { onConflict: "customer_id,wallet_type" });

    return jsonResponse({ ok: true, saveUrl });
  } catch (error) {
    console.error("Google Wallet error:", error);
    return jsonResponse({ ok: false, error: error.message || "Internal error" });
  }
});
