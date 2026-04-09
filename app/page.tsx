import Link from "next/link";
import { Zap, Shield, Clock, TrendingUp } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">FlexBot Controller</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-24 text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Automate Your Amazon Flex
            <span className="text-primary"> Block Hunting</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            Stop refreshing manually. Let our bot find and accept the best blocks for you
            based on your filters, schedule, and pay preferences.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-accent"
            >
              Learn More
            </Link>
          </div>
        </section>

        <section id="features" className="border-t border-border bg-card/50 py-24">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold text-foreground">
              Everything You Need
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Powerful features to maximize your Amazon Flex earnings
            </p>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Clock,
                  title: "24/7 Block Hunting",
                  description:
                    "Our bot searches for blocks around the clock so you never miss an opportunity.",
                },
                {
                  icon: TrendingUp,
                  title: "Smart Filters",
                  description:
                    "Set minimum pay rates, preferred locations, and time slots to only get blocks you want.",
                },
                {
                  icon: Shield,
                  title: "Secure & Reliable",
                  description:
                    "Your credentials are encrypted and the bot runs on secure infrastructure.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Ready to Automate?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join drivers who are saving hours every week with automated block hunting.
            </p>
            <Link
              href="/auth/sign-up"
              className="mt-8 inline-block rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Your Account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FlexBot Controller. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
