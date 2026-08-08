import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Network,
  ShieldCheck,
  Radar,
  Workflow,
  LogIn,
  GraduationCap,
  Briefcase,
  BookOpen,
  Mail,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/nexus-hero.jpg";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const ROTATING = [
  "checks your attendance.",
  "finds your placement drives.",
  "registers you for events.",
  "reads campus policy for you.",
  "reminds you before it matters.",
];

const ORBIT_AGENTS = [
  { icon: GraduationCap, label: "Academic", hue: "var(--agent-academic)", d: "22s", r: "128px" },
  { icon: Briefcase, label: "Placement", hue: "var(--agent-placement)", d: "26s", r: "150px" },
  { icon: BookOpen, label: "Knowledge", hue: "var(--agent-knowledge)", d: "19s", r: "104px" },
  { icon: Mail, label: "Comms", hue: "var(--agent-communication)", d: "30s", r: "168px" },
  { icon: Radar, label: "Sentinel", hue: "var(--agent-sentinel)", d: "24s", r: "138px" },
];

const TICKER = [
  "Orchestrator → plan created",
  "Academic Agent → attendance 68% in DBMS",
  "Placement Agent → 3 eligible drives found",
  "Knowledge Agent → policy 4.2 retrieved",
  "Approval required → register for workshop",
  "Communication Agent → reminder scheduled",
];

function Landing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(!!session),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setWordIndex((i) => (i + 1) % ROTATING.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="grid-bg grid-bg-live min-h-dvh overflow-hidden lg:h-dvh">
      <div className="mx-auto grid h-full max-w-6xl content-center gap-6 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-8 lg:py-6">
        <section className="reveal">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[11px] tracking-wider text-primary uppercase">
            <Network className="size-3.5 animate-pulse" /> Multi-agent orchestration
          </div>
          <h1 className="mt-4 text-3xl leading-[1.08] font-semibold tracking-tight sm:text-4xl xl:text-5xl">
            NEXUS runs your campus tasks
            <span className="shimmer-text"> with a team of agents.</span>
          </h1>

          <div className="mt-3 h-7 overflow-hidden text-base font-medium text-primary">
            <span key={wordIndex} className="msg-rise inline-block">
              While you study, NEXUS {ROTATING[wordIndex]}
            </span>
          </div>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Ask once. An Orchestrator writes a plan, delegates to the Academic, Placement,
            Knowledge and Communication agents, and shows every step live in a mission-control
            graph. Nothing irreversible happens without your explicit approval.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Feature icon={Workflow} title="Live agent graph" body="See collaboration as motion." />
            <Feature icon={ShieldCheck} title="Human in the loop" body="Approve every write." />
            <Feature icon={Radar} title="Sentinel alerts" body="Agents reach out first." />
          </div>

          <div className="mt-5 overflow-hidden rounded-full border border-border bg-surface py-1.5">
            <div className="marquee-track gap-8 px-4 text-[11px] text-muted-foreground">
              {[...TICKER, ...TICKER].map((t, i) => (
                <span key={i} className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="reveal flex flex-col gap-4">
          <div className="panel relative aspect-square max-h-[42dvh] min-h-[220px] overflow-hidden lg:mx-auto lg:aspect-auto lg:h-[42dvh] lg:w-full">
            <img
              src={heroImage}
              alt="Glowing network of connected AI agent nodes over a campus data grid"
              width={1280}
              height={1280}
              className="float-slower absolute inset-0 size-full scale-110 object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,var(--background)_95%)]" />

            <div className="absolute inset-0 grid place-items-center">
              <div className="relative grid size-0 place-items-center">
                <div className="float-slow absolute grid size-16 place-items-center rounded-2xl border border-primary/50 bg-surface text-primary shadow-[var(--glow-primary)]">
                  <Bot className="size-7" />
                </div>
                {ORBIT_AGENTS.map(({ icon: Icon, label, hue, d, r }) => (
                  <div
                    key={label}
                    className="orbit absolute"
                    style={
                      { "--orbit-d": d, "--orbit-r": r } as React.CSSProperties
                    }
                  >
                    <div
                      className="flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold backdrop-blur"
                      style={{
                        borderColor: `color-mix(in oklab, ${hue} 50%, transparent)`,
                        background: `color-mix(in oklab, ${hue} 14%, var(--surface))`,
                        color: hue,
                      }}
                    >
                      <Icon className="size-3" />
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel p-4">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {signedIn ? "Welcome back" : "Sign in to continue"}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {signedIn
                ? "Your private campus workspace is ready."
                : "Your campus profile, chats and approvals are private to your account. Sign in with email and password, or continue with Google."}
            </p>
            <Button
              className="mt-3 w-full transition-transform hover:scale-[1.02]"
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
          </div>
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
    <div className="rounded-xl border border-border bg-surface p-3 transition-all hover:-translate-y-1 hover:border-primary">
      <Icon className="size-4 text-primary" />
      <p className="mt-2 text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
