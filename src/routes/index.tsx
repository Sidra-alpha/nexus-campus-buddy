import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Network, Plus, ShieldCheck, Radar, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addStudent, fetchStudents } from "@/lib/nexus.functions";

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
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [newName, setNewName] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [creating, setCreating] = useState(false);

  const { data: students, refetch } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data as Student[];
    },
  });

  useEffect(() => {
    localStorage.removeItem("nexus_student_id");
  }, []);

  const pick = (id: string) => {
    localStorage.setItem("nexus_student_id", id);
    navigate({ to: "/workspace" });
  };

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("students")
      .insert({
        name: newName.trim(),
        branch,
        year: 3,
        cgpa: 8.0,
        attendance_pct: 82,
        backlogs: 0,
        email: `${newName.trim().toLowerCase().replace(/\s+/g, ".")}@campus.edu`,
      })
      .select()
      .single();
    setCreating(false);
    if (!error && data) {
      await refetch();
      pick(data.id);
    }
  };

  return (
    <main className="grid-bg min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[11px] tracking-wider text-primary uppercase">
            <Network className="size-3.5" /> Multi-agent orchestration
          </div>
          <h1 className="mt-6 text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
            NEXUS runs your campus tasks
            <span className="text-primary"> with a team of agents.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Ask once. An Orchestrator writes a plan, delegates to the Academic, Placement,
            Knowledge and Communication agents, and shows every step live in a mission-control
            graph. Nothing irreversible happens without your explicit approval.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Feature icon={Workflow} title="Live agent graph" body="See collaboration as motion." />
            <Feature icon={ShieldCheck} title="Human in the loop" body="Approve every write." />
            <Feature icon={Radar} title="Sentinel alerts" body="Agents reach out first." />
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Choose your profile
          </h2>
          <div className="mt-4 space-y-2">
            {(students ?? []).map((s) => (
              <button
                key={s.id}
                onClick={() => pick(s.id)}
                className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-3 text-left transition-colors hover:border-primary"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary">
                  {s.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{s.name}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {s.branch} · Year {s.year} · CGPA {Number(s.cgpa).toFixed(2)} ·{" "}
                    {Number(s.attendance_pct).toFixed(0)}% attendance
                  </span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
              </button>
            ))}
            {!students && (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[58px] animate-pulse rounded-xl bg-surface-2" />
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-[11px] tracking-wider text-muted-foreground uppercase">
              Or create a profile
            </p>
            <div className="mt-2 flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Your name"
                className="bg-surface-2"
              />
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="rounded-md border border-border bg-surface-2 px-2 text-sm"
              >
                {["CSE", "ECE", "MECH", "CIVIL"].map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <Button onClick={create} disabled={creating || !newName.trim()} size="icon">
                <Plus className="size-4" />
              </Button>
            </div>
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
    <div className="rounded-xl border border-border bg-surface p-3">
      <Icon className="size-4 text-primary" />
      <p className="mt-2 text-xs font-semibold">{title}</p>
      <p className="text-[11px] text-muted-foreground">{body}</p>
    </div>
  );
}
