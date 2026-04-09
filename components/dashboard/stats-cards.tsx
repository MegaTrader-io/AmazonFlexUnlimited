import { Package, Clock, DollarSign, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  blocksAccepted: number;
  isAccountLinked: boolean;
  botSession: {
    offers_checked: number;
    blocks_accepted: number;
  } | null;
}

export function StatsCards({
  blocksAccepted,
  isAccountLinked,
  botSession,
}: StatsCardsProps) {
  const stats = [
    {
      name: "Total Blocks Accepted",
      value: blocksAccepted,
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      name: "Session Offers Checked",
      value: botSession?.offers_checked ?? 0,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      name: "Session Accepted",
      value: botSession?.blocks_accepted ?? 0,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      name: "Account Status",
      value: isAccountLinked ? "Linked" : "Not Linked",
      icon: DollarSign,
      color: isAccountLinked ? "text-success" : "text-muted-foreground",
      bgColor: isAccountLinked ? "bg-success/10" : "bg-muted",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}
            >
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.name}</p>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
