"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Shield,
} from "lucide-react";

const AMAZON_OAUTH_LINK =
  "https://www.amazon.com/ap/signin?ie=UTF8&clientContext=134-9172090-0857541&openid.pape.max_auth_age=0&use_global_authentication=false&accountStatusPolicy=P1&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&use_audio_captcha=false&language=en_US&pageId=amzn_device_na&arb=97b4a0fe-13b8-45fd-b405-ae94b0fec45b&openid.return_to=https%3A%2F%2Fwww.amazon.com%2Fap%2Fmaplanding&openid.assoc_handle=amzn_device_na&openid.oa2.response_type=token&openid.mode=checkid_setup&openid.ns.pape=http%3A%2F%2Fspecs.openid.net%2Fextensions%2Fpape%2F1.0&openid.ns.oa2=http%3A%2F%2Fwww.amazon.com%2Fap%2Fext%2Foauth%2F2&openid.oa2.scope=device_auth_access&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&disableLoginPrepopulate=0&openid.oa2.client_id=device%3A32663430323338643639356262653236326265346136356131376439616135392341314d50534c4643374c3541464b&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0";

export function LinkAccountFlow() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(AMAZON_OAUTH_LINK);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/amazon/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redirectUrl, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to link account");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Secure Linking Process</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We use Amazon&apos;s official OAuth flow to securely link your account.
              Your password is never shared with us.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Step 1 */}
        <div
          className={`rounded-xl border bg-card p-6 ${
            step === 1 ? "border-primary" : "border-border"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                step === 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-success text-success-foreground"
              }`}
            >
              {step > 1 ? <Check className="h-4 w-4" /> : "1"}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                Sign in to Amazon Flex
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Click the button below to open Amazon&apos;s login page in a new tab.
                Sign in with your Amazon Flex account credentials.
              </p>

              {step === 1 && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={AMAZON_OAUTH_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Amazon Login
                    </a>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied ? "Copied!" : "Copy Link"}
                    </button>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    I&apos;ve signed in, continue to step 2
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div
          className={`rounded-xl border bg-card p-6 ${
            step === 2 ? "border-primary" : "border-border opacity-60"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                step === 2
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                Paste the Redirect URL
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                After signing in, you&apos;ll be redirected to a page that may show
                an error. Copy the entire URL from your browser&apos;s address bar
                and paste it below.
              </p>

              {step === 2 && (
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-foreground"
                    >
                      Amazon Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your-email@example.com"
                      required
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="redirectUrl"
                      className="text-sm font-medium text-foreground"
                    >
                      Redirect URL
                    </label>
                    <textarea
                      id="redirectUrl"
                      value={redirectUrl}
                      onChange={(e) => setRedirectUrl(e.target.value)}
                      placeholder="https://www.amazon.com/ap/maplanding?openid.oa2.access_token=..."
                      required
                      rows={3}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="text-xs text-muted-foreground">
                      The URL should contain &quot;openid.oa2.access_token&quot;
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !redirectUrl || !email}
                      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Link Account
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
