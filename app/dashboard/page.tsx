import { createClient } from "@/lib/supabase/server";
import { BotStatusCard } from "@/components/dashboard/bot-status-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch amazon account status
  const { data: amazonAccount } = await supabase
    .from("amazon_accounts")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  // Fetch bot config
  const { data: botConfig } = await supabase
    .from("bot_configs")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  // Fetch current bot session
  const { data: botSession } = await supabase
    .from("bot_sessions")
    .select("*")
    .eq("user_id", user!.id)
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch accepted blocks count
  const { count: blocksCount } = await supabase
    .from("accepted_blocks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  // Fetch recent activity
  const { data: recentActivity } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const isAccountLinked = !!amazonAccount;
  const isBotRunning = botSession?.status === "running";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and control your Amazon Flex bot
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BotStatusCard
            isAccountLinked={isAccountLinked}
            isBotRunning={isBotRunning}
            botSession={botSession}
            botConfig={botConfig}
          />
        </div>
        <div>
          <QuickActions isAccountLinked={isAccountLinked} isBotRunning={isBotRunning} />
        </div>
      </div>

      <StatsCards
        blocksAccepted={blocksCount ?? 0}
        isAccountLinked={isAccountLinked}
        botSession={botSession}
      />

      <RecentActivity activities={recentActivity ?? []} />
    </div>
  );
}
