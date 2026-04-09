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

  // Find running session
  const { data: session } = await supabase
    .from("bot_sessions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "running")
    .single();

  if (!session) {
    return NextResponse.json(
      { error: "No running bot session found" },
      { status: 400 }
    );
  }

  // Update session status
  const { error } = await supabase
    .from("bot_sessions")
    .update({
      status: "stopped",
      stopped_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "bot_stopped",
    details: `Bot session ${session.id} stopped`,
  });

  // TODO: Stop the actual Python bot process

  return NextResponse.json({ success: true });
}
