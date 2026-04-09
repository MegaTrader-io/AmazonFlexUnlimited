import { createClient } from "@/lib/supabase/server";
import { BotConfigForm } from "@/components/dashboard/bot-config-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get existing config or use defaults
  const { data: botConfig } = await supabase
    .from("bot_configs")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  const defaultConfig = {
    min_block_rate: 50,
    min_pay_per_hour: 18,
    arrival_buffer: 60,
    desired_start_time: "00:00",
    desired_end_time: "23:59",
    desired_weekdays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    desired_warehouses: [],
    retry_limit: 0,
    refresh_interval: 10,
  };

  const config = botConfig || defaultConfig;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bot Settings</h1>
        <p className="text-muted-foreground">
          Configure block filters, pay rates, and scheduling preferences
        </p>
      </div>

      <BotConfigForm initialConfig={config} hasExistingConfig={!!botConfig} />
    </div>
  );
}
