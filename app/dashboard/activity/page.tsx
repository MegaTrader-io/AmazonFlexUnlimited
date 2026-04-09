import { createClient } from "@/lib/supabase/server";
import { ActivityLogsList } from "@/components/dashboard/activity-logs-list";

export default async function ActivityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: activities, count } = await supabase
    .from("activity_logs")
    .select("*", { count: "exact" })
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
        <p className="text-muted-foreground">
          View all bot activity and system events
        </p>
      </div>

      <ActivityLogsList activities={activities ?? []} totalCount={count ?? 0} />
    </div>
  );
}
