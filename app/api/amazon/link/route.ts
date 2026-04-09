import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Constants matching the Python bot
const APP_NAME = "com.amazon.rabbit";
const APP_VERSION = "303338310";
const DEVICE_NAME = "Le X522";
const MANUFACTURER = "LeMobile";
const OS_VERSION = "LeEco/Le2_NA/le_s2_na:6.0.1/IFXNAOP5801910272S/61:user/release-keys";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { redirectUrl, email } = await request.json();

    if (!redirectUrl || !email) {
      return NextResponse.json(
        { error: "Redirect URL and email are required" },
        { status: 400 }
      );
    }

    // Parse the access token from the redirect URL
    const url = new URL(redirectUrl);
    const accessTokenParam = url.searchParams.get("openid.oa2.access_token");

    if (!accessTokenParam) {
      return NextResponse.json(
        { error: "Invalid redirect URL. Make sure it contains the access token." },
        { status: 400 }
      );
    }

    const regAccessToken = decodeURIComponent(accessTokenParam);

    // Generate device ID
    const deviceId = generateHex(16);

    // Build registration data (matching Python bot structure)
    const amazonRegData = {
      auth_data: {
        access_token: regAccessToken,
      },
      cookies: {
        domain: ".amazon.com",
        website_cookies: [],
      },
      device_metadata: {
        android_id: "52aee8aecab31ee3",
        device_os_family: "android",
        device_serial: deviceId,
        device_type: "A1MPSLFC7L5AFK",
        mac_address: generateHex(64).toUpperCase(),
        manufacturer: MANUFACTURER,
        model: DEVICE_NAME,
        os_version: "30",
        product: DEVICE_NAME,
      },
      registration_data: {
        app_name: APP_NAME,
        app_version: APP_VERSION,
        device_model: DEVICE_NAME,
        device_serial: deviceId,
        device_type: "A1MPSLFC7L5AFK",
        domain: "Device",
        os_version: OS_VERSION,
        software_version: "130050002",
      },
      requested_extensions: ["device_info", "customer_info"],
      requested_token_type: [
        "bearer",
        "mac_dms",
        "store_authentication_cookie",
        "website_cookies",
      ],
      user_context_map: {
        frc: await generateFrc(deviceId),
      },
    };

    // Register with Amazon API
    const regResponse = await fetch("https://api.amazon.com/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Charset": "utf-8",
        "x-amzn-identity-auth-domain": "api.amazon.com",
        Connection: "keep-alive",
        Accept: "*/*",
        "Accept-Language": "en-US",
      },
      body: JSON.stringify(amazonRegData),
    });

    if (!regResponse.ok) {
      const errorText = await regResponse.text();
      console.error("Amazon registration failed:", errorText);
      return NextResponse.json(
        { error: "Failed to register with Amazon. Please try again." },
        { status: 400 }
      );
    }

    const regData = await regResponse.json();
    const tokens = regData.response?.success?.tokens?.bearer;

    if (!tokens?.access_token || !tokens?.refresh_token) {
      return NextResponse.json(
        { error: "Failed to obtain tokens from Amazon" },
        { status: 400 }
      );
    }

    // Check if user already has an account linked
    const { data: existingAccount } = await supabase
      .from("amazon_accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingAccount) {
      // Update existing account
      const { error: updateError } = await supabase
        .from("amazon_accounts")
        .update({
          amazon_email: email,
          refresh_token: tokens.refresh_token,
          access_token: tokens.access_token,
          device_id: deviceId,
          status: "active",
          last_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAccount.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Create new account link
      const { error: insertError } = await supabase
        .from("amazon_accounts")
        .insert({
          user_id: user.id,
          amazon_email: email,
          refresh_token: tokens.refresh_token,
          access_token: tokens.access_token,
          device_id: deviceId,
          status: "active",
          last_verified_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      event_type: "info",
      message: `Amazon account ${email} linked successfully`,
      metadata: { amazon_email: email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error linking Amazon account:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Helper functions
function generateHex(length: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length * 2; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function generateFrc(deviceId: string): Promise<string> {
  // Simplified FRC generation - in production, implement full encryption
  // matching the Python version with PBKDF2 + AES
  const cookies = JSON.stringify({
    ApplicationName: APP_NAME,
    ApplicationVersion: APP_VERSION,
    DeviceLanguage: "en",
    DeviceName: DEVICE_NAME,
    DeviceOSVersion: OS_VERSION,
    IpAddress: "0.0.0.0", // Will be replaced by Amazon
    ScreenHeightPixels: "1920",
    ScreenWidthPixels: "1280",
    TimeZone: "00:00",
  });

  // For now, return a base64 encoded version
  // TODO: Implement proper encryption matching Python version
  const encoder = new TextEncoder();
  const data = encoder.encode(cookies);
  const base64 = btoa(String.fromCharCode(...data));
  return base64;
}
