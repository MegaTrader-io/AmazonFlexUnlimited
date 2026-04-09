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

  // Check if user has linked amazon account
  const { data: amazonAccount } = await supabase
    .from("amazon_accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!amazonAccount) {
    return NextResponse.json(
      { error: "Please link your Amazon account first" },
      { status: 400 }
    );
  }

  // Check if bot is already running
  const { data: existingSession } = await supabase
    .from("bot_sessions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "running")
    .single();

  if (existingSession) {
    return NextResponse.json(
      { error: "Bot is already running" },
      { status: 400 }
    );
  }

  // Create new bot session
  const { data: session, error } = await supabase
    .from("bot_sessions")
    .insert({
      user_id: user.id,
      status: "running",
      offers_checked: 0,
      blocks_accepted: 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "bot_started",
    details: `Bot session ${session.id} started`,
  });

  // TODO: Start the actual Python bot process via subprocess or queue

  return NextResponse.json({ success: true, session });
}
