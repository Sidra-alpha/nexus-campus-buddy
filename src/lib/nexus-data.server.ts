// Server-only data access for NEXUS. All campus tables are locked down with RLS
// and no public grants, so every read/write goes through this trusted module.
import type { AgentLog, ChatMessage, PendingApproval, Student } from "./nexus";
import type { Json } from "@/integrations/supabase/types";

type SerializableLog = Omit<AgentLog, "payload"> & { payload: Json };
type SerializableApproval = Omit<PendingApproval, "action_payload"> & { action_payload: Json };
type SerializableMessage = Omit<ChatMessage, "citations"> & { citations: Json };

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const BRANCHES = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT"];

export async function getStudentIdForUser(userId: string) {
  const supabase = await db();
  const { data } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function requireStudentIdForUser(userId: string) {
  const id = await getStudentIdForUser(userId);
  if (!id) throw new Error("No campus profile exists for this account yet.");
  return id;
}

export async function createStudentForUser(
  userId: string,
  input: { name: string; branch: string; email: string | null },
) {
  const existing = await getStudentIdForUser(userId);
  if (existing) return { id: existing };

  const name = input.name.trim().slice(0, 60);
  if (name.length < 2 || !/^[\p{L}\p{M}.'\- ]+$/u.test(name)) {
    throw new Error("Please enter a valid name.");
  }
  const branch = BRANCHES.includes(input.branch) ? input.branch : "CSE";
  const supabase = await db();
  const { data, error } = await supabase
    .from("students")
    .insert({
      name,
      branch,
      year: 3,
      cgpa: 8.0,
      attendance_pct: 82,
      backlogs: 0,
      user_id: userId,
      email: input.email ?? `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@campus.edu`,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("Could not create the profile.");
  return { id: data.id };
}

export async function assertSessionOwned(sessionId: string, studentId: string) {
  const supabase = await db();
  const { data } = await supabase
    .from("chat_sessions")
    .select("student_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!data || data.student_id !== studentId) throw new Error("Session not found.");
}

export async function assertApprovalOwned(approvalId: string, studentId: string) {
  const supabase = await db();
  const { data } = await supabase
    .from("pending_approvals")
    .select("student_id")
    .eq("id", approvalId)
    .maybeSingle();
  if (!data || data.student_id !== studentId) throw new Error("Approval not found.");
}


export async function loadSessionState(sessionId: string) {
  const supabase = await db();
  const [msgs, lgs, aps] = await Promise.all([
    supabase.from("chat_messages").select("*").eq("session_id", sessionId).order("created_at"),
    supabase.from("agent_logs").select("*").eq("session_id", sessionId).order("created_at"),
    supabase.from("pending_approvals").select("*").eq("session_id", sessionId).order("created_at"),
  ]);
  return {
    messages: (msgs.data ?? []) as unknown as SerializableMessage[],
    logs: (lgs.data ?? []) as unknown as SerializableLog[],
    approvals: (aps.data ?? []) as unknown as SerializableApproval[],
  };
}

export async function loadWorkspace(studentId: string) {
  const supabase = await db();
  const [s, c, ev, mem] = await Promise.all([
    supabase.from("students").select("*").eq("id", studentId).maybeSingle(),
    supabase
      .from("courses")
      .select("id,name,attendance_pct,timetable_slot,faculty")
      .eq("student_id", studentId),
    supabase.from("events").select("title,date").order("date").limit(5),
    supabase.from("student_memory").select("fact").eq("student_id", studentId),
  ]);

  if (!s.data) return { student: null } as const;

  const { data: existing } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let sessionId = existing?.id ?? null;
  if (!sessionId) {
    const { data: created } = await supabase
      .from("chat_sessions")
      .insert({ student_id: studentId, title: "Campus session" })
      .select("id")
      .single();
    sessionId = created?.id ?? null;
  }
  if (!sessionId) throw new Error("Could not open a campus session.");

  const state = await loadSessionState(sessionId);

  return {
    student: s.data as Student,
    courses: (c.data ?? []) as {
      id: string;
      name: string;
      attendance_pct: number;
      timetable_slot: string;
      faculty: string;
    }[],
    events: (ev.data ?? []) as { title: string; date: string }[],
    facts: (mem.data ?? []).map((m) => m.fact),
    sessionId,
    ...state,
  } as const;
}
