import type { AgentLog } from "@/lib/nexus";

export function DebugPanel({ logs }: { logs: AgentLog[] }) {
  return (
    <div className="h-full overflow-auto p-3 font-mono text-[11px]">
      {logs.length === 0 && (
        <p className="p-2 text-muted-foreground">
          No agent-to-agent messages yet in this session.
        </p>
      )}
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-surface text-muted-foreground">
          <tr className="text-left">
            <th className="p-1.5 font-normal">time</th>
            <th className="p-1.5 font-normal">sender</th>
            <th className="p-1.5 font-normal">receiver</th>
            <th className="p-1.5 font-normal">intent</th>
            <th className="p-1.5 font-normal">status</th>
            <th className="p-1.5 font-normal">payload</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-t border-border align-top">
              <td className="p-1.5 whitespace-nowrap text-muted-foreground">
                {new Date(l.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </td>
              <td className="p-1.5 whitespace-nowrap text-primary">{l.sender_agent}</td>
              <td className="p-1.5 whitespace-nowrap">{l.receiver_agent}</td>
              <td className="p-1.5">{l.intent}</td>
              <td
                className={`p-1.5 whitespace-nowrap ${
                  l.status === "error"
                    ? "text-destructive"
                    : l.status === "active"
                      ? "text-primary"
                      : "text-[var(--success)]"
                }`}
              >
                {l.status}
              </td>
              <td className="max-w-[280px] truncate p-1.5 text-muted-foreground">
                {JSON.stringify(l.payload)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
