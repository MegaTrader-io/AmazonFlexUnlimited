"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Trash2, RefreshCw, Loader2 } from "lucide-react";

interface AmazonAccount {
  id: string;
  amazon_email: string;
  created_at: string;
  last_token_refresh: string | null;
}

interface AmazonAccountCardProps {
  account: AmazonAccount;
}

export function AmazonAccountCard({ account }: AmazonAccountCardProps) {
  const router = useRouter();
  const [unlinking, setUnlinking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleUnlink = async () => {
    if (!confirm("Are you sure you want to unlink your Amazon account? This will stop all bot activity.")) {
      return;
    }

    setUnlinking(true);
    try {
      const response = await fetch("/api/amazon/unlink", { method: "DELETE" });
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to unlink account:", error);
    } finally {
      setUnlinking(false);
    }
  };

  const handleRefreshToken = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/amazon/refresh-token", { method: "POST" });
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to refresh token:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Amazon Account Linked
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {account.amazon_email}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRefreshToken}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh Token
          </button>
          <button
            onClick={handleUnlink}
            disabled={unlinking}
            className="flex items-center gap-2 rounded-lg border border-destructive/50 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            {unlinking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Unlink
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6">
        <div>
          <p className="text-sm text-muted-foreground">Linked On</p>
          <p className="mt-1 font-medium text-foreground">
            {new Date(account.created_at).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Last Token Refresh</p>
          <p className="mt-1 font-medium text-foreground">
            {account.last_token_refresh
              ? new Date(account.last_token_refresh).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })
              : "Never"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-accent/50 p-3">
        <p className="text-xs text-muted-foreground">
          Your Amazon credentials are encrypted and stored securely. We recommend
          refreshing your token periodically to ensure uninterrupted bot operation.
        </p>
      </div>
    </div>
  );
}
