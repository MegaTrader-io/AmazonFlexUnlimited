"use client";

import { useRouter } from "next/navigation";
import { Settings, Link as LinkIcon, RefreshCw } from "lucide-react";

interface QuickActionsProps {
  isAccountLinked: boolean;
  isBotRunning: boolean;
}

export function QuickActions({ isAccountLinked, isBotRunning }: QuickActionsProps) {
  const router = useRouter();

  const actions = [
    {
      name: isAccountLinked ? "Manage Account" : "Link Account",
      description: isAccountLinked
        ? "View or update your Amazon Flex credentials"
        : "Connect your Amazon Flex account",
      icon: LinkIcon,
      href: "/dashboard/account",
      primary: !isAccountLinked,
    },
    {
      name: "Bot Settings",
      description: "Configure filters, pay rates, and schedules",
      icon: Settings,
      href: "/dashboard/settings",
      primary: false,
    },
    {
      name: "Refresh Status",
      description: "Check for the latest bot status",
      icon: RefreshCw,
      onClick: () => router.refresh(),
      primary: false,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="font-semibold text-foreground">Quick Actions</h2>
      <div className="mt-4 space-y-3">
        {actions.map((action) => (
          <button
            key={action.name}
            onClick={action.onClick ?? (() => router.push(action.href!))}
            className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors ${
              action.primary
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-accent/50 hover:bg-accent"
            }`}
          >
            <action.icon
              className={`mt-0.5 h-5 w-5 ${
                action.primary ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            />
            <div>
              <p
                className={`text-sm font-medium ${
                  action.primary ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {action.name}
              </p>
              <p
                className={`mt-0.5 text-xs ${
                  action.primary
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground"
                }`}
              >
                {action.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
