export type AgentKey =
  | "user"
  | "orchestrator"
  | "academic"
  | "placement"
  | "knowledge"
  | "communication"
  | "sentinel"
  | "tools";

export const AGENT_META: Record<
  AgentKey,
  { label: string; short: string; hue: string }
> = {
  user: { label: "You", short: "You", hue: "var(--agent-user)" },
  orchestrator: { label: "Orchestrator", short: "Orchestrator", hue: "var(--agent-orchestrator)" },
  academic: { label: "Academic Agent", short: "Academic", hue: "var(--agent-academic)" },
  placement: { label: "Placement Agent", short: "Placement", hue: "var(--agent-placement)" },
  knowledge: { label: "Knowledge Agent", short: "Knowledge", hue: "var(--agent-knowledge)" },
  communication: {
    label: "Communication Agent",
    short: "Comms",
    hue: "var(--agent-communication)",
  },
  sentinel: { label: "Sentinel Agent", short: "Sentinel", hue: "var(--agent-sentinel)" },
  tools: { label: "Campus Data & Tools", short: "Tools", hue: "var(--agent-tools)" },
};

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "te", label: "తెలుగు" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export type PlanStep = {
  agent: AgentKey;
  action: string;
  description: string;
  params?: Record<string, unknown>;
};

export type AgentLog = {
  id: string;
  session_id: string;
  turn_id: string | null;
  sender_agent: string;
  receiver_agent: string;
  intent: string;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  role: string;
  agent: string | null;
  content: string;
  citations: { title: string; section: string }[];
  proactive: boolean;
  created_at: string;
};

export type PendingApproval = {
  id: string;
  session_id: string;
  action_type: string;
  summary: string;
  reason: string | null;
  action_payload: Record<string, unknown>;
  status: string;
  result: string | null;
  created_at: string;
};

export type Student = {
  id: string;
  name: string;
  branch: string;
  year: number;
  cgpa: number;
  attendance_pct: number;
  backlogs: number;
  email: string | null;
};
