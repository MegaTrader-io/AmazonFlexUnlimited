"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Play, Square, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface BotStatusCardProps {
  isAccountLinked: boolean;
  isBotRunning: boolean;
  botSession: {
    status: string;
    started_at: string;
    offers_checked: number;
    blocks_accepted: number;
  } | null;
  botConfig: {
    min_block_rate: number;
    min_pay_per_hour: number;
  } | null;
}

export function BotStatusCard({
  isAccountLinked,
  isBotRunning,
  botSession,
  botConfig,
}: BotStatusCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggleBot = async () => {
    setLoading(true);
    try {
      const endpoint = isBotRunning ? "/api/bot/stop" : "/api/bot/start";
      const response = await fetch(endpoint, { method: "POST" });
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to toggle bot:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAccountLinked) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/20">
            <AlertCircle className="h-6 w-6 text-warning" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              Account Not Linked
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Link your Amazon Flex account to start using the bot. This allows the
              bot to search and accept blocks on your behalf.
            </p>
            <button
              onClick={() => router.push("/dashboard/account")}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Link Amazon Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              isBotRunning ? "bg-success/20" : "bg-muted"
            }`}
          >
            {isBotRunning ? (
              <CheckCircle2 className="h-6 w-6 text-success" />
            ) : (
              <Square className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Bot Status: {isBotRunning ? "Running" : "Stopped"}
            </h2>
            {isBotRunning && botSession && (
              <p className="mt-1 text-sm text-muted-foreground">
                Started{" "}
                {new Date(botSession.started_at).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleToggleBot}
          disabled={loading}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isBotRunning
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-success text-success-foreground hover:bg-success/90"
          } disabled:opacity-50`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isBotRunning ? (
            <Square className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isBotRunning ? "Stop Bot" : "Start Bot"}
        </button>
      </div>

      {isBotRunning && botSession && (
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6">
          <div>
            <p className="text-sm text-muted-foreground">Offers Checked</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {botSession.offers_checked}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Blocks Accepted</p>
            <p className="mt-1 text-2xl font-bold text-success">
              {botSession.blocks_accepted}
            </p>
          </div>
        </div>
      )}

      {botConfig && (
        <div className="mt-4 rounded-lg bg-accent/50 p-3">
          <p className="text-xs text-muted-foreground">
            Current filters: Min ${botConfig.min_block_rate}/block, Min $
            {botConfig.min_pay_per_hour}/hr
          </p>
        </div>
      )}
    </div>
  );
}
