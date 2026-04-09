import { createClient } from "@/lib/supabase/server";
import { BlockHistoryList } from "@/components/dashboard/block-history-list";

export default async function BlocksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: blocks, count } = await supabase
    .from("accepted_blocks")
    .select("*", { count: "exact" })
    .eq("user_id", user!.id)
    .order("accepted_at", { ascending: false })
    .limit(50);

  // Calculate stats
  const totalEarnings =
    blocks?.reduce((sum, block) => sum + (block.block_rate || 0), 0) ?? 0;
  const totalHours =
    blocks?.reduce((sum, block) => {
      if (block.start_time && block.end_time) {
        const start = new Date(block.start_time);
        const end = new Date(block.end_time);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }
      return sum;
    }, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Block History</h1>
        <p className="text-muted-foreground">
          View all blocks accepted by the bot
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Blocks</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{count ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Earnings</p>
          <p className="mt-1 text-2xl font-bold text-success">
            ${totalEarnings.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Hours</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {totalHours.toFixed(1)}h
          </p>
        </div>
      </div>

      <BlockHistoryList blocks={blocks ?? []} />
    </div>
  );
}
