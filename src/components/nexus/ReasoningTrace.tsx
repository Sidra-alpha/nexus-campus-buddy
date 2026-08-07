import { useState } from "react";
import { ChevronDown, Circle, CircleDot, Check, X } from "lucide-react";
import type { PlanStep } from "@/lib/nexus";

export type TraceStep = PlanStep & { status: "pending" | "active" | "done" | "error" };

export function ReasoningTrace({
  steps,
  running,
}: {
  steps: TraceStep[];
  running: boolean;
}) {
  const [open, setOpen] = useState(true);
  const doneCount = steps.filter((s) => s.status === "done").length;

  return (
    <div className="flex min-h-0 flex-col">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Reasoning trace
          {steps.length > 0 && (
            <span className="ml-2 text-foreground">
              {doneCount}/{steps.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {steps.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {running
                ? "Orchestrator is drafting a plan…"
                : "No active plan. Send a request to see how NEXUS breaks it down."}
            </p>
          ) : (
            <ol className="space-y-2">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs">
                  <span className="mt-0.5">
                    {s.status === "done" ? (
                      <Check className="size-3.5 text-[var(--success)]" />
                    ) : s.status === "error" ? (
                      <X className="size-3.5 text-destructive" />
                    ) : s.status === "active" ? (
                      <CircleDot className="size-3.5 animate-pulse text-primary" />
                    ) : (
                      <Circle className="size-3.5 text-muted-foreground" />
                    )}
                  </span>
                  <span className="flex-1">
                    <span className="text-muted-foreground">{i + 1}. </span>
                    <span
                      className={
                        s.status === "pending" ? "text-muted-foreground" : "text-foreground"
                      }
                    >
                      {s.description}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
