# Nexus Campus AI

go throught the file which i am attaching and th prompt carefully. execute what ever is in the there.                  Build "NEXUS" — an Autonomous Smart Campus Multi-Agent AI System. This is NOT a chatbot. It is a multi-agent orchestration platform where specialized AI agents plan, collaborate, and take real actions on behalf of the user (register for events, send emails, update calendars) — always behind a human approval step. The UI must make the multi-agent collaboration visually obvious, not just show a chat log.

Core Concept

A student types a natural-language request (e.g. "Am I eligible for the Google internship? If yes, register me for tomorrow's placement workshop, add it to my calendar, and remind me an hour before"). An Orchestrator Agent breaks this into a plan, delegates steps to specialized agents, shows its reasoning live, and pauses for user approval before any irreversible action.

Pages / Screens

1. Landing/Login — clean, modern, dark-mode-first dashboard aesthetic (not a generic SaaS template — use a distinctive color accent, not default purple/blue gradients). Simple mock auth (student picks/creates a profile).

2. Main Workspace (core screen) — split layout:

   - Left: Chat panel (streaming responses, markdown support, multilingual toggle for English/Hindi/Telugu)

   - Right: "Live Agent Graph" panel — an animated node graph (use React Flow) showing: User → Orchestrator → [Academic Agent / Placement Agent / Knowledge Agent / Communication Agent] → Tools. Nodes should visually light up / pulse in sequence as each agent activates during a request, with the current step's status (pending/active/done) shown on the node.

   - Below the graph: a collapsible "Reasoning Trace" panel showing the orchestrator's plan in plain English as numbered steps before/while it executes (e.g. "1. Check eligibility → 2. Retrieve placement policy → 3. Register for event → 4. Schedule reminder").

3. Approval Modal — whenever an agent wants to perform a write action (send email, register for event, add calendar entry), interrupt the flow and show a modal with the exact action details and a Confirm/Deny choice. Nothing irreversible happens without this.

4. Proactive Alerts — a toast/notification system where the "Sentinel Agent" can push unprompted messages into the chat (e.g. "Your attendance in DBMS just dropped below 75% — want me to draft an email to your faculty advisor?"), clearly styled differently from user-triggered responses so it's obvious the system initiated it, not the user.

5. Student Profile / Memory panel — shows what the system remembers about the student (past requests, preferences, attendance %, CGPA) — demonstrates long-term agent memory.

6. Admin/Debug view (optional tab) — raw log of agent-to-agent messages (sender, receiver, intent, payload) for demo/judging transparency.

Data Model (Supabase Postgres)

- `students`: id, name, branch, year, cgpa, attendance_pct

- `courses`: id, name, faculty, timetable_slot, student_id (fk)

- `placements`: id, company, eligibility_rules (jsonb: min_cgpa, branch, max_backlogs), open_roles

- `events`: id, title, date, capacity, registered_students (array)

- `policies`: id, title, content (source text for RAG — attendance policy, exam regs, hostel rules, scholarships — write 4-5 realistic sample docs)

- `chat_sessions`, `chat_messages`: standard chat history per student

- `agent_logs`: session_id, sender_agent, receiver_agent, intent, payload (jsonb), timestamp — powers the live graph and debug view

- `pending_approvals`: session_id, action_type, action_payload, status (pending/approved/denied)

Agent Logic (implement via Supabase Edge Functions calling an LLM API)

- Orchestrator: takes the user message + student context, calls the LLM to produce a JSON plan (ordered list of {agent, action, params}), writes each step to `agent_logs` as it executes so the frontend graph updates in real time via Supabase Realtime subscriptions.

- Academic Agent: reads `courses`/`students` tables, answers timetable/attendance/exam questions.

- Placement Agent: checks `placements.eligibility_rules` against the student row, does multi-step reasoning (cgpa check → branch check → backlog check) and explains which rule passed/failed.

- Knowledge Agent (RAG): does a simple similarity/keyword search over the `policies` table content and answers policy questions with the source cited.

- Communication & Action Agent: drafts email/registration/calendar actions but writes to `pending_approvals` instead of executing directly — only proceeds after the frontend approval modal resolves it to "approved".

- Sentinel Agent: a scheduled edge function (cron) that scans `students`/`courses` for threshold breaches (e.g. attendance < 75%) and inserts a proactive message into `chat_messages` for that student, which the frontend picks up via Realtime and shows as a toast.

Design Direction

Distinctive, not templated — dark background, one confident accent color, clean sans-serif typography, generous whitespace. The Live Agent Graph should feel like a "mission control" element, not a decorative diagram. Streaming chat bubbles, smooth transitions on graph node state changes, and a genuinely different visual treatment for "user-triggered" vs "agent-initiated" (Sentinel) messages.

Seed Data

Seed with 3-4 mock students, 5-6 courses, 2-3 placement drives with different eligibility rules, 3-4 upcoming events, and 4 short policy documents (attendance policy, exam regulations, hostel rules, scholarship guidelines).

Build this as a fully working prototype with real Supabase-backed data and real LLM calls (not hardcoded fake responses) so the multi-agent planning and tool-calling are genuinely functional, not scripted.           ## Frontend Requirements — Interface must be clear, understandable, and top-notch

The interface's job is to make invisible AI reasoning visible. A judge should understand what the system is doing within 5 seconds of watching it, without anyone explaining it verbally.

Layout & Hierarchy

- Three-zone workspace layout: Chat (left, ~40%), Live Agent Graph (right-top, ~35%), Reasoning Trace + Approvals (right-bottom, ~25%). No zone should require scrolling to understand what's happening right now.

- Persistent top bar: student name/avatar, current session status ("Idle" / "Planning..." / "Executing step 2 of 4" / "Awaiting your approval"), language toggle, memory/profile icon.

- Every screen should have ONE clear focal point at a time — when an approval is pending, dim/blur the rest of the UI so the modal is unmissable. When idle, the chat input is the focal point.

Chat Panel

- Clear visual distinction between three message types (not just user vs assistant):

  1. User messages — right-aligned, accent color

  2. Agent responses — left-aligned, neutral, with a small labeled tag showing WHICH agent answered (e.g. "Placement Agent" badge with a distinct icon/color per agent)

  3. Proactive/Sentinel messages — visually separate treatment entirely (e.g. a left border accent, a small " NEXUS noticed something" label) so it's immediately obvious the AI initiated this, not the user

- Streaming text (token-by-token), with a subtle typing indicator that shows which agent is "thinking" before the graph even updates

- Inline citations when the Knowledge Agent answers from a policy doc — a small expandable "Source: Attendance Policy §2" chip, not a wall of text

- Message timestamps, but understated (small, muted gray) — don't clutter

Live Agent Graph

- This is the signature feature — it must read instantly, not require a legend

- Nodes: User → Orchestrator → active specialist agent(s) → Tool/DB icon. Use simple, distinct icons per agent (not generic robot icons — e.g. a book for Knowledge, a briefcase for Placement, a calendar for Communication)

- States communicated purely visually: gray/dim = idle, pulsing accent color = currently active, solid checkmark = completed, red = error/fallback triggered

- Edges animate (a moving dot or dash-flow) while data is being passed between two active nodes, so "collaboration" is literally visible motion, not static lines

- Keep it to max 6-7 nodes visible at once — if it gets busy/cluttered, it stops being "clear and understandable" and becomes noise

Reasoning Trace Panel

- Numbered plan steps, each with a status icon (○ pending, ◐ in progress, ✓ done, ✕ failed/fallback)

- Plain-English step descriptions, not technical/JSON — e.g. "Checking CGPA and backlog eligibility" not "invoke placement_agent.check_eligibility()"

- Collapsible by default after a request completes, so it doesn't clutter the interface once the answer is delivered — expandable on click for anyone (a judge) who wants to inspect it

Approval Modal

- Cannot be missed or misread: shows the exact action in plain language ("Register you for: AI/ML Workshop — Tomorrow, 10 AM"), the agent proposing it, and two unambiguous buttons (Approve / Deny) — no fine print, no ambiguity about what happens on each choice

- A short "why" line under the action ("Recommended because you're eligible and it's before your exam deadline")

- After a decision, show brief confirmation feedback inline (not just closing the modal silently) so the user/judge has closure on that action

Memory / Profile Panel

- Simple, scannable card layout — attendance %, CGPA, upcoming deadlines, and a short "NEXUS remembers" list (2-3 bullet facts it has learned about this student's preferences from past sessions)

- This should feel like evidence of persistence across sessions, not a settings page

Accessibility & Polish (judges notice these even if they don't say so)

- Consistent spacing scale, one accent color used purposefully (not scattered across every element), readable contrast in dark mode

- Empty/loading states designed on purpose — no blank white flash, no unstyled "Loading..." text

- Graceful error/fallback UI — if an agent or tool fails, show a clear, calm message ("Placement Agent couldn't reach the eligibility database — showing cached data from this morning") instead of a broken UI or silent failure, since "error handling and graceful fallback" is explicitly graded

- Fully responsive down to tablet width at minimum, since evaluators may view this on a laptop screen shared over a call

- Subtle micro-interactions only where they add clarity (button press feedback, modal transitions) — avoid decorative animation that adds no information

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nexus-campus-buddy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/684f8585-e7fa-40bc-b5dc-2c10b14d7b3f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
