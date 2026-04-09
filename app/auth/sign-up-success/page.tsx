import Link from "next/link";
import { Mail, Zap } from "lucide-react";

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <Mail className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
          <p className="text-muted-foreground">
            We&apos;ve sent you a confirmation link. Please check your email and click the link to
            activate your account.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <Zap className="mt-0.5 h-5 w-5 text-primary" />
            <div className="text-left text-sm text-muted-foreground">
              <p className="font-medium text-foreground">What&apos;s next?</p>
              <p className="mt-1">
                After confirming your email, you&apos;ll be able to link your Amazon Flex account
                and start configuring your bot.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/auth/login"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
