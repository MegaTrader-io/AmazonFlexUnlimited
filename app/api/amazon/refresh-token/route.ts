import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the user's Amazon account
  const { data: amazonAccount } = await supabase
    .from("amazon_accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!amazonAccount) {
    return NextResponse.json(
      { error: "No Amazon account linked" },
      { status: 400 }
    );
  }

  try {
    // Request new access token from Amazon
    const tokenResponse = await fetch("https://api.amazon.com/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: amazonAccount.refresh_token_encrypted, // In production, decrypt first
        client_id: "device:32663430323338643639356262653236326265346136356131376439616135392341314d50534c4643374c3541464b",
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: "Failed to refresh token. Please re-link your account." },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();

    // Update the stored tokens
    const { error: updateError } = await supabase
      .from("amazon_accounts")
      .update({
        access_token_encrypted: tokenData.access_token,
        last_token_refresh: new Date().toISOString(),
      })
      .eq("id", amazonAccount.id);

    if (updateError) {
      throw updateError;
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action: "token_refreshed",
      details: "Amazon access token refreshed successfully",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
