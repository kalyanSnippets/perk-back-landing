const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

// Apple .pkpass is a ZIP file containing pass.json, manifest.json, signature, and optional images.
// We build it manually using Deno's crypto APIs.

interface PassData {
  customerName: string;
  cardNumber: string;
  crn: string;
  pointsBalance: number;
}

function buildPassJson(data: PassData): string {
  const passTypeId = Deno.env.get("APPLE_PASS_TYPE_ID") || "pass.com.perkback.loyalty";
  const teamId = Deno.env.get("APPLE_TEAM_ID") || "";

  const pass = {
    formatVersion: 1,
    passTypeIdentifier: passTypeId,
    serialNumber: data.cardNumber,
    teamIdentifier: teamId,
    organizationName: "PerkBack",
    description: "PerkBack Loyalty Card",
    logoText: "PerkBack",
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: "rgb(10, 36, 114)",
    labelColor: "rgb(200, 210, 255)",
    barcode: {
      message: data.cardNumber,
      format: "PKBarcodeFormatCode128",
      messageEncoding: "iso-8859-1",
      altText: data.cardNumber,
    },
    barcodes: [
      {
        message: data.cardNumber,
        format: "PKBarcodeFormatCode128",
        messageEncoding: "iso-8859-1",
        altText: data.cardNumber,
      },
      {
        message: data.cardNumber,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
      },
    ],
    storeCard: {
      headerFields: [
        { key: "points", label: "POINTS", value: data.pointsBalance, textAlignment: "PKTextAlignmentRight" },
      ],
      primaryFields: [
        { key: "name", label: "MEMBER", value: data.customerName },
      ],
      secondaryFields: [
        { key: "card", label: "CARD NUMBER", value: data.cardNumber },
      ],
      auxiliaryFields: [
        { key: "crn", label: "CRN", value: data.crn },
      ],
    },
  };

  return JSON.stringify(pass);
}

// Minimal ZIP builder for .pkpass
function createZip(files: Map<string, Uint8Array>): Uint8Array {
  const entries: { name: Uint8Array; data: Uint8Array; offset: number }[] = [];
  const parts: Uint8Array[] = [];
  let offset = 0;

  for (const [name, data] of files) {
    const nameBytes = new TextEncoder().encode(name);
    // CRC32 calculation
    const crc = crc32(data);

    // Local file header
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); // signature
    view.setUint16(4, 20, true); // version needed
    view.setUint16(6, 0, true); // flags
    view.setUint16(8, 0, true); // compression (store)
    view.setUint16(10, 0, true); // mod time
    view.setUint16(12, 0, true); // mod date
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true); // compressed size
    view.setUint32(22, data.length, true); // uncompressed size
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true); // extra length
    header.set(nameBytes, 30);

    entries.push({ name: nameBytes, data, offset });
    parts.push(header, data);
    offset += header.length + data.length;
  }

  // Central directory
  const cdParts: Uint8Array[] = [];
  const cdStart = offset;

  for (const entry of entries) {
    const crc = crc32(entry.data);
    const cd = new Uint8Array(46 + entry.name.length);
    const view = new DataView(cd.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint16(14, 0, true);
    view.setUint32(16, crc, true);
    view.setUint32(20, entry.data.length, true);
    view.setUint32(24, entry.data.length, true);
    view.setUint16(28, entry.name.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, entry.offset, true);
    cd.set(entry.name, 46);
    cdParts.push(cd);
  }

  const cdData = concatUint8Arrays(cdParts);
  const cdSize = cdData.length;

  // End of central directory
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, entries.length, true);
  eocdView.setUint16(10, entries.length, true);
  eocdView.setUint32(12, cdSize, true);
  eocdView.setUint32(16, cdStart, true);
  eocdView.setUint16(20, 0, true);

  return concatUint8Arrays([...parts, cdData, eocd]);
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
}

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

async function sha1Hex(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const appleCert = Deno.env.get("APPLE_PASS_CERT");
    const appleKey = Deno.env.get("APPLE_PASS_KEY");
    const appleWwdr = Deno.env.get("APPLE_WWDR_CERT");

    if (!appleCert || !appleKey || !appleWwdr) {
      return new Response(JSON.stringify({ error: "Apple Wallet not configured" }), {
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

    // Build pass.json
    const passJson = buildPassJson({
      customerName: customer.full_name || "PerkBack Member",
      cardNumber: customer.loyalty_card_number || "",
      crn: customer.crn || "",
      pointsBalance: customer.points_balance,
    });

    const passJsonBytes = new TextEncoder().encode(passJson);

    // Build manifest.json (SHA-1 hashes of all files)
    const manifest: Record<string, string> = {
      "pass.json": await sha1Hex(passJsonBytes),
    };
    const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));

    // Note: In production, you would sign the manifest with the Apple certificate.
    // This requires PKCS#7/CMS signing which needs the actual certificate and key.
    // For now, we create the pass structure. Full signing requires the certificates to be configured.
    
    // Build the .pkpass ZIP
    const files = new Map<string, Uint8Array>();
    files.set("pass.json", passJsonBytes);
    files.set("manifest.json", manifestBytes);
    // signature file would go here with proper PKCS#7 signing

    const pkpassData = createZip(files);

    // Track wallet pass
    await supabase.from("wallet_passes").upsert({
      customer_id: customer.id,
      wallet_type: "apple",
      pass_id: customer.loyalty_card_number,
    }, { onConflict: "customer_id,wallet_type" });

    return new Response(pkpassData, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="perkback-loyalty.pkpass"`,
      },
    });
  } catch (error) {
    console.error("Apple Wallet error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
