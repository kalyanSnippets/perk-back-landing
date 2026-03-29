import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const siteUrl = Deno.env.get("SITE_URL") || "https://perk-back-landing.lovable.app";
    const squareEnv = Deno.env.get("SQUARE_ENVIRONMENT") || "production";
    const squareBaseUrl = squareEnv === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";

    // Handle initiation: redirect merchant to Square OAuth
    if (url.searchParams.get("initiate") === "true") {
      const merchantId = url.searchParams.get("merchant_id");
      const squareAppId = Deno.env.get("SQUARE_APPLICATION_ID");
      if (!squareAppId || !merchantId) {
        return Response.redirect(
          `${siteUrl}/merchant/settings?pos_error=server_config`,
          302
        );
      }
      const redirectUri = url.searchParams.get("redirect_uri") || `${url.origin}/functions/v1/square-oauth-callback`;
      const squareUrl = `${squareBaseUrl}/oauth2/authorize?client_id=${squareAppId}&scope=PAYMENTS_READ+CUSTOMERS_READ+MERCHANT_PROFILE_READ&session=false&state=${merchantId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
      return Response.redirect(squareUrl, 302);
    }

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // merchant_id
    const error = url.searchParams.get("error");

    if (error) {
      return Response.redirect(
        `${siteUrl}/merchant/settings?pos_error=${encodeURIComponent(error)}`,
        302
      );
    }

    if (!code || !state) {
      return Response.redirect(
        `${siteUrl}/merchant/settings?pos_error=missing_params`,
        302
      );
    }

    const merchantId = state;
    const squareAppId = Deno.env.get("SQUARE_APPLICATION_ID");
    const squareAppSecret = Deno.env.get("SQUARE_APPLICATION_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!squareAppId || !squareAppSecret) {
      console.error("Square credentials not configured");
      return Response.redirect(
        `${siteUrl}/merchant/settings?pos_error=server_config`,
        302
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(
      `${squareBaseUrl}/oauth2/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: squareAppId,
          client_secret: squareAppSecret,
          code,
          grant_type: "authorization_code",
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return Response.redirect(
        `${siteUrl}/merchant/settings?pos_error=token_exchange_failed`,
        302
      );
    }

    // Fetch merchant location from Square
    let locationId: string | null = null;
    try {
      const locResponse = await fetch(
        "https://connect.squareup.com/v2/locations",
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const locData = await locResponse.json();
      if (locData.locations?.length > 0) {
        locationId = locData.locations[0].id;
      }
    } catch (e) {
      console.warn("Could not fetch Square locations:", e);
    }

    // Store tokens in pos_connections using service role
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error: upsertError } = await supabase
      .from("pos_connections")
      .upsert(
        {
          merchant_id: merchantId,
          provider: "square",
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          location_id: locationId,
          is_active: true,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "merchant_id,provider" }
      );

    if (upsertError) {
      console.error("Failed to store POS connection:", upsertError);
      return Response.redirect(
        `${siteUrl}/merchant/settings?pos_error=db_error`,
        302
      );
    }

    return Response.redirect(
      `${siteUrl}/merchant/settings?pos_connected=true`,
      302
    );
  } catch (err) {
    console.error("Square OAuth callback error:", err);
    const siteUrl = Deno.env.get("SITE_URL") || "https://perk-back-landing.lovable.app";
    return Response.redirect(
      `${siteUrl}/merchant/settings?pos_error=unexpected`,
      302
    );
  }
});
