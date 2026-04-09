"use client";

import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Play,
  Square,
  Link,
  Settings,
  RefreshCw,
  Filter,
} from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  created_at: string;
}

interface ActivityLogsListProps {
  activities: ActivityLog[];
  totalCount: number;
}

const actionConfig: Record<
  string,
  { icon: typeof Activity; color: string; bgColor: string }
> = {
  block_accepted: {
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  block_rejected: {
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  bot_started: {
    icon: Play,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  bot_stopped: {
    icon: Square,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  account_linked: {
    icon: Link,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  account_unlinked: {
    icon: Link,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  config_updated: {
    icon: Settings,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  token_refreshed: {
    icon: RefreshCw,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  error: {
    icon: AlertCircle,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  default: {
    icon: Info,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

const ACTION_FILTERS = [
  { value: "all", label: "All Activity" },
  { value: "block_accepted", label: "Blocks Accepted" },
  { value: "block_rejected", label: "Blocks Rejected" },
  { value: "bot_started", label: "Bot Started" },
  { value: "bot_stopped", label: "Bot Stopped" },
  { value: "error", label: "Errors" },
];

export function ActivityLogsList({ activities, totalCount }: ActivityLogsListProps) {
  const [filter, setFilter] = useState("all");

  const filteredActivities =
    filter === "all"
      ? activities
      : activities.filter((a) => a.action === filter);

  const formatActionName = (action: string) => {
    return action
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        {ACTION_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Showing {filteredActivities.length} of {totalCount} events
        </p>
      </div>

      {/* Activity List */}
      <div className="rounded-xl border border-border bg-card">
        {filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {filter === "all"
                ? "No activity yet. Start your bot to see events here."
                : "No events matching this filter."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredActivities.map((activity) => {
              const config = actionConfig[activity.action] ?? actionConfig.default;
              const Icon = config.icon;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 px-6 py-4"
                >
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {formatActionName(activity.action)}
                    </p>
                    {activity.details && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {activity.details}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
