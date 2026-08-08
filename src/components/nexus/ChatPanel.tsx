import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, BellRing, FileText, Loader2, Sparkle } from "lucide-react";
import { AGENT_META, type AgentKey, type ChatMessage } from "@/lib/nexus";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function useTypewriter(text: string, enabled: boolean) {
  const [shown, setShown] = useState(enabled ? "" : text);
  useEffect(() => {
    if (!enabled) {
      setShown(text);
      return;
    }
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += 4;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 12);
    return () => clearInterval(id);
  }, [text, enabled]);
  return shown;
}

function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-2 text-[15px] leading-7 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-foreground [&_strong]:font-semibold">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

const STARTERS = [
  "Am I eligible for the Google internship? If yes register me for tomorrow's placement workshop and remind me an hour before.",
  "What happens if my attendance drops below 75%?",
  "Show my timetable and lowest attendance course.",
];

const FOLLOWUP_RE = /<!--\s*followups:([\s\S]*?)-->/i;

/** Removes the hidden follow-up marker from rendered text. */
export function stripFollowUps(text: string): string {
  return text.replace(FOLLOWUP_RE, "").trimEnd();
}

/** Reads the agent-authored follow-ups tailored to the student's own request. */
function agentFollowUps(text: string): string[] {
  const m = text.match(FOLLOWUP_RE);
  if (!m) return [];
  return (m[1] ?? "")
    .split("|")
    .map((s) => s.replace(/^[-*\s]+/, "").trim())
    .filter((s) => s.length > 2)
    .slice(0, 3);
}

/** Derives contextual follow-up prompts from the assistant's latest reply. */
function followUpsFor(text: string): string[] {
  const t = text.toLowerCase();
  const out: string[] = [];
  const add = (s: string) => {
    if (out.length < 3 && !out.includes(s)) out.push(s);
  };

  if (/attendance|75%|absent|classes/.test(t)) {
    add("Which classes should I attend this week to get back above 75%?");
    add("Alert me whenever any course drops below 80%.");
  }
  if (/intern|placement|eligib|company|drive|cgpa/.test(t)) {
    add("Show all placement drives I'm eligible for right now.");
    add("Help me prepare a 1-week plan for this interview.");
  }
  if (/event|workshop|register|seat/.test(t)) {
    add("Register me and add it to my calendar.");
    add("Remind me one hour before it starts.");
  }
  if (/policy|rule|regulation|handbook|clause/.test(t)) {
    add("Show me the exact policy section for this.");
    add("Summarise what this means for me in one line.");
  }
  if (/email|mail|message|sent|notify/.test(t)) {
    add("Draft a polite follow-up email for me.");
  }
  if (/timetable|schedule|class|tomorrow/.test(t)) {
    add("What does my day look like tomorrow?");
  }

  add("Why did you take these steps?");
  add("What should I do next?");
  return out.slice(0, 3);
}

function Bubble({ message, isLatest }: { message: ChatMessage; isLatest: boolean }) {
  const [openCite, setOpenCite] = useState(false);
  const agent = (message.agent ?? "orchestrator") as AgentKey;
  const meta = AGENT_META[agent] ?? AGENT_META.orchestrator;
  const body = useTypewriter(
    stripFollowUps(message.content),
    isLatest && message.role === "assistant",
  );

  if (message.role === "user") {
    return (
      <div className="msg-rise flex justify-end">
        <div className="max-w-[85%]">
          <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-[15px] leading-7 text-primary-foreground">
            {message.content}
          </div>
          <div className="mt-1 text-right text-[11px] text-muted-foreground">
            {timeOf(message.created_at)}
          </div>
        </div>
      </div>
    );
  }

  if (message.proactive) {
    return (
      <div className="msg-rise max-w-[92%]">
        <div className="rounded-xl border border-[color-mix(in_oklab,var(--agent-sentinel)_45%,transparent)] border-l-4 border-l-[var(--agent-sentinel)] bg-[color-mix(in_oklab,var(--agent-sentinel)_9%,var(--surface))] px-4 py-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--agent-sentinel)] uppercase">
            <BellRing className="size-4" /> NEXUS noticed something
          </div>
          <Markdown>{body}</Markdown>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Sentinel Agent · {timeOf(message.created_at)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="msg-rise max-w-[92%]">
      <div
        className="mb-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase"
        style={{
          background: `color-mix(in oklab, ${meta.hue} 16%, transparent)`,
          color: meta.hue,
        }}
      >
        <span className="size-1.5 rounded-full" style={{ background: meta.hue }} />
        {meta.label}
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-3">
        <Markdown>{body}</Markdown>
        {message.citations?.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {message.citations.map((c, i) => (
              <button
                key={i}
                onClick={() => setOpenCite((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <FileText className="size-3.5" /> Source: {c.title} {c.section}
              </button>
            ))}
          </div>
        )}
        {openCite && (
          <p className="mt-2 border-l-2 border-border pl-2 text-xs text-muted-foreground">
            Retrieved by the Knowledge Agent from the campus policy library stored in the NEXUS
            database.
          </p>
        )}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{timeOf(message.created_at)}</div>
    </div>
  );
}

export function ChatPanel({
  messages,
  running,
  thinkingAgent,
  onSend,
}: {
  messages: ChatMessage[];
  running: boolean;
  thinkingAgent: AgentKey | null;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, running]);

  const submit = () => {
    const text = value.trim();
    if (!text || running) return;
    setValue("");
    onSend(text);
  };

  const thinkingMeta = thinkingAgent ? AGENT_META[thinkingAgent] : null;

  const last = messages[messages.length - 1];
  const followUps = useMemo(
    () => (!running && last && last.role === "assistant" ? followUpsFor(last.content) : []),
    [running, last],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {messages.length === 0 && !running && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-2xl border border-border bg-surface px-6 py-5">
              <p className="text-base font-semibold">Ask NEXUS anything about your campus life</p>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                It plans, delegates to specialist agents, and always asks before acting.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="max-w-[280px] truncate rounded-full border border-border bg-surface-2 px-3.5 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <Bubble key={m.id} message={m} isLatest={i === messages.length - 1} />
        ))}

        {running && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" style={{ color: thinkingMeta?.hue }} />
            <span>
              {thinkingMeta ? `${thinkingMeta.label} is thinking…` : "Orchestrator is planning…"}
            </span>
          </div>
        )}

        {followUps.length > 0 && (
          <div className="msg-rise space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <Sparkle className="size-3.5 text-primary" /> Suggested follow-ups
            </div>
            <div className="flex flex-wrap gap-2">
              {followUps.map((s) => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="rounded-full border border-border bg-surface-2 px-3.5 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-surface-2 p-2 focus-within:border-primary">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Ask NEXUS to check, find, or do something…"
            className="max-h-32 min-h-[42px] resize-none border-0 bg-transparent text-[15px] shadow-none focus-visible:ring-0"
          />
          <Button size="icon" onClick={submit} disabled={running || !value.trim()}>
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
