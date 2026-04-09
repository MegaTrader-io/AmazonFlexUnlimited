import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = await request.json();

    // Check if config exists
    const { data: existingConfig } = await supabase
      .from("bot_configs")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingConfig) {
      // Update existing config
      const { error } = await supabase
        .from("bot_configs")
        .update({
          min_block_rate: config.min_block_rate,
          min_pay_per_hour: config.min_pay_per_hour,
          arrival_buffer: config.arrival_buffer,
          desired_start_time: config.desired_start_time,
          desired_end_time: config.desired_end_time,
          desired_weekdays: config.desired_weekdays,
          desired_warehouses: config.desired_warehouses,
          retry_limit: config.retry_limit,
          refresh_interval: config.refresh_interval,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingConfig.id);

      if (error) throw error;
    } else {
      // Create new config
      const { error } = await supabase.from("bot_configs").insert({
        user_id: user.id,
        min_block_rate: config.min_block_rate,
        min_pay_per_hour: config.min_pay_per_hour,
        arrival_buffer: config.arrival_buffer,
        desired_start_time: config.desired_start_time,
        desired_end_time: config.desired_end_time,
        desired_weekdays: config.desired_weekdays,
        desired_warehouses: config.desired_warehouses,
        retry_limit: config.retry_limit,
        refresh_interval: config.refresh_interval,
      });

      if (error) throw error;
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action: "config_updated",
      details: "Bot configuration updated",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving config:", error);
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: config, error } = await supabase
    .from("bot_configs")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config });
}
