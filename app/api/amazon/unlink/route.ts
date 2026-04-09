import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Stop any running bot sessions first
  await supabase
    .from("bot_sessions")
    .update({
      status: "stopped",
      stopped_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("status", "running");

  // Delete the amazon account link
  const { error } = await supabase
    .from("amazon_accounts")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "account_unlinked",
    details: "Amazon account unlinked",
  });

  return NextResponse.json({ success: true });
}
