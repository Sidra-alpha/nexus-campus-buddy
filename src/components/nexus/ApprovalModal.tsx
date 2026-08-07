import { useState } from "react";
import { CalendarPlus, Mail, ShieldCheck, Ticket, BellRing, Check, X } from "lucide-react";
import type { PendingApproval } from "@/lib/nexus";
import { Button } from "@/components/ui/button";

const ICONS: Record<string, typeof Mail> = {
  email: Mail,
  register_event: Ticket,
  calendar: CalendarPlus,
  reminder: BellRing,
};

const LABELS: Record<string, string> = {
  email: "Send an email",
  register_event: "Register you for an event",
  calendar: "Add a calendar entry",
  reminder: "Schedule a reminder",
};

export function ApprovalModal({
  approval,
  onDecide,
}: {
  approval: PendingApproval;
  onDecide: (approve: boolean) => Promise<void>;
}) {
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
  const [result, setResult] = useState<{ approved: boolean } | null>(null);
  const Icon = ICONS[approval.action_type] ?? ShieldCheck;

  const decide = async (approve: boolean) => {
    setBusy(approve ? "approve" : "deny");
    try {
      await onDecide(approve);
      setResult({ approved: approve });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-md">
      <div className="msg-rise w-full max-w-md panel p-6">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-[var(--agent-communication)] uppercase">
          <ShieldCheck className="size-4" /> Approval required
        </div>

        <div className="mt-4 flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--agent-communication)_18%,transparent)] text-[var(--agent-communication)]">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">
              {LABELS[approval.action_type] ?? "Perform an action"}
            </p>
            <p className="mt-0.5 text-base leading-snug font-semibold">{approval.summary}</p>
          </div>
        </div>

        {approval.reason && (
          <p className="mt-4 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Why: </span>
            {approval.reason}
          </p>
        )}

        <p className="mt-3 text-[11px] text-muted-foreground">
          Proposed by the Communication Agent. Nothing has happened yet.
        </p>

        {result ? (
          <div
            className={`mt-5 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${
              result.approved
                ? "border-[color-mix(in_oklab,var(--success)_45%,transparent)] text-[var(--success)]"
                : "border-border text-muted-foreground"
            }`}
          >
            {result.approved ? <Check className="size-4" /> : <X className="size-4" />}
            {result.approved
              ? "Approved — the action was carried out and logged in chat."
              : "Denied — nothing was changed."}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              disabled={busy !== null}
              onClick={() => decide(false)}
              className="border-border"
            >
              Deny
            </Button>
            <Button disabled={busy !== null} onClick={() => decide(true)}>
              {busy === "approve" ? "Working…" : "Approve"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
