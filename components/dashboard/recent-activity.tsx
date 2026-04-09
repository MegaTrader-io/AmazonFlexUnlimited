import { Activity, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import Link from "next/link";

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  created_at: string;
}

interface RecentActivityProps {
  activities: ActivityLog[];
}

const actionIcons: Record<string, { icon: typeof Activity; color: string }> = {
  block_accepted: { icon: CheckCircle2, color: "text-success" },
  block_rejected: { icon: XCircle, color: "text-destructive" },
  bot_started: { icon: Activity, color: "text-primary" },
  bot_stopped: { icon: Activity, color: "text-muted-foreground" },
  error: { icon: AlertCircle, color: "text-warning" },
  default: { icon: Info, color: "text-muted-foreground" },
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="font-semibold text-foreground">Recent Activity</h2>
        <Link
          href="/dashboard/activity"
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Activity className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No activity yet. Start your bot to see activity here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {activities.map((activity) => {
            const iconConfig = actionIcons[activity.action] ?? actionIcons.default;
            const Icon = iconConfig.icon;

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 px-6 py-4"
              >
                <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${iconConfig.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                  {activity.details && (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {activity.details}
                    </p>
                  )}
                </div>
                <time className="flex-shrink-0 text-xs text-muted-foreground">
                  {new Date(activity.created_at).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
