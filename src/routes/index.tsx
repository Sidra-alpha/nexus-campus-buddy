import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Network, ShieldCheck, Radar, Workflow, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEXUS — Autonomous Smart Campus Multi-Agent AI" },
      {
        name: "description",
        content:
          "NEXUS is a multi-agent campus AI: an orchestrator plans, specialist agents act, and every write action waits for your approval.",
      },
      { property: "og:title", content: "NEXUS — Autonomous Smart Campus Multi-Agent AI" },
      {
        property: "og:description",
        content:
          "Watch specialist AI agents plan, collaborate and act on campus tasks — with human approval built in.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(!!session),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <main className="grid-bg min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[11px] tracking-wider text-primary uppercase">
            <Network className="size-3.5" /> Multi-agent orchestration
          </div>
          <h1 className="mt-6 text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
            NEXUS runs your campus tasks
            <span className="text-primary"> with a team of agents.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Ask once. An Orchestrator writes a plan, delegates to the Academic, Placement,
            Knowledge and Communication agents, and shows every step live in a mission-control
            graph. Nothing irreversible happens without your explicit approval.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Feature icon={Workflow} title="Live agent graph" body="See collaboration as motion." />
            <Feature icon={ShieldCheck} title="Human in the loop" body="Approve every write." />
            <Feature icon={Radar} title="Sentinel alerts" body="Agents reach out first." />
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            {signedIn ? "Welcome back" : "Sign in to continue"}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {signedIn
              ? "Your private campus workspace is ready."
              : "Your campus profile, chats and approvals are private to your account. Sign in with email and password, or continue with Google."}
          </p>
          <Button
            className="mt-5 w-full"
            onClick={() => navigate({ to: signedIn ? "/workspace" : "/auth" })}
          >
            {signedIn ? (
              <>
                Open workspace <ArrowRight className="size-4" />
              </>
            ) : (
              <>
                <LogIn className="size-4" /> Sign in or create account
              </>
            )}
          </Button>
          {signedIn === false && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              New here? Creating an account also creates your campus profile.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Network;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <Icon className="size-4 text-primary" />
      <p className="mt-2 text-xs font-semibold">{title}</p>
      <p className="text-[11px] text-muted-foreground">{body}</p>
    </div>
  );
}
