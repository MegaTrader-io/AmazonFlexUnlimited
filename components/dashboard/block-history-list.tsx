"use client";

import { Package, MapPin, Clock, DollarSign } from "lucide-react";

interface Block {
  id: string;
  offer_id: string;
  warehouse_name: string | null;
  start_time: string;
  end_time: string;
  block_rate: number;
  accepted_at: string;
}

interface BlockHistoryListProps {
  blocks: Block[];
}

export function BlockHistoryList({ blocks }: BlockHistoryListProps) {
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return `${hours.toFixed(1)}h`;
  };

  if (blocks.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No blocks accepted yet. Start your bot to begin accepting blocks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="divide-y divide-border">
        {blocks.map((block) => (
          <div
            key={block.id}
            className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-success/10">
                <Package className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {formatDate(block.start_time)}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(block.start_time)} - {formatTime(block.end_time)}
                  </span>
                  {block.warehouse_name && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {block.warehouse_name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 sm:text-right">
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium text-foreground">
                  {getDuration(block.start_time, block.end_time)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pay</p>
                <p className="flex items-center gap-1 font-bold text-success">
                  <DollarSign className="h-4 w-4" />
                  {block.block_rate.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
