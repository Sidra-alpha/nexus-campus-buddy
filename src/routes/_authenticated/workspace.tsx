import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  Bug,
  Languages,
  LogOut,
  Radar,
  Terminal,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentGraph } from "@/components/nexus/AgentGraph";
import { ChatPanel } from "@/components/nexus/ChatPanel";
import { ReasoningTrace, type TraceStep } from "@/components/nexus/ReasoningTrace";
import { ApprovalModal } from "@/components/nexus/ApprovalModal";
import { MemoryPanel } from "@/components/nexus/MemoryPanel";
import { DebugPanel } from "@/components/nexus/DebugPanel";
import {
  AGENT_META,
  LANGUAGES,
  type AgentKey,
  type AgentLog,
  type ChatMessage,
  type LanguageCode,
  type PendingApproval,
  type PlanStep,
  type Student,
} from "@/lib/nexus";
import {
  decideApproval,
  fetchSessionState,
  fetchWorkspace,
  runOrchestrator,
  triggerSentinel,
} from "@/lib/nexus.functions";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "NEXUS Workspace — Live Multi-Agent Campus Console" },
      {
        name: "description",
        content:
          "Chat, the live agent graph, the reasoning trace and approvals — the full NEXUS mission-control workspace.",
      },
      { property: "og:title", content: "NEXUS Workspace — Live Multi-Agent Campus Console" },
      {
        property: "og:description",
        content: "Watch NEXUS agents plan, collaborate and request approval in real time.",
      },
    ],
  }),
  component: Workspace,
});

type Course = {
  id: string;
  name: string;
  attendance_pct: number;
  timetable_slot: string;
  faculty: string;
};

function Workspace() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<{ title: string; date: string }[]>([]);
  const [facts, setFacts] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [running, setRunning] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [rightTab, setRightTab] = useState<"trace" | "debug">("trace");
  const [showMemory, setShowMemory] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("nexus_student_id");
    if (!id) {
      navigate({ to: "/" });
      return;
    }
    setStudentId(id);
  }, [navigate]);

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchWorkspace({ data: { studentId } });
        if (cancelled) return;
        if (!data.student) {
          navigate({ to: "/" });
          return;
        }
        setStudent(data.student as Student);
        setCourses(data.courses as Course[]);
        setEvents(data.events);
        setFacts(data.facts);
        setSessionId(data.sessionId);
        setMessages(data.messages as unknown as ChatMessage[]);
        setLogs(data.logs as unknown as AgentLog[]);
        setApprovals(data.approvals as unknown as PendingApproval[]);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Could not reach the campus database.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, navigate]);

  // Campus tables are server-only, so we poll a trusted server function
  // instead of subscribing to the database from the browser.
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let inFlight = false;

    const tick = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const state = await fetchSessionState({ data: { sessionId } });
        if (cancelled) return;
        const incoming = state.messages as unknown as ChatMessage[];
        setMessages((prev) => {
          const optimistic = prev.filter(
            (m) => m.id.startsWith("optimistic-") && !incoming.some((r) => r.content === m.content),
          );
          const next = [...incoming, ...optimistic];
          if (next.length === prev.length && next.every((m, i) => prev[i]?.id === m.id)) return prev;
          const fresh = incoming.filter((m) => !prev.some((p) => p.id === m.id));
          const proactive = fresh.find((m) => m.proactive);
          if (proactive) {
            toast("NEXUS noticed something", {
              description: proactive.content.replace(/\*\*/g, "").slice(0, 120),
            });
          }
          return next;
        });
        setLogs((prev) => {
          const next = state.logs as unknown as AgentLog[];
          return next.length === prev.length && next.every((l, i) => prev[i]?.id === l.id)
            ? prev
            : next;
        });
        setApprovals((prev) => {
          const next = state.approvals as unknown as PendingApproval[];
          return next.length === prev.length &&
            next.every((a, i) => prev[i]?.id === a.id && prev[i]?.status === a.status)
            ? prev
            : next;
        });
      } catch {
        // transient network issue; the next tick retries
      } finally {
        inFlight = false;
      }
    };

    const interval = setInterval(tick, 1500);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId]);


  const currentTurnId = useMemo(() => {
    for (let i = logs.length - 1; i >= 0; i--) {
      const t = logs[i]?.turn_id;
      if (t) return t;
    }
    return null;
  }, [logs]);

  const turnLogs = useMemo(
    () => logs.filter((l) => l.turn_id === currentTurnId),
    [logs, currentTurnId],
  );

  const traceSteps: TraceStep[] = useMemo(() => {
    const planLog = [...turnLogs].reverse().find((l) => l.intent === "plan_ready");
    const plan = (planLog?.payload?.["plan"] as PlanStep[] | undefined) ?? [];
    return plan.map((step) => {
      const related = turnLogs.filter(
        (l) => l.intent === step.description && l.receiver_agent === "orchestrator",
      );
      const started = turnLogs.some((l) => l.intent === step.description);
      const failed = related.some((l) => l.status === "error");
      const done = related.some((l) => l.status === "done");
      return {
        ...step,
        status: failed ? "error" : done ? "done" : started ? "active" : "pending",
      };
    });
  }, [turnLogs]);

  const thinkingAgent: AgentKey | null = useMemo(() => {
    const active = [...turnLogs].reverse().find((l) => l.status === "active");
    if (!active) return running ? "orchestrator" : null;
    return (active.receiver_agent as AgentKey) in AGENT_META
      ? (active.receiver_agent as AgentKey)
      : "orchestrator";
  }, [turnLogs, running]);

  const pending = approvals.find((a) => a.status === "pending") ?? null;

  const status = pending
    ? "Awaiting your approval"
    : running
      ? traceSteps.length > 0
        ? `Executing step ${Math.min(
            traceSteps.filter((s) => s.status !== "pending").length,
            traceSteps.length,
          )} of ${traceSteps.length}`
        : "Planning…"
      : "Idle";

  const send = useCallback(
    async (text: string) => {
      if (!sessionId || !studentId) return;
      setRunning(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `optimistic-${Date.now()}`,
          session_id: sessionId,
          role: "user",
          agent: null,
          content: text,
          citations: [],
          proactive: false,
          created_at: new Date().toISOString(),
        },
      ]);
      try {
        const res = await runOrchestrator({
          data: { sessionId, studentId, message: text, language },
        });
        if (!res.ok && res.error) toast.error("An agent failed", { description: res.error });
      } catch (err) {
        toast.error("NEXUS couldn't complete that request", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setRunning(false);
      }
    },
    [sessionId, studentId, language],
  );

  const onDecide = async (approve: boolean) => {
    if (!pending) return;
    try {
      await decideApproval({ data: { approvalId: pending.id, approve } });
    } catch (err) {
      toast.error("Could not record your decision", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const sentinelScan = async () => {
    if (!studentId) return;
    try {
      const res = await triggerSentinel({ data: { studentId } });
      if (res.alerts.length === 0) toast("Sentinel scan complete — no threshold breaches found.");
    } catch {
      toast.error("Sentinel Agent could not run its scan right now.");
    }
  };

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="panel max-w-sm p-6 text-center">
          <p className="text-sm font-semibold">NEXUS couldn't reach the campus database</p>
          <p className="mt-2 text-xs text-muted-foreground">{loadError}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!student || !sessionId) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="size-4 animate-pulse text-primary" />
          Waking the agent mesh…
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Terminal className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">NEXUS</span>
        </div>

        <div
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
            pending
              ? "border-[color-mix(in_oklab,var(--agent-communication)_50%,transparent)] text-[var(--agent-communication)]"
              : running
                ? "border-primary/50 text-primary"
                : "border-border text-muted-foreground"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${running || pending ? "animate-pulse" : ""}`}
            style={{ background: "currentColor" }}
          />
          {status}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
            <Languages className="ml-1.5 size-3.5 text-muted-foreground" />
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`rounded-full px-2 py-0.5 text-[11px] transition-colors ${
                  language === l.code
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={sentinelScan} className="border-border">
            <Radar className="size-3.5" /> Sentinel scan
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMemory((v) => !v)}
            className="border-border"
          >
            <UserIcon className="size-3.5" /> {student.name.split(" ")[0]}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              localStorage.removeItem("nexus_student_id");
              navigate({ to: "/" });
            }}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
        <section className="panel min-h-0 overflow-hidden">
          <ChatPanel
            messages={messages}
            running={running}
            thinkingAgent={thinkingAgent}
            onSend={send}
          />
        </section>

        <section className="grid min-h-0 grid-rows-[minmax(0,1.5fr)_minmax(0,1fr)] gap-3">
          <div className="panel relative min-h-0 overflow-hidden">
            <div className="absolute top-3 left-4 z-10 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Live agent graph
            </div>
            <AgentGraph logs={turnLogs} running={running} />
          </div>

          <div className="panel flex min-h-0 flex-col overflow-hidden">
            <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 pt-2">
              <TabButton active={rightTab === "trace"} onClick={() => setRightTab("trace")}>
                <Activity className="size-3.5" /> Reasoning
              </TabButton>
              <TabButton active={rightTab === "debug"} onClick={() => setRightTab("debug")}>
                <Bug className="size-3.5" /> Agent bus
              </TabButton>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              {rightTab === "trace" ? (
                <ReasoningTrace steps={traceSteps} running={running} />
              ) : (
                <DebugPanel logs={logs} />
              )}
            </div>
          </div>
        </section>
      </div>

      {showMemory && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
          onClick={() => setShowMemory(false)}
        >
          <aside
            className="absolute top-0 right-0 h-full w-full max-w-sm overflow-y-auto border-l border-border bg-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{student.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {student.branch} · Year {student.year}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowMemory(false)}>
                Close
              </Button>
            </div>
            <MemoryPanel student={student} facts={facts} courses={courses} events={events} />
          </aside>
        </div>
      )}

      {pending && <ApprovalModal approval={pending} onDecide={onDecide} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase transition-colors ${
        active
          ? "bg-surface-2 text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
