# NEXUS — Autonomous Smart Campus Multi-Agent AI

**NEXUS is not a chatbot.** It's a multi-agent orchestration platform where specialized AI agents plan, collaborate, and take real actions on a student's behalf — registering for events, sending emails, updating calendars — with a human approval step before anything irreversible happens.

🔗 **Live app:**(https://nexus-campus-buddy.lovable.app/)

---

## Problem Statement

Campus life generates a constant stream of small, fragmented administrative tasks — checking placement eligibility, tracking attendance thresholds, registering for events, staying on top of policy deadlines, following upcoming hackathons, internships and workshops. Today a student has to:

- Manually check multiple disconnected systems (attendance portals, placement cells, event pages, policy PDFs) to answer one question.
- Do their own multi-step reasoning (e.g. "am I eligible?" requires checking CGPA, branch, *and* backlog rules against a specific drive).
- Remember deadlines and thresholds themselves — nothing proactively tells them attendance has dropped below the cutoff until it's too late.
- Re-explain their context every single time, because existing "campus chatbots" are stateless Q&A tools with no memory and no ability to actually *act* — they can only tell a student what to do, not do it.
- Give them a proper roadmap and resources throughout their learning and answer their queries without feeling being judged.

The result is missed opportunities (an eligible student who never registers in time), avoidable academic risk (attendance drops unnoticed), and wasted time spent stitching together answers from five different places.

---

## Solution

**NEXUS** is an autonomous multi-agent system that treats a student's request as a *task to be executed*, not a question to be answered. A single natural-language message —

> "Am I eligible for the Google internship? If yes, register me for tomorrow's placement workshop, add it to my calendar, and remind me an hour before."

— is decomposed by an **Orchestrator Agent** into an explicit plan, delegated across specialist agents (academic records, placement eligibility, policy knowledge, communication/actions), executed with full visible reasoning, and gated by **human approval** before anything irreversible is written (an email sent, a registration submitted, a calendar event created).

On top of that, a **Sentinel Agent** runs in the background and proactively reaches out — e.g. flagging low attendance before the student even asks — turning NEXUS from a reactive tool into a system that looks out for the student.

The interface is built so this multi-agent collaboration is *visible*: a live animated agent graph, a plain-English reasoning trace, and an unmissable approval modal, so a judge (or a student) understands what's happening within seconds — not just a chat log with a good answer at the end.

---

## Core Features

- **Natural-language task execution** — one message can trigger a multi-step plan spanning eligibility checks, registrations, calendar updates, and reminders.
- **Live Agent Graph** — an animated node graph (User → Orchestrator → specialist agent(s) → Tool/DB) built with React Flow, with nodes pulsing/lighting up in real time as each agent activates.
- **Reasoning Trace panel** — the orchestrator's plan shown as numbered, plain-English steps ("1. Check eligibility → 2. Retrieve placement policy → 3. Register for event → 4. Schedule reminder"), collapsible once complete.
- **Human-in-the-loop approval gate** — any write action (email, registration, calendar entry) pauses execution and shows an approval modal with the exact action, the reasoning behind it, and an unambiguous Approve/Deny choice.
- **Sentinel Agent / proactive alerts** — scheduled background checks (e.g. attendance < 75%) push unprompted, visually distinct messages into the chat.
- **Multilingual chat** — English / Hindi / Telugu toggle, streaming markdown responses.
- **Cited policy answers (RAG)** — the Knowledge Agent answers policy questions with an expandable "Source: Attendance Policy §2" citation instead of a wall of text.
- **Long-term memory** — a Student Profile / Memory panel showing attendance %, CGPA, deadlines, and facts NEXUS has learned about the student across sessions.
- **Admin/Debug view** — raw agent-to-agent message log (sender, receiver, intent, payload) for full transparency into what the system actually did.
- **Graceful degradation** — if an agent or tool fails, the UI shows a clear fallback message instead of breaking or failing silently.

---

## System Architecture

```
                       ┌─────────────────────┐
                       │       Student       │
                       │  (Chat / Web UI)    │
                       └──────────┬───────────┘
                                  │ natural-language request
                                  ▼
                       ┌─────────────────────┐
                       │  Orchestrator Agent   │
                       │  - parses request     │
                       │  - builds JSON plan   │
                       │  - delegates steps    │
                       │  - logs to agent_logs │
                       └──────────┬───────────┘
              ┌───────────────────┼───────────────────┬─────────────────────┐
              ▼                   ▼                    ▼                     ▼
     ┌─────────────────┐ ┌─────────────────┐     ┌────────────────────┐     ┌──────────────────────┐
     │ Academic Agent    │ │ Placement Agent  │  │ Knowledge Agent (RAG)│   │ Communication & Action │
     │ timetable/         │ │ cgpa → branch →  │ │ policy search +      │   │ Agent                  │
     │ attendance/exams   │ │ backlog checks   │ │ cited answers        │   │ drafts email/registr./ │
     └────────┬──────────┘ └────────┬─────────┘  └──────────┬────────────┘  │ calendar → pending_    │
              │                     │                       │               │ approvals              │
              ▼                     ▼                       ▼               └───────────┬─────────────┘
     ┌─────────────────────────────────────────────────────────────┐                    │
     │              Supabase Postgres (students, courses,            │◄────────────────┘
     │        placements, events, policies, agent_logs, ...)          │
     └─────────────────────────────────────────────────────────────┘
                                  ▲
                                  │ writes pending action
                                  ▼
                       ┌─────────────────────┐        approve/deny        ┌───────────────┐
                       │  pending_approvals    │ ──────────────────────►  │ Approval Modal │
                       │  (status: pending)    │ ◄──────────────────────  │ (Student UI)   │
                       └─────────────────────┘                            └───────────────┘

     ┌───────────────────────────────────────────────────────────────┐
     │  Sentinel Agent (scheduled Supabase Edge Function / cron)        │
     │  scans students/courses for threshold breaches (e.g. attendance  │
     │  < 75%) → inserts proactive message into chat_messages           │
     │  → picked up via Supabase Realtime → shown as a toast            │
     └───────────────────────────────────────────────────────────────┘
```

**How it flows end to end:**
1. Student sends a message via the Chat panel.
2. The **Orchestrator** (a Supabase Edge Function calling an LLM) turns it into an ordered plan and writes each step to `agent_logs`.
3. The frontend subscribes to `agent_logs` via **Supabase Realtime**, animating the Live Agent Graph and Reasoning Trace as steps execute.
4. Read-only agents (Academic, Placement, Knowledge) query Postgres directly and respond.
5. The **Communication & Action Agent** never executes a write directly — it inserts a row into `pending_approvals`, which blocks until the student approves or denies it via the modal.
6. The **Sentinel Agent** runs independently on a schedule, watching for threshold breaches and proactively inserting messages that surface as toasts.

---

## Technologies Used

This project was scaffolded and iterated on inside **Lovable**, which generated a TanStack Start + Supabase codebase (agent logic runs as Supabase Edge Functions calling an LLM API — there is no separate Python backend).

| Layer | Technology |
|---|---|
| **Framework** | (`@tanstack/react-start`) on **React 19** |
| **Data fetching / cache** | `@tanstack/react-query` |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`, `tw-animate-css`, `tailwind-merge`) |
| **Live Agent Graph** | `@xyflow/react` (React Flow) |
| **Forms & validation** | `react-hook-form` + `@hookform/resolvers` + `zod` |
| **Backend / DB** | **Supabase** — Postgres, Auth, Realtime subscriptions, Edge Functions (`@supabase/supabase-js`) |
| **LLM calls** | Made from Supabase Edge Functions to an LLM API (orchestration + agent reasoning) |
| **Package manager** | Bun (`bun.lock`, `bunfig.toml`) |
| **Tooling** | TypeScript, ESLint (+ `typescript-eslint`, `eslint-plugin-react-hooks`), Prettier |
| **Deployment / dev loop** | Lovable (auto-synced to this GitHub repo on every change) |

---

## Data Model (Supabase Postgres)

| Table | Purpose |
|---|---|
| `students` | id, name, branch, year, cgpa, attendance_pct |
| `courses` | id, name, faculty, timetable_slot, student_id (fk) |
| `placements` | id, company, eligibility_rules (jsonb: min_cgpa, branch, max_backlogs), open_roles |
| `events` | id, title, date, capacity, registered_students (array) |
| `policies` | id, title, content — source docs for RAG (attendance policy, exam regulations, hostel rules, scholarships) |
| `chat_sessions` / `chat_messages` | standard per-student chat history |
| `agent_logs` | session_id, sender_agent, receiver_agent, intent, payload (jsonb), timestamp — powers the Live Agent Graph and Admin/Debug view |
| `pending_approvals` | session_id, action_type, action_payload, status (pending / approved / denied) |

Seeded with 3–4 mock students, 5–6 courses, 2–3 placement drives with different eligibility rules, 3–4 upcoming events, and 4 short policy documents.

---

## Agents Used

| Agent | Role | Reads / Writes |
|---|---|---|
| **Orchestrator Agent** | Converts the user's request + student context into an ordered JSON plan (`{agent, action, params}`), delegates to specialists, and logs every step in real time. | Writes `agent_logs` |
| **Academic Agent** | Answers timetable, attendance, and exam questions for the student. | Reads `courses`, `students` |
| **Placement Agent** | Multi-step eligibility reasoning — checks CGPA, then branch, then backlogs against a drive's rules, and explains which check passed or failed. | Reads `placements`, `students` |
| **Knowledge Agent (RAG)** | Similarity/keyword search over policy documents; answers with a cited source. | Reads `policies` |
| **Communication & Action Agent** | Drafts the exact email / registration / calendar action but never executes it directly — writes it as a pending action for approval. | Reads context, writes `pending_approvals` |
| **Sentinel Agent** | Scheduled (cron) Edge Function that scans for threshold breaches (e.g. attendance < 75%) and proactively inserts a chat message. | Reads `students`/`courses`, writes `chat_messages` |

---

## Future Scope

- **Real institutional integrations** — replace mock data with live connections to the college ERP, LMS (e.g. Moodle/Google Classroom), and official placement cell systems instead of seeded Supabase tables.
- **Real email/calendar execution** — wire the Communication & Action Agent to actual providers (Gmail/Outlook API, Google Calendar) once approved, rather than simulating the write.
- **Voice interface** — allow students to speak requests, useful for accessibility and quick on-the-go queries between classes.
- **Expanded agent roster** — add a Hostel/Facilities Agent, a Finance/Scholarship Agent, and a Wellness Agent (e.g. proactively checking in during high-stress periods like exams).
- **Cross-student/faculty view** — a faculty-facing dashboard so advisors can see (with consent) Sentinel-flagged students and approve interventions.
- **Smarter memory** — move from simple stored facts to a proper long-term vector memory so NEXUS's "remembers" list gets richer and more personalized over multiple semesters, not just recent sessions.
- **Fine-grained approval policies** — let students pre-approve certain low-risk action categories (e.g. "always auto-register me for free workshops in my branch") while keeping high-stakes actions (emails to faculty, paid registrations) gated.
- **Multi-tenant deployment** — generalize the schema so any college can spin up its own instance with its own courses, policies, and eligibility rules.
- **Analytics dashboard** — aggregate (anonymized) Sentinel triggers and agent usage to help administration spot systemic issues (e.g. a course with widespread attendance drops).
