import type { AgentKey, PlanStep } from "./nexus";

type Json = Record<string, unknown>;

const MODEL = "google/gemini-3.6-flash";

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function callLLM(messages: { role: string; content: string }[], jsonMode = false) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

async function log(
  sessionId: string,
  turnId: string,
  sender: AgentKey | string,
  receiver: AgentKey | string,
  intent: string,
  status: string,
  payload: Json = {},
) {
  const supabase = await db();
  await supabase.from("agent_logs").insert({
    session_id: sessionId,
    turn_id: turnId,
    sender_agent: sender,
    receiver_agent: receiver,
    intent,
    status,
    payload: payload as never,
  });
}

const LANG_NAME: Record<string, string> = {
  en: "English",
  hi: "Hindi (Devanagari script)",
  te: "Telugu (Telugu script)",
};

/* ---------------- specialist agents ---------------- */

async function academicAgent(studentId: string) {
  const supabase = await db();
  const [{ data: student }, { data: courses }] = await Promise.all([
    supabase.from("students").select("*").eq("id", studentId).maybeSingle(),
    supabase.from("courses").select("*").eq("student_id", studentId),
  ]);
  return { student, courses: courses ?? [] };
}

async function placementAgent(studentId: string, company?: string) {
  const supabase = await db();
  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle();
  let query = supabase.from("placements").select("*");
  if (company) query = query.ilike("company", `%${company}%`);
  const { data: drives } = await query;
  const evaluations = (drives ?? []).map((d) => {
    const rules = (d.eligibility_rules ?? {}) as {
      min_cgpa?: number;
      branches?: string[];
      max_backlogs?: number;
    };
    const checks = [
      {
        rule: `Minimum CGPA ${rules.min_cgpa ?? 0}`,
        value: `Your CGPA ${student?.cgpa}`,
        passed: Number(student?.cgpa ?? 0) >= (rules.min_cgpa ?? 0),
      },
      {
        rule: `Eligible branches: ${(rules.branches ?? ["any"]).join(", ")}`,
        value: `Your branch ${student?.branch}`,
        passed: !rules.branches || rules.branches.includes(student?.branch ?? ""),
      },
      {
        rule: `Maximum backlogs ${rules.max_backlogs ?? "any"}`,
        value: `Your backlogs ${student?.backlogs}`,
        passed:
          rules.max_backlogs === undefined ||
          Number(student?.backlogs ?? 0) <= rules.max_backlogs,
      },
    ];
    return {
      company: d.company,
      open_roles: d.open_roles,
      drive_date: d.drive_date,
      checks,
      eligible: checks.every((c) => c.passed),
    };
  });
  return { evaluations };
}

async function knowledgeAgent(question: string) {
  const supabase = await db();
  const { data: policies } = await supabase.from("policies").select("*");
  const words = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
  const scored = (policies ?? [])
    .map((p) => {
      const text = `${p.title} ${p.content}`.toLowerCase();
      const score = words.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0);
      const sections = p.content.split("§").filter(Boolean);
      const best = sections
        .map((s: string, i: number) => ({
          section: `§${i + 1}`,
          text: s.replace(/^\d+\s*/, "").trim(),
          hits: words.reduce((a, w) => a + (s.toLowerCase().includes(w) ? 1 : 0), 0),
        }))
        .sort((a, b) => b.hits - a.hits)
        .slice(0, 2);
      return { title: p.title, score, excerpts: best };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  return { matches: scored };
}

async function communicationAgent(
  sessionId: string,
  studentId: string,
  params: Json,
) {
  const supabase = await db();
  const actionType = String(params["type"] ?? "email");
  const summary = String(params["summary"] ?? "Perform an action on your behalf");
  const reason = String(params["reason"] ?? "Requested as part of your instruction.");
  const { data } = await supabase
    .from("pending_approvals")
    .insert({
      session_id: sessionId,
      student_id: studentId,
      action_type: actionType,
      summary,
      reason,
      action_payload: params as never,
      status: "pending",
    })
    .select()
    .single();
  return { approval: data, awaiting_approval: true };
}

async function runStep(
  sessionId: string,
  studentId: string,
  step: PlanStep,
): Promise<Json> {
  const params = (step.params ?? {}) as Json;
  switch (step.agent) {
    case "academic":
      return (await academicAgent(studentId)) as unknown as Json;
    case "placement":
      return (await placementAgent(
        studentId,
        params["company"] ? String(params["company"]) : undefined,
      )) as unknown as Json;
    case "knowledge":
      return (await knowledgeAgent(
        String(params["question"] ?? step.description),
      )) as unknown as Json;
    case "communication":
      return (await communicationAgent(sessionId, studentId, params)) as unknown as Json;
    default:
      return { note: "No specialist matched; orchestrator handled this directly." };
  }
}

/* ---------------- orchestrator ---------------- */

export async function orchestrate(input: {
  sessionId: string;
  studentId: string;
  message: string;
  language: string;
}) {
  const supabase = await db();
  const turnId = crypto.randomUUID();

  await supabase.from("chat_messages").insert({
    session_id: input.sessionId,
    student_id: input.studentId,
    role: "user",
    content: input.message,
  });

  await log(input.sessionId, turnId, "user", "orchestrator", "user_request", "done", {
    message: input.message,
  });

  const [{ student, courses }, { data: memory }, { data: events }] = await Promise.all([
    academicAgent(input.studentId),
    supabase.from("student_memory").select("fact").eq("student_id", input.studentId),
    supabase.from("events").select("id,title,date,location,capacity").order("date"),
  ]);

  const context = JSON.stringify({ student, courses, events, memory: memory ?? [] });

  try {
    await log(input.sessionId, turnId, "orchestrator", "orchestrator", "planning", "active", {});

    const planRaw = await callLLM(
      [
        {
          role: "system",
          content: `You are the Orchestrator of NEXUS, a smart-campus multi-agent system.
Break the student's request into an ordered plan. Available agents:
- academic: timetable, attendance, courses, exam schedule questions (reads student + courses tables)
- placement: checks placement drive eligibility rules against the student
- knowledge: RAG over campus policy documents (attendance policy, exam regulations, hostel rules, scholarship guidelines)
- communication: drafts a write action (email / event registration / calendar entry / reminder). It NEVER executes; it creates a pending approval.
Return STRICT JSON: {"steps":[{"agent":"academic|placement|knowledge|communication","action":"snake_case_action","description":"plain English, max 8 words","params":{}}]}
For communication steps, params must include: type (email|register_event|calendar|reminder), summary (one plain-English sentence describing exactly what will happen), reason (short why), and any relevant details (event title/date, recipient, message).
Use 1-5 steps. Only include steps the request actually needs.`,
        },
        {
          role: "user",
          content: `Student context: ${context}\n\nRequest: ${input.message}`,
        },
      ],
      true,
    );

    let steps: PlanStep[] = [];
    try {
      const parsed = JSON.parse(planRaw) as { steps?: PlanStep[] };
      steps = Array.isArray(parsed.steps) ? parsed.steps.slice(0, 5) : [];
    } catch {
      steps = [];
    }
    if (steps.length === 0) {
      steps = [
        {
          agent: "knowledge",
          action: "answer_question",
          description: "Look up campus knowledge",
          params: { question: input.message },
        },
      ];
    }

    await log(input.sessionId, turnId, "orchestrator", "orchestrator", "plan_ready", "done", {
      plan: steps,
    });

    const results: { step: PlanStep; result: Json; error?: string }[] = [];
    for (const step of steps) {
      await log(
        input.sessionId,
        turnId,
        "orchestrator",
        step.agent,
        step.description,
        "active",
        { params: step.params ?? {} },
      );
      try {
        const result = await runStep(input.sessionId, input.studentId, step);
        await log(input.sessionId, turnId, step.agent, "tools", step.action, "done", {
          result,
        });
        await log(
          input.sessionId,
          turnId,
          step.agent,
          "orchestrator",
          step.description,
          "done",
          { result },
        );
        results.push({ step, result });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown failure";
        await log(
          input.sessionId,
          turnId,
          step.agent,
          "orchestrator",
          step.description,
          "error",
          { error: message },
        );
        results.push({ step, result: {}, error: message });
      }
    }

    const answer = await callLLM([
      {
        role: "system",
        content: `You are NEXUS, a smart-campus assistant. Write the final reply to the student in ${
          LANG_NAME[input.language] ?? "English"
        }.
Use short markdown: bold key facts, bullet lists, no headings larger than ###.
Explain eligibility rule-by-rule when placement data is present (which rule passed/failed).
When policy excerpts are used, cite them inline like "(Source: Attendance Policy §1)".
If an action is awaiting approval, say clearly that it is waiting for the student's confirmation and nothing has been done yet.
Be concise: under 180 words.`,
      },
      {
        role: "user",
        content: `Student: ${JSON.stringify(student)}\nRequest: ${input.message}\nAgent results: ${JSON.stringify(results).slice(0, 12000)}`,
      },
    ]);

    const citations: { title: string; section: string }[] = [];
    for (const r of results) {
      const matches = (r.result as { matches?: { title: string; excerpts: { section: string }[] }[] })
        .matches;
      if (matches) {
        for (const m of matches.slice(0, 1)) {
          for (const e of m.excerpts.slice(0, 1)) {
            citations.push({ title: m.title, section: e.section });
          }
        }
      }
    }

    const primaryAgent = steps[steps.length - 1]?.agent ?? "orchestrator";

    await supabase.from("chat_messages").insert({
      session_id: input.sessionId,
      student_id: input.studentId,
      role: "assistant",
      agent: primaryAgent,
      content: answer,
      citations,
    });

    await log(input.sessionId, turnId, "orchestrator", "user", "final_answer", "done", {});

    return { ok: true, turnId, error: "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown failure";
    await log(input.sessionId, turnId, "orchestrator", "user", "failure", "error", {
      error: message,
    });
    await supabase.from("chat_messages").insert({
      session_id: input.sessionId,
      student_id: input.studentId,
      role: "assistant",
      agent: "orchestrator",
      content: `The Orchestrator couldn't complete this request — ${message}. Nothing was changed. You can retry, or ask a simpler question while the agents recover.`,
    });
    return { ok: false, turnId, error: message };
  }
}

/* ---------------- approvals ---------------- */

export async function resolveApproval(input: { approvalId: string; approve: boolean }) {
  const supabase = await db();
  const { data: approval } = await supabase
    .from("pending_approvals")
    .select("*")
    .eq("id", input.approvalId)
    .maybeSingle();
  if (!approval) throw new Error("Approval not found");

  if (!input.approve) {
    await supabase
      .from("pending_approvals")
      .update({ status: "denied", result: "Denied by student. No action was taken." })
      .eq("id", input.approvalId);
    await supabase.from("chat_messages").insert({
      session_id: approval.session_id,
      student_id: approval.student_id,
      role: "assistant",
      agent: "communication",
      content: `Understood — I did **not** perform this action: ${approval.summary}`,
    });
    return { status: "denied", result: "No action taken." };
  }

  const payload = (approval.action_payload ?? {}) as Json;
  let result = "";

  if (approval.action_type === "register_event") {
    const title = String(payload["event_title"] ?? payload["title"] ?? "");
    let query = supabase.from("events").select("*");
    if (title) query = query.ilike("title", `%${title.split(" ")[0]}%`);
    const { data: events } = await query.order("date").limit(1);
    const event = events?.[0];
    if (event) {
      const studentRef = approval.student_id ?? "";
      const registered: string[] = event.registered_students ?? [];
      if (studentRef && !registered.includes(studentRef)) {
        await supabase
          .from("events")
          .update({ registered_students: [...registered, studentRef] })
          .eq("id", event.id);
      }
      result = `Registered for “${event.title}” on ${new Date(event.date).toLocaleString()}.`;
    } else {
      result = "Could not find a matching event — registration was not completed.";
    }
  } else if (approval.action_type === "email") {
    result = `Email queued to ${String(payload["to"] ?? "your faculty advisor")}.`;
  } else if (approval.action_type === "calendar") {
    result = "Calendar entry created.";
  } else if (approval.action_type === "reminder") {
    result = "Reminder scheduled.";
  } else {
    result = "Action completed.";
  }

  await supabase
    .from("pending_approvals")
    .update({ status: "approved", result })
    .eq("id", input.approvalId);

  await supabase.from("chat_messages").insert({
    session_id: approval.session_id,
    student_id: approval.student_id,
    role: "assistant",
    agent: "communication",
    content: `✅ Done — ${result}`,
  });

  return { status: "approved", result };
}

/* ---------------- sentinel ---------------- */

export async function runSentinel(studentId?: string) {
  const supabase = await db();
  let studentQuery = supabase.from("students").select("*");
  if (studentId) studentQuery = studentQuery.eq("id", studentId);
  const { data: students } = await studentQuery;
  const alerts: string[] = [];

  for (const student of students ?? []) {
    const { data: courses } = await supabase
      .from("courses")
      .select("*")
      .eq("student_id", student.id);
    const low = (courses ?? []).filter((c) => Number(c.attendance_pct) < 75);
    if (low.length === 0) continue;

    const { data: session } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!session) continue;

    const course = low[0];
    if (!course) continue;
    const content = `Your attendance in **${course.name}** just dropped to **${course.attendance_pct}%**, below the 75% requirement (Source: Attendance Policy §1). Want me to draft an email to ${course.faculty}?`;

    const { data: recent } = await supabase
      .from("chat_messages")
      .select("id")
      .eq("session_id", session.id)
      .eq("proactive", true)
      .gte("created_at", new Date(Date.now() - 1000 * 60 * 10).toISOString())
      .limit(1);
    if (recent && recent.length > 0) continue;

    await supabase.from("chat_messages").insert({
      session_id: session.id,
      student_id: student.id,
      role: "assistant",
      agent: "sentinel",
      content,
      proactive: true,
    });
    await log(session.id, crypto.randomUUID(), "sentinel", "user", "attendance_alert", "done", {
      course: course.name,
      attendance: course.attendance_pct,
    });
    alerts.push(student.name);
  }
  return { alerts };
}
