import { Brain, GraduationCap, CalendarClock, TrendingUp } from "lucide-react";
import type { Student } from "@/lib/nexus";

export function MemoryPanel({
  student,
  facts,
  courses,
  events,
}: {
  student: Student;
  facts: string[];
  courses: { name: string; attendance_pct: number; timetable_slot: string }[];
  events: { title: string; date: string }[];
}) {
  const lowest = [...courses].sort((a, b) => a.attendance_pct - b.attendance_pct)[0];
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat
          icon={TrendingUp}
          label="CGPA"
          value={Number(student.cgpa).toFixed(2)}
          hint={`${student.branch} · Year ${student.year}`}
        />
        <Stat
          icon={GraduationCap}
          label="Attendance"
          value={`${Number(student.attendance_pct).toFixed(0)}%`}
          hint={student.attendance_pct < 75 ? "Below requirement" : "Above requirement"}
          danger={student.attendance_pct < 75}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface-2 p-3">
        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Courses
        </p>
        <ul className="mt-2 space-y-1.5">
          {courses.map((c) => (
            <li key={c.name} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 truncate">
                {c.name}
                <span className="ml-1 text-muted-foreground">· {c.timetable_slot}</span>
              </span>
              <span
                className={
                  c.attendance_pct < 75 ? "text-destructive" : "text-[var(--success)]"
                }
              >
                {Number(c.attendance_pct).toFixed(0)}%
              </span>
            </li>
          ))}
          {courses.length === 0 && <li className="text-xs text-muted-foreground">No courses.</li>}
        </ul>
        {lowest && lowest.attendance_pct < 75 && (
          <p className="mt-2 text-[11px] text-destructive">
            {lowest.name} is below the 75% requirement.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface-2 p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          <CalendarClock className="size-3.5" /> Upcoming
        </p>
        <ul className="mt-2 space-y-1.5">
          {events.slice(0, 3).map((e) => (
            <li key={e.title} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 truncate">{e.title}</span>
              <span className="shrink-0 text-muted-foreground">
                {new Date(e.date).toLocaleDateString([], { day: "numeric", month: "short" })}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-[color-mix(in_oklab,var(--primary)_35%,transparent)] bg-[color-mix(in_oklab,var(--primary)_8%,var(--surface-2))] p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-primary uppercase">
          <Brain className="size-3.5" /> NEXUS remembers
        </p>
        <ul className="mt-2 space-y-1.5">
          {facts.map((f) => (
            <li key={f} className="flex gap-2 text-xs text-muted-foreground">
              <span className="text-primary">•</span>
              <span className="text-foreground">{f}</span>
            </li>
          ))}
          {facts.length === 0 && (
            <li className="text-xs text-muted-foreground">Nothing remembered yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  danger,
}: {
  icon: typeof Brain;
  label: string;
  value: string;
  hint: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3">
      <p className="flex items-center gap-1.5 text-[11px] tracking-wider text-muted-foreground uppercase">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${danger ? "text-destructive" : ""}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
