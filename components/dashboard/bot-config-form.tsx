"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Info, DollarSign, Clock, MapPin, Calendar } from "lucide-react";

interface BotConfig {
  min_block_rate: number;
  min_pay_per_hour: number;
  arrival_buffer: number;
  desired_start_time: string;
  desired_end_time: string;
  desired_weekdays: string[];
  desired_warehouses: string[];
  retry_limit: number;
  refresh_interval: number;
}

interface BotConfigFormProps {
  initialConfig: BotConfig;
  hasExistingConfig: boolean;
}

const WEEKDAYS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

export function BotConfigForm({ initialConfig, hasExistingConfig }: BotConfigFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<BotConfig>(initialConfig);

  const handleWeekdayToggle = (day: string) => {
    setConfig((prev) => ({
      ...prev,
      desired_weekdays: prev.desired_weekdays.includes(day)
        ? prev.desired_weekdays.filter((d) => d !== day)
        : [...prev.desired_weekdays, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch("/api/bot/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to save config:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pay Rate Settings */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
            <DollarSign className="h-5 w-5 text-success" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Pay Rate Filters</h2>
            <p className="text-sm text-muted-foreground">
              Set minimum pay requirements for accepting blocks
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="minBlockRate" className="text-sm font-medium text-foreground">
              Minimum Block Rate ($)
            </label>
            <input
              id="minBlockRate"
              type="number"
              min="0"
              step="0.50"
              value={config.min_block_rate}
              onChange={(e) =>
                setConfig({ ...config, min_block_rate: parseFloat(e.target.value) || 0 })
              }
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground">
              Minimum total pay for a block
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="minPayPerHour" className="text-sm font-medium text-foreground">
              Minimum Pay Per Hour ($)
            </label>
            <input
              id="minPayPerHour"
              type="number"
              min="0"
              step="0.50"
              value={config.min_pay_per_hour}
              onChange={(e) =>
                setConfig({ ...config, min_pay_per_hour: parseFloat(e.target.value) || 0 })
              }
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground">
              Minimum hourly rate equivalent
            </p>
          </div>
        </div>
      </div>

      {/* Time Settings */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Time Preferences</h2>
            <p className="text-sm text-muted-foreground">
              Set your available time windows
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="startTime" className="text-sm font-medium text-foreground">
              Earliest Start Time
            </label>
            <input
              id="startTime"
              type="time"
              value={config.desired_start_time}
              onChange={(e) =>
                setConfig({ ...config, desired_start_time: e.target.value })
              }
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="endTime" className="text-sm font-medium text-foreground">
              Latest End Time
            </label>
            <input
              id="endTime"
              type="time"
              value={config.desired_end_time}
              onChange={(e) =>
                setConfig({ ...config, desired_end_time: e.target.value })
              }
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="arrivalBuffer" className="text-sm font-medium text-foreground">
              Arrival Buffer (minutes)
            </label>
            <input
              id="arrivalBuffer"
              type="number"
              min="0"
              value={config.arrival_buffer}
              onChange={(e) =>
                setConfig({ ...config, arrival_buffer: parseInt(e.target.value) || 0 })
              }
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground">
              Minimum time needed to arrive at warehouse
            </p>
          </div>
        </div>
      </div>

      {/* Weekday Settings */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
            <Calendar className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Available Days</h2>
            <p className="text-sm text-muted-foreground">
              Select which days you want to work
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => handleWeekdayToggle(day.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  config.desired_weekdays.includes(day.value)
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Leave all selected to accept blocks any day of the week
          </p>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Info className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Advanced Settings</h2>
            <p className="text-sm text-muted-foreground">
              Fine-tune bot behavior
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="refreshInterval" className="text-sm font-medium text-foreground">
              Refresh Interval (seconds)
            </label>
            <input
              id="refreshInterval"
              type="number"
              min="5"
              max="60"
              value={config.refresh_interval}
              onChange={(e) =>
                setConfig({ ...config, refresh_interval: parseInt(e.target.value) || 10 })
              }
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground">
              How often to check for new offers (5-60 seconds)
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="retryLimit" className="text-sm font-medium text-foreground">
              Retry Limit
            </label>
            <input
              id="retryLimit"
              type="number"
              min="0"
              value={config.retry_limit}
              onChange={(e) =>
                setConfig({ ...config, retry_limit: parseInt(e.target.value) || 0 })
              }
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground">
              0 = unlimited retries
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        {success && (
          <p className="text-sm font-medium text-success">
            Settings saved successfully!
          </p>
        )}
        {!success && (
          <p className="text-sm text-muted-foreground">
            {hasExistingConfig
              ? "Changes will apply on next bot start"
              : "Save to create your bot configuration"}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Settings
        </button>
      </div>
    </form>
  );
}
